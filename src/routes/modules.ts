import { Hono } from 'hono';
import type { Env } from '../types';

const modules = new Hono<{ Bindings: Env }>();

// GET /api/modules
modules.get('/', async (c) => {
  try {
    const category = c.req.query('category');
    
    let query = 'SELECT * FROM modules';
    const params: any[] = [];
    
    if (category) {
      query += ' WHERE license_category = ?';
      params.push(category);
    }
    
    query += ' ORDER BY order_index ASC';
    
    const { results } = await c.env.DB.prepare(query).bind(...params).all();
    
    const modulesList = (results || []).map((module: any) => ({
      id: module.id,
      title: module.title,
      description: module.description,
      licenseCategory: module.license_category,
      topicArea: module.topic_area || null,
      difficulty: module.difficulty || null,
      thumbnailUrl: module.thumbnail_url,
      estimatedDuration: module.estimated_duration,
      lessonCount: module.lesson_count,
      downloadSize: module.download_size,
      jsonUrl: module.json_url || null,
      isPremium: module.requires_subscription === 1,
      order: module.order_index,
      createdAt: module.created_at,
      updatedAt: module.updated_at,
    }));
    
    return c.json({ modules: modulesList });
  } catch (error) {
    console.error('Get modules error:', error);
    return c.json({ error: 'Failed to fetch modules' }, 500);
  }
});

export default modules;
