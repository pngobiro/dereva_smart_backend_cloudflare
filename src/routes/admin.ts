import { Hono } from 'hono';
import type { Env } from '../types';
import { verifyPassword, generateJWT } from '../utils/auth';
import { z } from 'zod';
import { requireAdmin, requireSchoolAccess } from '../middleware/adminAuth';

const admin = new Hono<{ Bindings: Env }>();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

// POST /api/admin/login
admin.post('/login', async (c) => {
  try {
    const body = await c.req.json();
    const { email, password } = loginSchema.parse(body);

    const adminUser = await c.env.DB.prepare(
      'SELECT * FROM admin_users WHERE email = ? AND is_active = 1'
    ).bind(email).first();

    if (!adminUser) {
      return c.json({ error: 'Invalid credentials' }, 401);
    }

    const valid = await verifyPassword(password, adminUser.password_hash as string);
    if (!valid) {
      return c.json({ error: 'Invalid credentials' }, 401);
    }

    // Update last login
    await c.env.DB.prepare(
      'UPDATE admin_users SET last_login_at = ? WHERE id = ?'
    ).bind(Date.now(), adminUser.id).run();

    // Generate JWT
    const token = await generateJWT(
      { 
        adminId: adminUser.id as string, 
        email: adminUser.email as string,
        role: adminUser.role as string,
        schoolId: adminUser.school_id as string | null
      },
      c.env.JWT_SECRET
    );

    return c.json({
      success: true,
      user: {
        id: adminUser.id,
        email: adminUser.email,
        name: adminUser.name,
        role: adminUser.role,
        schoolId: adminUser.school_id,
      },
      token,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: 'Validation error', details: error.errors }, 400);
    }
    console.error('Admin login error:', error);
    return c.json({ error: 'Login failed' }, 500);
  }
});

// All routes below this line require admin authentication
admin.use('*', requireAdmin);

// Get current admin profile
admin.get('/profile', async (c) => {
  const adminId = c.get('adminId');
  
  try {
    const adminUser = await c.env.DB.prepare(
      'SELECT id, email, name, role, school_id FROM admin_users WHERE id = ?'
    ).bind(adminId).first();

    if (!adminUser) {
      return c.json({ error: 'Admin not found' }, 404);
    }

    return c.json(adminUser);
  } catch (error) {
    console.error('Get profile error:', error);
    return c.json({ error: 'Failed to fetch profile' }, 500);
  }
});

const changePasswordSchema = z.object({
  currentPassword: z.string(),
  newPassword: z.string().min(6),
});

// Change admin password
admin.post('/change-password', async (c) => {
  const adminId = c.get('adminId');
  
  try {
    const body = await c.req.json();
    const { currentPassword, newPassword } = changePasswordSchema.parse(body);

    const adminUser = await c.env.DB.prepare(
      'SELECT password_hash FROM admin_users WHERE id = ?'
    ).bind(adminId).first();

    if (!adminUser) {
      return c.json({ error: 'Admin not found' }, 401);
    }

    const valid = await verifyPassword(currentPassword, adminUser.password_hash as string);
    if (!valid) {
      return c.json({ error: 'Invalid current password' }, 400);
    }

    const newHash = await hashPassword(newPassword);
    
    await c.env.DB.prepare(
      'UPDATE admin_users SET password_hash = ? WHERE id = ?'
    ).bind(newHash, adminId).run();

    return c.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: 'Validation error', details: error.errors }, 400);
    }
    console.error('Change password error:', error);
    return c.json({ error: 'Failed to update password' }, 500);
  }
});

// Get all users
admin.get('/users', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT id, phone_number, name, email, target_category, driving_school_id,
             subscription_status, subscription_expiry_date, is_phone_verified,
             user_role, created_at, last_active_at
      FROM users
      ORDER BY created_at DESC
    `).all();

    const users = (results || []).map((user: any) => ({
      id: user.id,
      name: user.name,
      phoneNumber: user.phone_number,
      email: user.email,
      targetCategory: user.target_category,
      drivingSchoolId: user.driving_school_id,
      subscriptionStatus: user.subscription_status,
      subscriptionExpiryDate: user.subscription_expiry_date,
      isPhoneVerified: user.is_phone_verified === 1,
      userRole: user.user_role,
      createdAt: user.created_at,
      lastActiveAt: user.last_active_at,
    }));

    return c.json({ users });
  } catch (error) {
    console.error('Get users error:', error);
    return c.json({ error: 'Failed to fetch users' }, 500);
  }
});

// Get user by ID
admin.get('/users/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const user = await c.env.DB.prepare(`
      SELECT id, phone_number, name, email, target_category, driving_school_id,
             subscription_status, subscription_expiry_date, is_phone_verified,
             user_role, created_at, last_active_at
      FROM users WHERE id = ?
    `).bind(id).first();

    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    const userData = {
      id: user.id,
      name: user.name,
      phoneNumber: user.phone_number,
      email: user.email,
      targetCategory: user.target_category,
      drivingSchoolId: user.driving_school_id,
      subscriptionStatus: user.subscription_status,
      subscriptionExpiryDate: user.subscription_expiry_date,
      isPhoneVerified: user.is_phone_verified === 1,
      userRole: user.user_role,
      createdAt: user.created_at,
      lastActiveAt: user.last_active_at,
    };

    return c.json(userData);
  } catch (error) {
    console.error('Get user error:', error);
    return c.json({ error: 'Failed to fetch user' }, 500);
  }
});

// Get user quiz attempts
admin.get('/users/:id/attempts', async (c) => {
  try {
    const id = c.req.param('id');
    const { results } = await c.env.DB.prepare(`
      SELECT qa.id, qa.quiz_bank_id, qa.score, qa.passed, qa.completed_at, qb.title
      FROM quiz_attempts qa
      JOIN quiz_banks qb ON qa.quiz_bank_id = qb.id
      WHERE qa.user_id = ?
      ORDER BY qa.completed_at DESC
      LIMIT 50
    `).bind(id).all();

    const attempts = (results || []).map((attempt: any) => ({
      id: attempt.id,
      quizBankId: attempt.quiz_bank_id,
      quizTitle: attempt.title,
      score: attempt.score,
      passed: attempt.passed === 1,
      completedAt: attempt.completed_at,
    }));

    return c.json({ attempts });
  } catch (error) {
    console.error('Get user attempts error:', error);
    return c.json({ error: 'Failed to fetch attempts' }, 500);
  }
});

// Get user progress
admin.get('/users/:id/progress', async (c) => {
  try {
    const id = c.req.param('id');
    
    const quizStats = await c.env.DB.prepare(`
      SELECT COUNT(*) as total, AVG(score) as avg_score
      FROM quiz_attempts WHERE user_id = ?
    `).bind(id).first();

    const moduleStats = await c.env.DB.prepare(`
      SELECT COUNT(*) as completed
      FROM user_progress WHERE user_id = ? AND status = 'COMPLETED'
    `).bind(id).first();

    return c.json({
      modulesCompleted: (moduleStats as any)?.completed || 0,
      quizzesAttempted: (quizStats as any)?.total || 0,
      averageScore: Math.round((quizStats as any)?.avg_score || 0),
    });
  } catch (error) {
    console.error('Get user progress error:', error);
    return c.json({ error: 'Failed to fetch progress' }, 500);
  }
});

// Get user subscriptions
admin.get('/users/:id/subscriptions', async (c) => {
  try {
    const id = c.req.param('id');
    const { results } = await c.env.DB.prepare(`
      SELECT s.id, s.subscription_type, s.start_date, s.end_date, s.is_active, 
             s.created_at, s.payment_id, p.amount, p.status as payment_status
      FROM subscriptions s
      LEFT JOIN payments p ON s.payment_id = p.id
      WHERE s.user_id = ?
      ORDER BY s.created_at DESC
    `).bind(id).all();

    const subscriptions = (results || []).map((sub: any) => ({
      id: sub.id,
      subscriptionType: sub.subscription_type,
      startDate: sub.start_date,
      endDate: sub.end_date,
      isActive: sub.is_active === 1,
      createdAt: sub.created_at,
      paymentId: sub.payment_id,
      amount: sub.amount,
      paymentStatus: sub.payment_status,
    }));

    return c.json({ subscriptions });
  } catch (error) {
    console.error('Get user subscriptions error:', error);
    return c.json({ error: 'Failed to fetch subscriptions' }, 500);
  }
});

// Get all payments
admin.get('/payments', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT p.id, p.user_id, p.amount, p.currency, p.payment_method, 
             p.transaction_id, p.mpesa_receipt_number, p.phone_number, 
             p.status, p.subscription_type, p.subscription_months, 
             p.created_at, p.completed_at, u.name as user_name
      FROM payments p
      JOIN users u ON p.user_id = u.id
      ORDER BY p.created_at DESC
    `).all();

    const payments = (results || []).map((payment: any) => ({
      id: payment.id,
      userId: payment.user_id,
      userName: payment.user_name,
      amount: payment.amount,
      currency: payment.currency,
      paymentMethod: payment.payment_method,
      transactionId: payment.transaction_id,
      mpesaReceiptNumber: payment.mpesa_receipt_number,
      phoneNumber: payment.phone_number,
      status: payment.status,
      subscriptionType: payment.subscription_type,
      subscriptionMonths: payment.subscription_months,
      createdAt: payment.created_at,
      completedAt: payment.completed_at,
    }));

    return c.json({ payments });
  } catch (error) {
    console.error('Get payments error:', error);
    return c.json({ error: 'Failed to fetch payments' }, 500);
  }
});

// Get payment by ID
admin.get('/payments/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const payment = await c.env.DB.prepare(`
      SELECT p.*, u.name as user_name, u.email as user_email
      FROM payments p
      JOIN users u ON p.user_id = u.id
      WHERE p.id = ?
    `).bind(id).first();

    if (!payment) {
      return c.json({ error: 'Payment not found' }, 404);
    }

    const paymentData = {
      id: payment.id,
      userId: payment.user_id,
      userName: payment.user_name,
      userEmail: payment.user_email,
      amount: payment.amount,
      currency: payment.currency,
      paymentMethod: payment.payment_method,
      transactionId: payment.transaction_id,
      mpesaReceiptNumber: payment.mpesa_receipt_number,
      phoneNumber: payment.phone_number,
      status: payment.status,
      subscriptionType: payment.subscription_type,
      subscriptionMonths: payment.subscription_months,
      createdAt: payment.created_at,
      completedAt: payment.completed_at,
    };

    return c.json(paymentData);
  } catch (error) {
    console.error('Get payment error:', error);
    return c.json({ error: 'Failed to fetch payment' }, 500);
  }
});

// Get all commissions
admin.get('/commissions', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT 
        sc.id, sc.school_id, sc.payment_id, sc.user_id, sc.payment_amount,
        sc.commission_rate, sc.commission_amount, sc.status, sc.paid_at, sc.created_at,
        s.name as school_name, u.name as user_name
      FROM school_commissions sc
      JOIN schools s ON sc.school_id = s.id
      JOIN users u ON sc.user_id = u.id
      ORDER BY sc.created_at DESC
    `).all();

    const commissions = (results || []).map((comm: any) => ({
      id: comm.id,
      schoolId: comm.school_id,
      schoolName: comm.school_name,
      paymentId: comm.payment_id,
      userId: comm.user_id,
      userName: comm.user_name,
      paymentAmount: comm.payment_amount,
      commissionRate: comm.commission_rate,
      commissionAmount: comm.commission_amount,
      status: comm.status,
      paidAt: comm.paid_at,
      createdAt: comm.created_at,
    }));

    return c.json({ commissions });
  } catch (error) {
    console.error('Get commissions error:', error);
    return c.json({ error: 'Failed to fetch commissions' }, 500);
  }
});

// Get commission summary by school
admin.get('/commissions/summary', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT 
        s.id as school_id,
        s.name as school_name,
        s.commission_rate,
        COUNT(DISTINCT u.id) as student_count,
        COALESCE(SUM(sc.commission_amount), 0) as total_commission,
        COALESCE(SUM(CASE WHEN sc.status = 'PENDING' THEN sc.commission_amount ELSE 0 END), 0) as pending_commission,
        COALESCE(SUM(CASE WHEN sc.status = 'PAID' THEN sc.commission_amount ELSE 0 END), 0) as paid_commission
      FROM schools s
      LEFT JOIN users u ON u.driving_school_id = s.id
      LEFT JOIN school_commissions sc ON sc.school_id = s.id
      GROUP BY s.id, s.name, s.commission_rate
      HAVING student_count > 0 OR total_commission > 0
      ORDER BY total_commission DESC
    `).all();

    const summary = (results || []).map((school: any) => ({
      schoolId: school.school_id,
      schoolName: school.school_name,
      commissionRate: school.commission_rate,
      studentCount: school.student_count || 0,
      totalCommission: school.total_commission || 0,
      pendingCommission: school.pending_commission || 0,
      paidCommission: school.paid_commission || 0,
    }));

    return c.json({ summary });
  } catch (error) {
    console.error('Get commission summary error:', error);
    return c.json({ error: 'Failed to fetch commission summary' }, 500);
  }
});

// Mark commission as paid
admin.post('/commissions/:id/pay', async (c) => {
  try {
    const id = c.req.param('id');
    
    await c.env.DB.prepare(`
      UPDATE school_commissions 
      SET status = 'PAID', paid_at = ?
      WHERE id = ?
    `).bind(Date.now(), id).run();

    return c.json({ success: true });
  } catch (error) {
    console.error('Mark commission paid error:', error);
    return c.json({ error: 'Failed to mark commission as paid' }, 500);
  }
});

// Get analytics
admin.get('/analytics', async (c) => {
  try {
    const totalUsers = await c.env.DB.prepare('SELECT COUNT(*) as count FROM users').first();
    const premiumUsers = await c.env.DB.prepare("SELECT COUNT(*) as count FROM users WHERE subscription_status LIKE 'PREMIUM%'").first();
    const totalQuizzes = await c.env.DB.prepare('SELECT COUNT(*) as count FROM quiz_banks').first();
    const totalModules = await c.env.DB.prepare('SELECT COUNT(*) as count FROM modules').first();
    const totalSchools = await c.env.DB.prepare('SELECT COUNT(*) as count FROM schools').first();
    const quizAttempts = await c.env.DB.prepare('SELECT COUNT(*) as count FROM quiz_attempts').first();
    
    // Get total revenue
    const revenueResult = await c.env.DB.prepare(
      "SELECT SUM(amount) as total FROM payments WHERE status = 'completed'"
    ).first();
    const totalRevenue = (revenueResult as any)?.total || 0;

    // Get school statistics
    const { results: schoolResults } = await c.env.DB.prepare(`
      SELECT 
        s.id as school_id,
        s.name as school_name,
        COUNT(DISTINCT u.id) as student_count,
        COALESCE(SUM(p.amount), 0) as revenue,
        s.total_branches as branches
      FROM schools s
      LEFT JOIN users u ON u.driving_school_id = s.id
      LEFT JOIN payments p ON p.user_id = u.id AND p.status = 'completed'
      GROUP BY s.id, s.name, s.total_branches
      ORDER BY revenue DESC
    `).all();

    const schoolStats = (schoolResults || []).map((school: any) => ({
      schoolId: school.school_id,
      schoolName: school.school_name,
      studentCount: school.student_count || 0,
      revenue: school.revenue || 0,
      branches: school.branches || 0,
    }));

    return c.json({
      totalUsers: (totalUsers as any)?.count || 0,
      premiumUsers: (premiumUsers as any)?.count || 0,
      totalQuizzes: (totalQuizzes as any)?.count || 0,
      totalModules: (totalModules as any)?.count || 0,
      totalSchools: (totalSchools as any)?.count || 0,
      quizAttempts: (quizAttempts as any)?.count || 0,
      totalRevenue,
      schoolStats,
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    return c.json({ error: 'Failed to fetch analytics' }, 500);
  }
});

// Create module
admin.post('/modules', async (c) => {
  try {
    const body = await c.req.json();
    const { id, title, description, licenseCategory, topicArea, difficulty, jsonUrl, isPremium, order } = body;

    await c.env.DB.prepare(`
      INSERT INTO modules (
        id, title, description, license_category, topic_area, difficulty,
        json_url, is_premium, display_order, version, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
    `).bind(
      id, title, description, licenseCategory, topicArea, difficulty,
      jsonUrl, isPremium ? 1 : 0, order, Date.now(), Date.now()
    ).run();

    return c.json({ success: true, id });
  } catch (error) {
    console.error('Create module error:', error);
    return c.json({ error: 'Failed to create module' }, 500);
  }
});

// Delete module
admin.delete('/modules/:id', async (c) => {
  try {
    const id = c.req.param('id');
    await c.env.DB.prepare('DELETE FROM modules WHERE id = ?').bind(id).run();
    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: 'Failed to delete module' }, 500);
  }
});

// Create quiz
admin.post('/quizzes', async (c) => {
  try {
    const body = await c.req.json();
    const { id, title, description, licenseCategory, topicArea, difficulty, totalQuestions, timeLimit, passingScore, jsonUrl, isPremium, order } = body;

    await c.env.DB.prepare(`
      INSERT INTO quiz_banks (
        id, title, description, license_category, topic_area, difficulty,
        total_questions, time_limit, passing_score, json_url, is_premium,
        display_order, version, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
    `).bind(
      id, title, description, licenseCategory, topicArea, difficulty,
      totalQuestions, timeLimit, passingScore, jsonUrl, isPremium ? 1 : 0,
      order, Date.now(), Date.now()
    ).run();

    return c.json({ success: true, id });
  } catch (error) {
    console.error('Create quiz error:', error);
    return c.json({ error: 'Failed to create quiz' }, 500);
  }
});

// Delete quiz
admin.delete('/quizzes/:id', async (c) => {
  try {
    const id = c.req.param('id');
    await c.env.DB.prepare('DELETE FROM quiz_banks WHERE id = ?').bind(id).run();
    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: 'Failed to delete quiz' }, 500);
  }
});

// Create school
admin.post('/schools', async (c) => {
  try {
    const body = await c.req.json();
    const { name, registrationNumber, phone, email, address, county, town } = body;
    const id = `school-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    await c.env.DB.prepare(`
      INSERT INTO schools (
        id, name, registration_number, phone_number, email, address, county, town,
        is_verified, total_branches, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?, ?)
    `).bind(
      id, name, registrationNumber, phone, email, address, county, town, Date.now(), Date.now()
    ).run();

    return c.json({ success: true, id });
  } catch (error) {
    console.error('Create school error:', error);
    return c.json({ error: 'Failed to create school' }, 500);
  }
});

// Delete school
admin.delete('/schools/:id', async (c) => {
  try {
    const id = c.req.param('id');
    await c.env.DB.prepare('DELETE FROM schools WHERE id = ?').bind(id).run();
    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: 'Failed to delete school' }, 500);
  }
});

// Get branches for a school
admin.get('/schools/:id/branches', async (c) => {
  try {
    const schoolId = c.req.param('id');
    const { results } = await c.env.DB.prepare(`
      SELECT * FROM school_branches WHERE school_id = ? ORDER BY created_at DESC
    `).bind(schoolId).all();

    const branches = (results || []).map((branch: any) => ({
      id: branch.id,
      schoolId: branch.school_id,
      branchName: branch.branch_name,
      location: branch.location,
      contactPerson: branch.contact_person,
      phone: branch.phone,
      email: branch.email,
      address: branch.address,
      county: branch.county,
      town: branch.town,
      isActive: branch.is_active === 1,
      createdAt: branch.created_at,
      updatedAt: branch.updated_at,
    }));

    return c.json({ branches });
  } catch (error) {
    console.error('Get branches error:', error);
    return c.json({ error: 'Failed to fetch branches' }, 500);
  }
});

// Create branch
admin.post('/schools/:id/branches', async (c) => {
  try {
    const schoolId = c.req.param('id');
    const body = await c.req.json();
    const { branchName, location, contactPerson, phone, email, address, county, town } = body;
    const id = `branch-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    await c.env.DB.prepare(`
      INSERT INTO school_branches (
        id, school_id, branch_name, location, contact_person, phone, email,
        address, county, town, is_active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
    `).bind(
      id, schoolId, branchName, location, contactPerson, phone, email, address, county, town,
      Date.now(), Date.now()
    ).run();

    // Update branch count
    await c.env.DB.prepare(`
      UPDATE schools SET total_branches = (
        SELECT COUNT(*) FROM school_branches WHERE school_id = ?
      ), updated_at = ? WHERE id = ?
    `).bind(schoolId, Date.now(), schoolId).run();

    return c.json({ success: true, id });
  } catch (error) {
    console.error('Create branch error:', error);
    return c.json({ error: 'Failed to create branch' }, 500);
  }
});

// Delete branch
admin.delete('/schools/:schoolId/branches/:branchId', async (c) => {
  try {
    const schoolId = c.req.param('schoolId');
    const branchId = c.req.param('branchId');
    
    await c.env.DB.prepare('DELETE FROM school_branches WHERE id = ?').bind(branchId).run();
    
    // Update branch count
    await c.env.DB.prepare(`
      UPDATE schools SET total_branches = (
        SELECT COUNT(*) FROM school_branches WHERE school_id = ?
      ), updated_at = ? WHERE id = ?
    `).bind(schoolId, Date.now(), schoolId).run();

    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: 'Failed to delete branch' }, 500);
  }
});

// Upload to R2
admin.post('/upload', async (c) => {
  try {
    const body = await c.req.json();
    const { path, content } = body;

    await c.env.MEDIA_BUCKET.put(path, content);
    return c.json({ success: true, path });
  } catch (error) {
    console.error('Upload error:', error);
    return c.json({ error: 'Failed to upload content' }, 500);
  }
});

// Get school student progress
admin.get('/schools/:schoolId/progress', requireSchoolAccess, async (c) => {
  try {
    const schoolId = c.req.param('schoolId');
    const userId = c.req.query('userId'); // Optional filter by user
    const category = c.req.query('category'); // Optional filter by category
    const limit = parseInt(c.req.query('limit') || '50');
    
    let query = `
      SELECT 
        p.*,
        u.name as user_name,
        u.phone_number as user_phone
      FROM school_student_progress p
      JOIN users u ON p.user_id = u.id
      WHERE p.school_id = ?
    `;
    const params: any[] = [schoolId];
    
    if (userId) {
      query += ' AND p.user_id = ?';
      params.push(userId);
    }
    
    if (category) {
      query += ' AND p.category = ?';
      params.push(category);
    }
    
    query += ' ORDER BY p.completed_at DESC LIMIT ?';
    params.push(limit);
    
    const { results } = await c.env.DB.prepare(query).bind(...params).all();
    
    const progress = (results || []).map((p: any) => ({
      id: p.id,
      userId: p.user_id,
      userName: p.user_name,
      userPhone: p.user_phone,
      quizAttemptId: p.quiz_attempt_id,
      quizBankId: p.quiz_bank_id,
      quizName: p.quiz_name,
      category: p.category,
      score: p.score,
      passed: p.passed === 1,
      totalQuestions: p.total_questions,
      correctAnswers: p.correct_answers,
      timeTaken: p.time_taken,
      completedAt: p.completed_at,
    }));
    
    return c.json({ progress });
  } catch (error) {
    console.error('Get school progress error:', error);
    return c.json({ error: 'Failed to fetch school progress' }, 500);
  }
});

// Get all users associated with a school
admin.get('/schools/:schoolId/users', requireSchoolAccess, async (c) => {
  try {
    const schoolId = c.req.param('schoolId');
    const { results } = await c.env.DB.prepare(`
      SELECT id, phone_number, name, email, target_category, 
             subscription_status, subscription_expiry_date, is_phone_verified,
             user_role, created_at, last_active_at
      FROM users
      WHERE driving_school_id = ?
      ORDER BY created_at DESC
    `).bind(schoolId).all();

    const users = (results || []).map((user: any) => ({
      id: user.id,
      name: user.name,
      phoneNumber: user.phone_number,
      email: user.email,
      targetCategory: user.target_category,
      subscriptionStatus: user.subscription_status,
      subscriptionExpiryDate: user.subscription_expiry_date,
      isPhoneVerified: user.is_phone_verified === 1,
      userRole: user.user_role,
      createdAt: user.created_at,
      lastActiveAt: user.last_active_at,
    }));

    return c.json({ users });
  } catch (error) {
    console.error('Get school users error:', error);
    return c.json({ error: 'Failed to fetch school users' }, 500);
  }
});

// Get school student statistics
admin.get('/schools/:schoolId/stats', requireSchoolAccess, async (c) => {
  try {
    const schoolId = c.req.param('schoolId');
    
    // Get total students
    const totalStudents = await c.env.DB.prepare(
      'SELECT COUNT(*) as count FROM users WHERE driving_school_id = ?'
    ).bind(schoolId).first();
    
    // Get total quiz attempts
    const totalAttempts = await c.env.DB.prepare(
      'SELECT COUNT(*) as count FROM school_student_progress WHERE school_id = ?'
    ).bind(schoolId).first();
    
    // Get average score
    const avgScore = await c.env.DB.prepare(
      'SELECT AVG(score) as avg FROM school_student_progress WHERE school_id = ?'
    ).bind(schoolId).first();
    
    // Get pass rate
    const passRate = await c.env.DB.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN passed = 1 THEN 1 ELSE 0 END) as passed
      FROM school_student_progress 
      WHERE school_id = ?
    `).bind(schoolId).first();
    
    // Get top performers (last 30 days)
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    const { results: topPerformers } = await c.env.DB.prepare(`
      SELECT 
        u.id,
        u.name,
        u.phone_number,
        AVG(p.score) as avg_score,
        COUNT(p.id) as attempts,
        SUM(CASE WHEN p.passed = 1 THEN 1 ELSE 0 END) as passed_count
      FROM users u
      JOIN school_student_progress p ON u.id = p.user_id
      WHERE p.school_id = ? AND p.completed_at > ?
      GROUP BY u.id, u.name, u.phone_number
      ORDER BY avg_score DESC
      LIMIT 10
    `).bind(schoolId, thirtyDaysAgo).all();
    
    // Get category breakdown
    const { results: categoryStats } = await c.env.DB.prepare(`
      SELECT 
        category,
        COUNT(*) as attempts,
        AVG(score) as avg_score,
        SUM(CASE WHEN passed = 1 THEN 1 ELSE 0 END) as passed
      FROM school_student_progress
      WHERE school_id = ?
      GROUP BY category
    `).bind(schoolId).all();
    
    return c.json({
      totalStudents: totalStudents?.count || 0,
      totalAttempts: totalAttempts?.count || 0,
      averageScore: Math.round(avgScore?.avg || 0),
      passRate: passRate?.total ? Math.round((passRate.passed / passRate.total) * 100) : 0,
      topPerformers: (topPerformers || []).map((p: any) => ({
        id: p.id,
        name: p.name,
        phoneNumber: p.phone_number,
        avgScore: Math.round(p.avg_score),
        attempts: p.attempts,
        passedCount: p.passed_count,
      })),
      categoryStats: (categoryStats || []).map((c: any) => ({
        category: c.category,
        attempts: c.attempts,
        avgScore: Math.round(c.avg_score),
        passed: c.passed,
        passRate: Math.round((c.passed / c.attempts) * 100),
      })),
    });
  } catch (error) {
    console.error('Get school stats error:', error);
    return c.json({ error: 'Failed to fetch school stats' }, 500);
  }
});

// Get individual student progress for a school
admin.get('/schools/:schoolId/students/:userId/progress', requireSchoolAccess, async (c) => {
  try {
    const schoolId = c.req.param('schoolId');
    const userId = c.req.param('userId');
    
    // Verify student belongs to school
    const user = await c.env.DB.prepare(
      'SELECT * FROM users WHERE id = ? AND driving_school_id = ?'
    ).bind(userId, schoolId).first();
    
    if (!user) {
      return c.json({ error: 'Student not found or not linked to this school' }, 404);
    }
    
    // Get all progress records
    const { results } = await c.env.DB.prepare(`
      SELECT * FROM school_student_progress
      WHERE school_id = ? AND user_id = ?
      ORDER BY completed_at DESC
    `).bind(schoolId, userId).all();
    
    const progress = (results || []).map((p: any) => ({
      id: p.id,
      quizName: p.quiz_name,
      category: p.category,
      score: p.score,
      passed: p.passed === 1,
      totalQuestions: p.total_questions,
      correctAnswers: p.correct_answers,
      timeTaken: p.time_taken,
      completedAt: p.completed_at,
    }));
    
    // Calculate summary stats
    const totalAttempts = progress.length;
    const avgScore = totalAttempts > 0 
      ? Math.round(progress.reduce((sum, p) => sum + p.score, 0) / totalAttempts)
      : 0;
    const passedCount = progress.filter(p => p.passed).length;
    const passRate = totalAttempts > 0 ? Math.round((passedCount / totalAttempts) * 100) : 0;
    
    return c.json({
      student: {
        id: user.id,
        name: user.name,
        phoneNumber: user.phone_number,
        targetCategory: user.target_category,
      },
      summary: {
        totalAttempts,
        avgScore,
        passedCount,
        passRate,
      },
      progress,
    });
  } catch (error) {
    console.error('Get student progress error:', error);
    return c.json({ error: 'Failed to fetch student progress' }, 500);
  }
});

export default admin;
