import { Hono } from 'hono';
import type { Env } from '../types';

const schools = new Hono<{ Bindings: Env }>();

// GET /api/schools
schools.get('/', async (c) => {
  try {
    const county = c.req.query('county');
    
    let query = 'SELECT * FROM schools WHERE 1=1';
    const params: any[] = [];
    
    if (county) {
      query += ' AND county = ?';
      params.push(county);
    }
    
    query += ' ORDER BY name ASC';
    
    const { results } = await c.env.DB.prepare(query).bind(...params).all();
    
    const schools = (results || []).map((school: any) => ({
      id: school.id,
      name: school.name,
      registrationNumber: school.registration_number,
      phone: school.phone_number,
      email: school.email,
      address: school.address,
      county: school.county,
      town: school.town,
      isVerified: school.is_verified === 1,
      totalBranches: school.total_branches || 0,
      createdAt: school.created_at,
    }));
    
    return c.json({ schools });
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
    
    const schoolData = {
      id: school.id,
      name: school.name,
      registrationNumber: school.registration_number,
      phone: school.phone_number,
      email: school.email,
      address: school.address,
      county: school.county,
      town: school.town,
      isVerified: school.is_verified === 1,
      totalBranches: school.total_branches || 0,
      createdAt: school.created_at,
    };
    
    return c.json(schoolData);
  } catch (error) {
    console.error('Get school error:', error);
    return c.json({ error: 'Failed to fetch school' }, 500);
  }
});

export default schools;
