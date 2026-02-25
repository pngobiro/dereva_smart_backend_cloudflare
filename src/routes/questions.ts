import { Hono } from 'hono';
import type { Env } from '../types';

const questions = new Hono<{ Bindings: Env }>();

// GET /api/questions
questions.get('/', async (c) => {
  try {
    const category = c.req.query('category');
    const limit = c.req.query('limit') || '50';
    
    if (!category) {
      return c.json({ error: 'Category parameter is required' }, 400);
    }
    
    const { results } = await c.env.DB.prepare(
      'SELECT * FROM questions WHERE license_category = ? ORDER BY RANDOM() LIMIT ?'
    ).bind(category, parseInt(limit)).all();
    
    return c.json(results || []);
  } catch (error) {
    console.error('Get questions error:', error);
    return c.json({ error: 'Failed to fetch questions' }, 500);
  }
});

// GET /api/questions/:id
questions.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    
    const question = await c.env.DB.prepare(
      'SELECT * FROM questions WHERE id = ?'
    ).bind(id).first();
    
    if (!question) {
      return c.json({ error: 'Question not found' }, 404);
    }
    
    return c.json(question);
  } catch (error) {
    console.error('Get question error:', error);
    return c.json({ error: 'Failed to fetch question' }, 500);
  }
});

export default questions;
