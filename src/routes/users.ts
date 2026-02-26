import { Hono } from 'hono';
import type { Env } from '../types';
import { verifyToken } from '../utils/auth';

const users = new Hono<{ Bindings: Env }>();

users.get('/:id', async (c) => {
  const userId = c.req.param('id');
  const db = (c.env as any).DB;
  
  let user: any = await db.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first();
  
  if (user) {
    const now = Date.now();
    // Check for expiry
    if (user.subscription_status === 'PREMIUM_MONTHLY' && user.subscription_expiry_date && user.subscription_expiry_date < now) {
      console.log(`User ${userId} subscription expired. Downgrading to FREE.`);
      await db.prepare('UPDATE users SET subscription_status = ? WHERE id = ?')
        .bind('FREE', userId).run();
      
      // Refresh user object
      user = await db.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first();
    }
  }
  
  return c.json(user || { error: 'User not found' }, user ? 200 : 404);
});

// Update user category (only allowed when subscription is not active)
users.put('/:id/category', async (c) => {
  try {
    const userId = c.req.param('id');
    const authHeader = c.req.header('Authorization');
    
    if (!authHeader) {
      return c.json({ error: 'No authorization header' }, 401);
    }
    
    const token = authHeader.replace('Bearer ', '');
    const payload = await verifyToken(token, c.env.JWT_SECRET);
    
    if (!payload || payload.userId !== userId) {
      return c.json({ error: 'Unauthorized' }, 403);
    }
    
    const { targetCategory } = await c.req.json();
    
    if (!targetCategory) {
      return c.json({ error: 'Target category is required' }, 400);
    }
    
    // Check if user has active subscription
    const user: any = await c.env.DB.prepare(
      'SELECT subscription_status, subscription_expiry_date FROM users WHERE id = ?'
    ).bind(userId).first();
    
    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }
    
    const now = Date.now();
    const hasActiveSubscription = user.subscription_status === 'PREMIUM_MONTHLY' && 
                                   user.subscription_expiry_date && 
                                   user.subscription_expiry_date > now;
    
    if (hasActiveSubscription) {
      return c.json({ 
        error: 'Cannot change category while subscription is active. Please wait until subscription expires.' 
      }, 403);
    }
    
    // Update category
    await c.env.DB.prepare(
      'UPDATE users SET target_category = ?, updated_at = ? WHERE id = ?'
    ).bind(targetCategory, now, userId).run();
    
    return c.json({ 
      success: true, 
      message: 'Category updated successfully' 
    });
    
  } catch (error) {
    console.error('Update category error:', error);
    return c.json({ error: 'Failed to update category' }, 500);
  }
});

export default users;
