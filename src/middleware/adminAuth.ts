import { Context, Next } from 'hono';
import { Env } from '../index';

export interface AdminJWTPayload {
  adminId: string;
  email: string;
  role: 'SUPER_ADMIN' | 'SCHOOL_ADMIN' | 'INSTRUCTOR';
  schoolId?: string | null;
  iat: number;
  exp: number;
}

// Role permissions mapping
const ROLE_PERMISSIONS: Record<string, string[]> = {
  SUPER_ADMIN: [
    'manage_schools',
    'manage_admins',
    'manage_content',
    'manage_payments',
    'view_analytics',
    'manage_system',
    'manage_instructors',
    'manage_students',
    'view_school_analytics',
    'manage_school_settings',
    'view_assigned_students',
    'update_student_progress',
    'view_schedule',
  ],
  SCHOOL_ADMIN: [
    'manage_instructors',
    'manage_students',
    'view_school_analytics',
    'manage_school_settings',
    'view_assigned_students',
    'update_student_progress',
    'view_schedule',
  ],
  INSTRUCTOR: [
    'view_assigned_students',
    'update_student_progress',
    'view_schedule',
  ],
};

async function verifyAdminJWT(token: string, secret: string): Promise<AdminJWTPayload | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const payload = JSON.parse(atob(parts[1]));
    
    // Check expiration
    if (payload.exp && payload.exp < Date.now() / 1000) {
      return null;
    }
    
    return payload as AdminJWTPayload;
  } catch (error) {
    return null;
  }
}

export async function requireAdmin(c: Context<{ Bindings: Env }>, next: Next) {
  const authHeader = c.req.header('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized', message: 'Missing authorization header' }, 401);
  }
  
  const token = authHeader.substring(7);
  const payload = await verifyAdminJWT(token, c.env.JWT_SECRET);
  
  if (!payload) {
    return c.json({ error: 'Unauthorized', message: 'Invalid or expired token' }, 401);
  }
  
  // Verify admin user exists and is active
  const adminUser = await c.env.DB.prepare(
    'SELECT id, role, school_id, is_active FROM admin_users WHERE id = ?'
  ).bind(payload.adminId).first();
  
  if (!adminUser || adminUser.is_active !== 1) {
    return c.json({ error: 'Unauthorized', message: 'Admin account not found or inactive' }, 401);
  }
  
  // Attach admin info to context
  c.set('adminId', payload.adminId);
  c.set('adminEmail', payload.email);
  c.set('adminRole', payload.role);
  c.set('adminSchoolId', payload.schoolId);
  c.set('adminUser', adminUser);
  
  await next();
}

export function requirePermission(permission: string) {
  return async (c: Context<{ Bindings: Env }>, next: Next) => {
    const role = c.get('adminRole') as string;
    
    if (!role) {
      return c.json({ error: 'Forbidden', message: 'No role found' }, 403);
    }
    
    const permissions = ROLE_PERMISSIONS[role] || [];
    
    if (!permissions.includes(permission)) {
      return c.json({ 
        error: 'Forbidden', 
        message: `Permission '${permission}' required`,
        requiredPermission: permission,
        userRole: role,
      }, 403);
    }
    
    await next();
  };
}

export function requireRole(...allowedRoles: string[]) {
  return async (c: Context<{ Bindings: Env }>, next: Next) => {
    const role = c.get('adminRole') as string;
    
    if (!role || !allowedRoles.includes(role)) {
      return c.json({ 
        error: 'Forbidden', 
        message: 'Insufficient role',
        requiredRoles: allowedRoles,
        userRole: role,
      }, 403);
    }
    
    await next();
  };
}

// Middleware to ensure school admin can only access their school's data
export async function requireSchoolAccess(c: Context<{ Bindings: Env }>, next: Next) {
  const role = c.get('adminRole') as string;
  const adminSchoolId = c.get('adminSchoolId') as string | null;
  const requestedSchoolId = c.req.param('schoolId') || c.req.query('schoolId');
  
  // Super admin can access all schools
  if (role === 'SUPER_ADMIN') {
    await next();
    return;
  }
  
  // School admin can only access their school
  if (role === 'SCHOOL_ADMIN' && adminSchoolId !== requestedSchoolId) {
    return c.json({ 
      error: 'Forbidden', 
      message: 'Cannot access other school\'s data' 
    }, 403);
  }
  
  await next();
}

// Middleware to log admin activity
export async function logActivity(action: string, entityType?: string) {
  return async (c: Context<{ Bindings: Env }>, next: Next) => {
    const adminId = c.get('adminId') as string;
    const entityId = c.req.param('id');
    
    await next();
    
    // Log after successful request
    if (c.res.status < 400) {
      try {
        await c.env.DB.prepare(`
          INSERT INTO admin_activity_log (
            id, admin_id, action, entity_type, entity_id,
            ip_address, user_agent, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          crypto.randomUUID(),
          adminId,
          action,
          entityType || null,
          entityId || null,
          c.req.header('CF-Connecting-IP') || null,
          c.req.header('User-Agent') || null,
          Date.now()
        ).run();
      } catch (error) {
        console.error('Failed to log activity:', error);
      }
    }
  };
}
