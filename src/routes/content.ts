import { Hono } from 'hono';
import type { Env } from '../types';

const content = new Hono<{ Bindings: Env }>();

// GET /api/content/modules
content.get('/modules', async (c) => {
  try {
    const category = c.req.query('category');
    
    let query = 'SELECT * FROM modules';
    const params: any[] = [];
    
    if (category) {
      query += ' WHERE license_category = ?';
      params.push(category);
    }
    
    query += ' ORDER BY order_index';
    
    const stmt = c.env.DB.prepare(query);
    const { results } = params.length > 0 
      ? await stmt.bind(...params).all()
      : await stmt.all();
    
    return c.json(results || []);
  } catch (error) {
    console.error('Get modules error:', error);
    return c.json({ error: 'Failed to fetch modules' }, 500);
  }
});

// GET /api/content/lessons/:moduleId
content.get('/lessons/:moduleId', async (c) => {
  try {
    const moduleId = c.req.param('moduleId');
    
    const { results } = await c.env.DB.prepare(
      'SELECT * FROM lessons WHERE module_id = ? ORDER BY order_index'
    ).bind(moduleId).all();
    
    return c.json(results || []);
  } catch (error) {
    console.error('Get lessons error:', error);
    return c.json({ error: 'Failed to fetch lessons' }, 500);
  }
});

// GET /api/content/lesson/:lessonId
content.get('/lesson/:lessonId', async (c) => {
  try {
    const lessonId = c.req.param('lessonId');
    
    const lesson = await c.env.DB.prepare(
      'SELECT * FROM lessons WHERE id = ?'
    ).bind(lessonId).first();
    
    if (!lesson) {
      return c.json({ error: 'Lesson not found' }, 404);
    }
    
    return c.json(lesson);
  } catch (error) {
    console.error('Get lesson error:', error);
    return c.json({ error: 'Failed to fetch lesson' }, 500);
  }
});

export default content;
