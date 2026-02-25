import { Hono } from 'hono';
import type { Env } from '../types';

const schools = new Hono<{ Bindings: Env }>();

// GET /api/schools
schools.get('/', async (c) => {
  try {
    const location = c.req.query('location');
    const category = c.req.query('category');
    
    let query = 'SELECT * FROM schools WHERE is_verified = 1';
    const params: any[] = [];
    
    if (location) {
      query += ' AND (county LIKE ? OR town LIKE ?)';
      params.push(`%${location}%`, `%${location}%`);
    }
    
    query += ' ORDER BY name ASC';
    
    const stmt = c.env.DB.prepare(query);
    const { results } = params.length > 0
      ? await stmt.bind(...params).all()
      : await stmt.all();
    
    return c.json(results || []);
  } catch (error) {
    console.error('Get schools error:', error);
    return c.json({ error: 'Failed to fetch schools' }, 500);
  }
});

// GET /api/schools/:id
schools.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    
    const school = await c.env.DB.prepare(
      'SELECT * FROM schools WHERE id = ?'
    ).bind(id).first();
    
    if (!school) {
      return c.json({ error: 'School not found' }, 404);
    }
    
    return c.json(school);
  } catch (error) {
    console.error('Get school error:', error);
    return c.json({ error: 'Failed to fetch school' }, 500);
  }
});

export default schools;
