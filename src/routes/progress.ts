import { Hono } from 'hono';
import type { Env } from '../types';

const progress = new Hono<{ Bindings: Env }>();

// GET /api/progress/:userId
progress.get('/:userId', async (c) => {
  try {
    const userId = c.req.param('userId');
    
    const { results } = await c.env.DB.prepare(
      'SELECT * FROM progress WHERE user_id = ? ORDER BY updated_at DESC'
    ).bind(userId).all();
    
    return c.json(results || []);
  } catch (error) {
    console.error('Get progress error:', error);
    return c.json({ error: 'Failed to fetch progress' }, 500);
  }
});

// POST /api/progress
progress.post('/', async (c) => {
  try {
    const body = await c.req.json();
    const { user_id, lesson_id, module_id, type, status, score_percentage, time_spent_minutes } = body;
    
    if (!user_id || !type || !status) {
      return c.json({ error: 'Missing required fields' }, 400);
    }
    
    const id = crypto.randomUUID();
    const now = Date.now();
    
    await c.env.DB.prepare(`
      INSERT INTO progress (
        id, user_id, lesson_id, module_id, type, status,
        score_percentage, time_spent_minutes, completed_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id, user_id, lesson_id || null, module_id || null, type, status,
      score_percentage || null, time_spent_minutes || null,
      status === 'completed' ? now : null, now, now
    ).run();
    
    return c.json({ success: true, id, message: 'Progress updated' }, 201);
  } catch (error) {
    console.error('Update progress error:', error);
    return c.json({ error: 'Failed to update progress' }, 500);
  }
});

// GET /api/progress/:userId/stats
progress.get('/:userId/stats', async (c) => {
  try {
    const userId = c.req.param('userId');
    
    const stats = await c.env.DB.prepare(`
      SELECT 
        COUNT(*) as total_activities,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_count,
        AVG(score_percentage) as average_score,
        SUM(time_spent_minutes) as total_time_minutes
      FROM progress
      WHERE user_id = ?
    `).bind(userId).first();
    
    return c.json(stats || {});
  } catch (error) {
    console.error('Get progress stats error:', error);
    return c.json({ error: 'Failed to fetch progress stats' }, 500);
  }
});

export default progress;
