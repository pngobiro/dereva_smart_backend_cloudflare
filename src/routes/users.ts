import { Hono } from 'hono';
import type { Env } from '../types';

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

export default users;
