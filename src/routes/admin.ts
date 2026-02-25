import { Hono } from 'hono';
import { z } from 'zod';
import { Env } from '../index';
import { hashPassword, generateJWT } from '../utils/auth';
import { requireAdmin, requirePermission } from '../middleware/adminAuth';

const admin = new Hono<{ Bindings: Env }>();

// Validation schemas
const createSchoolSchema = z.object({
  name: z.string().min(2),
  registrationNumber: z.string(),
  phoneNumber: z.string(),
  email: z.string().email().optional(),
  address: z.string(),
  county: z.string(),
  town: z.string(),
  commissionRate: z.number().min(0).max(1).default(0.15),
  licenseCategories: z.array(z.enum(['A1', 'A2', 'A3', 'B1', 'B2', 'B3', 'C', 'D', 'E', 'F', 'G'])),
  adminUser: z.object({
    email: z.string().email(),
    name: z.string(),
    phoneNumber: z.string().optional(),
  }),
});

const createAdminSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  phoneNumber: z.string().optional(),
  role: z.enum(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'INSTRUCTOR']),
  schoolId: z.string().optional(),
});

// Admin Authentication
admin.post('/auth/login', async (c) => {
  try {
    const { email, password } = await c.req.json();
    
    // Get admin user
    const adminUser = await c.env.DB.prepare(`
      SELECT id, email, password_hash, name, role, school_id, is_active
      FROM admin_users WHERE email = ?
    `).bind(email).first();
    
    if (!adminUser || adminUser.is_active !== 1) {
      return c.json({ error: 'Invalid credentials' }, 401);
    }
    
    // Verify password (implement proper verification)
    // const valid = await verifyPassword(password, adminUser.password_hash);
    
    // Update last login
    await c.env.DB.prepare(
      'UPDATE admin_users SET last_login_at = ? WHERE id = ?'
    ).bind(Date.now(), adminUser.id).run();
    
    // Generate JWT
    const token = await generateJWT({
      adminId: adminUser.id as string,
      email: adminUser.email as string,
      role: adminUser.role as string,
      schoolId: adminUser.school_id as string | null,
    }, c.env.JWT_SECRET);
    
    // Log activity
    await c.env.DB.prepare(`
      INSERT INTO admin_activity_log (id, admin_id, action, created_at)
      VALUES (?, ?, 'LOGIN', ?)
    `).bind(crypto.randomUUID(), adminUser.id, Date.now()).run();
    
    return c.json({
      success: true,
      admin: {
        id: adminUser.id,
        email: adminUser.email,
        name: adminUser.name,
        role: adminUser.role,
        schoolId: adminUser.school_id,
      },
      token,
    });
  } catch (error) {
    console.error('Admin login error:', error);
    return c.json({ error: 'Login failed' }, 500);
  }
});

// School Management (Super Admin only)
admin.get('/schools', requireAdmin, requirePermission('manage_schools'), async (c) => {
  try {
    const { page = '1', limit = '20', search, county } = c.req.query();
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    let query = 'SELECT * FROM schools WHERE 1=1';
    const params: any[] = [];
    
    if (search) {
      query += ' AND (name LIKE ? OR registration_number LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    
    if (county) {
      query += ' AND county = ?';
      params.push(county);
    }
    
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);
    
    const schools = await c.env.DB.prepare(query).bind(...params).all();
    
    // Get total count
    const countResult = await c.env.DB.prepare(
      'SELECT COUNT(*) as total FROM schools'
    ).first();
    
    return c.json({
      schools: schools.results,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countResult?.total || 0,
      },
    });
  } catch (error) {
    console.error('Get schools error:', error);
    return c.json({ error: 'Failed to fetch schools' }, 500);
  }
});

admin.post('/schools', requireAdmin, requirePermission('manage_schools'), async (c) => {
  try {
    const body = await c.req.json();
    const data = createSchoolSchema.parse(body);
    const adminId = c.get('adminId');
    
    // Check if registration number exists
    const existing = await c.env.DB.prepare(
      'SELECT id FROM schools WHERE registration_number = ?'
    ).bind(data.registrationNumber).first();
    
    if (existing) {
      return c.json({ error: 'Registration number already exists' }, 400);
    }
    
    const schoolId = crypto.randomUUID();
    const now = Date.now();
    
    // Create school
    await c.env.DB.prepare(`
      INSERT INTO schools (
        id, name, registration_number, phone_number, email,
        address, county, town, commission_rate, is_verified,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
    `).bind(
      schoolId, data.name, data.registrationNumber, data.phoneNumber,
      data.email, data.address, data.county, data.town,
      data.commissionRate, now, now
    ).run();
    
    // Add license categories
    for (const category of data.licenseCategories) {
      await c.env.DB.prepare(`
        INSERT INTO school_license_categories (id, school_id, license_category, is_active, created_at)
        VALUES (?, ?, ?, 1, ?)
      `).bind(crypto.randomUUID(), schoolId, category, now).run();
    }
    
    // Create school admin user
    const adminUserId = crypto.randomUUID();
    const tempPassword = Math.random().toString(36).slice(-8);
    const passwordHash = await hashPassword(tempPassword);
    
    await c.env.DB.prepare(`
      INSERT INTO admin_users (
        id, email, password_hash, name, phone_number, role,
        school_id, is_active, created_at, created_by
      ) VALUES (?, ?, ?, ?, ?, 'SCHOOL_ADMIN', ?, 1, ?, ?)
    `).bind(
      adminUserId, data.adminUser.email, passwordHash, data.adminUser.name,
      data.adminUser.phoneNumber, schoolId, now, adminId
    ).run();
    
    // Log activity
    await c.env.DB.prepare(`
      INSERT INTO admin_activity_log (id, admin_id, action, entity_type, entity_id, details, created_at)
      VALUES (?, ?, 'CREATE_SCHOOL', 'school', ?, ?, ?)
    `).bind(
      crypto.randomUUID(), adminId, schoolId,
      JSON.stringify({ name: data.name, registrationNumber: data.registrationNumber }),
      now
    ).run();
    
    // TODO: Send welcome email to school admin with credentials
    
    return c.json({
      success: true,
      school: {
        id: schoolId,
        name: data.name,
        registrationNumber: data.registrationNumber,
      },
      adminUser: {
        id: adminUserId,
        email: data.adminUser.email,
        tempPassword, // In production, send via email only
      },
    }, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: 'Validation error', details: error.errors }, 400);
    }
    console.error('Create school error:', error);
    return c.json({ error: 'Failed to create school' }, 500);
  }
});

admin.get('/schools/:id', requireAdmin, async (c) => {
  try {
    const schoolId = c.req.param('id');
    const adminRole = c.get('adminRole');
    const adminSchoolId = c.get('adminSchoolId');
    
    // Check access
    if (adminRole !== 'SUPER_ADMIN' && adminSchoolId !== schoolId) {
      return c.json({ error: 'Forbidden' }, 403);
    }
    
    // Get school details
    const school = await c.env.DB.prepare(
      'SELECT * FROM schools WHERE id = ?'
    ).bind(schoolId).first();
    
    if (!school) {
      return c.json({ error: 'School not found' }, 404);
    }
    
    // Get license categories
    const categories = await c.env.DB.prepare(`
      SELECT license_category, is_active FROM school_license_categories
      WHERE school_id = ?
    `).bind(schoolId).all();
    
    // Get instructor count
    const instructorCount = await c.env.DB.prepare(`
      SELECT COUNT(*) as count FROM school_instructors
      WHERE school_id = ? AND is_active = 1
    `).bind(schoolId).first();
    
    // Get student count
    const studentCount = await c.env.DB.prepare(`
      SELECT COUNT(DISTINCT user_id) as count FROM school_links
      WHERE school_id = ? AND status = 'ACTIVE'
    `).bind(schoolId).first();
    
    return c.json({
      ...school,
      licenseCategories: categories.results,
      instructorCount: instructorCount?.count || 0,
      studentCount: studentCount?.count || 0,
    });
  } catch (error) {
    console.error('Get school error:', error);
    return c.json({ error: 'Failed to fetch school' }, 500);
  }
});

admin.put('/schools/:id', requireAdmin, requirePermission('manage_schools'), async (c) => {
  try {
    const schoolId = c.req.param('id');
    const body = await c.req.json();
    const adminId = c.get('adminId');
    
    // Update school
    await c.env.DB.prepare(`
      UPDATE schools SET
        name = COALESCE(?, name),
        phone_number = COALESCE(?, phone_number),
        email = COALESCE(?, email),
        address = COALESCE(?, address),
        county = COALESCE(?, county),
        town = COALESCE(?, town),
        updated_at = ?
      WHERE id = ?
    `).bind(
      body.name, body.phoneNumber, body.email, body.address,
      body.county, body.town, Date.now(), schoolId
    ).run();
    
    // Log activity
    await c.env.DB.prepare(`
      INSERT INTO admin_activity_log (id, admin_id, action, entity_type, entity_id, created_at)
      VALUES (?, ?, 'UPDATE_SCHOOL', 'school', ?, ?)
    `).bind(crypto.randomUUID(), adminId, schoolId, Date.now()).run();
    
    return c.json({ success: true, message: 'School updated successfully' });
  } catch (error) {
    console.error('Update school error:', error);
    return c.json({ error: 'Failed to update school' }, 500);
  }
});

admin.post('/schools/:id/verify', requireAdmin, requirePermission('manage_schools'), async (c) => {
  try {
    const schoolId = c.req.param('id');
    const adminId = c.get('adminId');
    
    await c.env.DB.prepare(
      'UPDATE schools SET is_verified = 1, updated_at = ? WHERE id = ?'
    ).bind(Date.now(), schoolId).run();
    
    // Log activity
    await c.env.DB.prepare(`
      INSERT INTO admin_activity_log (id, admin_id, action, entity_type, entity_id, created_at)
      VALUES (?, ?, 'VERIFY_SCHOOL', 'school', ?, ?)
    `).bind(crypto.randomUUID(), adminId, schoolId, Date.now()).run();
    
    return c.json({ success: true, message: 'School verified successfully' });
  } catch (error) {
    console.error('Verify school error:', error);
    return c.json({ error: 'Failed to verify school' }, 500);
  }
});

// Analytics (Super Admin)
admin.get('/analytics/overview', requireAdmin, requirePermission('view_analytics'), async (c) => {
  try {
    // Get total schools
    const schoolCount = await c.env.DB.prepare(
      'SELECT COUNT(*) as count FROM schools'
    ).first();
    
    // Get total students
    const studentCount = await c.env.DB.prepare(
      'SELECT COUNT(*) as count FROM users WHERE user_role = "LEARNER"'
    ).first();
    
    // Get total revenue (this month)
    const now = Date.now();
    const monthStart = new Date(new Date().setDate(1)).getTime();
    const revenue = await c.env.DB.prepare(`
      SELECT SUM(amount) as total FROM payments
      WHERE status = 'COMPLETED' AND created_at >= ?
    `).bind(monthStart).first();
    
    // Get active subscriptions
    const activeSubscriptions = await c.env.DB.prepare(`
      SELECT COUNT(*) as count FROM subscriptions
      WHERE is_active = 1 AND (end_date IS NULL OR end_date > ?)
    `).bind(now).first();
    
    return c.json({
      totalSchools: schoolCount?.count || 0,
      totalStudents: studentCount?.count || 0,
      monthlyRevenue: revenue?.total || 0,
      activeSubscriptions: activeSubscriptions?.count || 0,
    });
  } catch (error) {
    console.error('Analytics error:', error);
    return c.json({ error: 'Failed to fetch analytics' }, 500);
  }
});

export default admin;
