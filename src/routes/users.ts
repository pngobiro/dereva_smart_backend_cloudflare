import { Hono } from 'hono';
import type { Env } from '../types';

const users = new Hono<{ Bindings: Env }>();

users.get('/:id', async (c) => {
  const userId = c.req.param('id');
  const user = await c.env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first();
  return c.json(user || { error: 'User not found' }, user ? 200 : 404);
});

export default users;
