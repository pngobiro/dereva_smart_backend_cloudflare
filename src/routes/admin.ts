import { Hono } from 'hono';
import type { Env } from '../types';

const admin = new Hono<{ Bindings: Env }>();

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

// Get analytics
admin.get('/analytics', async (c) => {
  try {
    const totalUsers = await c.env.DB.prepare('SELECT COUNT(*) as count FROM users').first();
    const premiumUsers = await c.env.DB.prepare("SELECT COUNT(*) as count FROM users WHERE subscription_status = 'PREMIUM'").first();
    const totalQuizzes = await c.env.DB.prepare('SELECT COUNT(*) as count FROM quiz_banks').first();
    const totalModules = await c.env.DB.prepare('SELECT COUNT(*) as count FROM modules').first();
    const totalSchools = await c.env.DB.prepare('SELECT COUNT(*) as count FROM schools').first();
    const quizAttempts = await c.env.DB.prepare('SELECT COUNT(*) as count FROM quiz_attempts').first();

    return c.json({
      totalUsers: (totalUsers as any)?.count || 0,
      premiumUsers: (premiumUsers as any)?.count || 0,
      totalQuizzes: (totalQuizzes as any)?.count || 0,
      totalModules: (totalModules as any)?.count || 0,
      totalSchools: (totalSchools as any)?.count || 0,
      quizAttempts: (quizAttempts as any)?.count || 0,
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

export default admin;
