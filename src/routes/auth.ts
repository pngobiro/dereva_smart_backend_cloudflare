import { Hono } from 'hono';
import { z } from 'zod';
import { Env } from '../index';
import { hashPassword, verifyPassword, generateJWT, generateVerificationCode } from '../utils/auth';

const auth = new Hono<{ Bindings: Env }>();

// Validation schemas
const registerSchema = z.object({
  phoneNumber: z.string().regex(/^(254|0)[17]\d{8}$/),
  password: z.string().min(6),
  name: z.string().min(2),
  licenseCategory: z.enum(['A1', 'A2', 'A3', 'B1', 'B2', 'B3', 'C', 'D', 'E', 'F', 'G']),
  drivingSchoolId: z.string().optional(),
});

const loginSchema = z.object({
  phoneNumber: z.string(),
  password: z.string(),
});

const verifySchema = z.object({
  phoneNumber: z.string(),
  code: z.string().length(6),
});

const forgotPasswordSchema = z.object({
  phoneNumber: z.string(),
});

const resetPasswordSchema = z.object({
  phoneNumber: z.string(),
  code: z.string().length(6),
  newPassword: z.string().min(6),
});

// POST /api/auth/register
auth.post('/register', async (c) => {
  try {
    const body = await c.req.json();
    const data = registerSchema.parse(body);

    // Format phone number
    const phoneNumber = data.phoneNumber.startsWith('0')
      ? '254' + data.phoneNumber.substring(1)
      : data.phoneNumber;

    // Check if user exists
    const existing = await c.env.DB.prepare(
      'SELECT id FROM users WHERE phone_number = ?'
    ).bind(phoneNumber).first();

    if (existing) {
      return c.json({ error: 'User already exists' }, 400);
    }

    // Hash password
    const passwordHash = await hashPassword(data.password);

    // Create user
    const userId = crypto.randomUUID();
    const now = Date.now();

    await c.env.DB.prepare(`
      INSERT INTO users (
        id, phone_number, password_hash, name, target_category, driving_school_id,
        subscription_status, is_phone_verified, is_guest_mode,
        created_at, last_active_at
      ) VALUES (?, ?, ?, ?, ?, ?, 'FREE', 0, 0, ?, ?)
    `).bind(
      userId, phoneNumber, passwordHash, data.name, data.licenseCategory, data.drivingSchoolId || null,
      now, now
    ).run();

    // Generate verification code
    const code = generateVerificationCode();
    const expiresAt = now + (10 * 60 * 1000); // 10 minutes

    await c.env.DB.prepare(`
      INSERT INTO verification_codes (code, phone_number, expires_at, created_at)
      VALUES (?, ?, ?, ?)
    `).bind(code, phoneNumber, expiresAt, now).run();

    // TODO: Send SMS with verification code
    console.log(`Verification code for ${phoneNumber}: ${code}`);

    // Generate JWT
    const token = await generateJWT({ userId, phoneNumber }, c.env.JWT_SECRET);

    // Store session
    await c.env.SESSIONS.put(token, userId, {
      expirationTtl: 30 * 24 * 60 * 60, // 30 days
    });

    return c.json({
      success: true,
      user: {
        id: userId,
        phoneNumber,
        name: data.name,
        targetCategory: data.licenseCategory,
        subscriptionStatus: 'FREE',
        isPhoneVerified: false,
      },
      token,
    }, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: 'Validation error', details: error.errors }, 400);
    }
    console.error('Register error:', error);
    return c.json({ error: 'Registration failed' }, 500);
  }
});

// POST /api/auth/login
auth.post('/login', async (c) => {
  try {
    const body = await c.req.json();
    const data = loginSchema.parse(body);

    // Format phone number
    const phoneNumber = data.phoneNumber.startsWith('0')
      ? '254' + data.phoneNumber.substring(1)
      : data.phoneNumber;

    // Get user
    const user = await c.env.DB.prepare(`
      SELECT id, phone_number, password_hash, name, target_category, driving_school_id,
             subscription_status, subscription_expiry_date, is_phone_verified
      FROM users WHERE phone_number = ?
    `).bind(phoneNumber).first();

    if (!user) {
      return c.json({ error: 'Invalid credentials' }, 401);
    }

    // Verify password
    const valid = await verifyPassword(data.password, user.password_hash as string);
    if (!valid) {
      return c.json({ error: 'Invalid credentials' }, 401);
    }

    // Update last login
    await c.env.DB.prepare(
      'UPDATE users SET last_login_at = ?, last_active_at = ? WHERE id = ?'
    ).bind(Date.now(), Date.now(), user.id).run();

    // Generate JWT
    const token = await generateJWT(
      { userId: user.id as string, phoneNumber },
      c.env.JWT_SECRET
    );

    // Store session
    await c.env.SESSIONS.put(token, user.id as string, {
      expirationTtl: 30 * 24 * 60 * 60, // 30 days
    });

    return c.json({
      success: true,
      user: {
        id: user.id,
        phone_number: user.phone_number,
        name: user.name,
        target_category: user.target_category,
        driving_school_id: user.driving_school_id,
        subscription_status: user.subscription_status,
        subscription_expiry_date: user.subscription_expiry_date,
        isPhoneVerified: user.is_phone_verified === 1,
      },
      token,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: 'Validation error', details: error.errors }, 400);
    }
    console.error('Login error:', error);
    return c.json({ error: 'Login failed' }, 500);
  }
});

// POST /api/auth/verify
auth.post('/verify', async (c) => {
  try {
    const body = await c.req.json();
    const data = verifySchema.parse(body);

    const phoneNumber = data.phoneNumber.startsWith('0')
      ? '254' + data.phoneNumber.substring(1)
      : data.phoneNumber;

    // Check verification code
    const verification = await c.env.DB.prepare(`
      SELECT code, expires_at, is_used
      FROM verification_codes
      WHERE code = ? AND phone_number = ?
    `).bind(data.code, phoneNumber).first();

    if (!verification) {
      return c.json({ error: 'Invalid verification code' }, 400);
    }

    if (verification.is_used === 1) {
      return c.json({ error: 'Verification code already used' }, 400);
    }

    if ((verification.expires_at as number) < Date.now()) {
      return c.json({ error: 'Verification code expired' }, 400);
    }

    // Mark code as used
    await c.env.DB.prepare(
      'UPDATE verification_codes SET is_used = 1 WHERE code = ?'
    ).bind(data.code).run();

    // Mark phone as verified
    await c.env.DB.prepare(
      'UPDATE users SET is_phone_verified = 1 WHERE phone_number = ?'
    ).bind(phoneNumber).run();

    return c.json({ success: true, message: 'Phone verified successfully' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: 'Validation error', details: error.errors }, 400);
    }
    console.error('Verify error:', error);
    return c.json({ error: 'Verification failed' }, 500);
  }
});

// POST /api/auth/logout
auth.post('/logout', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    await c.env.SESSIONS.delete(token);
  }

  return c.json({ success: true, message: 'Logged out successfully' });
});

// POST /api/auth/forgot-password
auth.post('/forgot-password', async (c) => {
  try {
    const body = await c.req.json();
    const data = forgotPasswordSchema.parse(body);

    // Format phone number
    const phoneNumber = data.phoneNumber.startsWith('0')
      ? '254' + data.phoneNumber.substring(1)
      : data.phoneNumber;

    // Check if user exists
    const user = await c.env.DB.prepare(
      'SELECT id FROM users WHERE phone_number = ?'
    ).bind(phoneNumber).first();

    if (!user) {
      // Return success even if user doesn't exist to prevent enum attacks
      return c.json({ success: true, message: 'If the number exists, a verification code will be sent.' });
    }

    // Generate verification code
    const code = generateVerificationCode();
    const now = Date.now();
    const expiresAt = now + (10 * 60 * 1000); // 10 minutes

    await c.env.DB.prepare(`
      INSERT INTO verification_codes (code, phone_number, expires_at, created_at)
      VALUES (?, ?, ?, ?)
    `).bind(code, phoneNumber, expiresAt, now).run();

    // TODO: Send SMS with verification code
    console.log(`Password reset verification code for ${phoneNumber}: ${code}`);

    return c.json({ success: true, message: 'Verification code sent.' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: 'Validation error', details: error.errors }, 400);
    }
    console.error('Forgot password error:', error);
    return c.json({ error: 'Forgot password failed' }, 500);
  }
});

// POST /api/auth/reset-password
auth.post('/reset-password', async (c) => {
  try {
    const body = await c.req.json();
    const data = resetPasswordSchema.parse(body);

    // Format phone number
    const phoneNumber = data.phoneNumber.startsWith('0')
      ? '254' + data.phoneNumber.substring(1)
      : data.phoneNumber;

    // Check verification code
    const verification = await c.env.DB.prepare(`
      SELECT code, expires_at, is_used
      FROM verification_codes
      WHERE code = ? AND phone_number = ?
    `).bind(data.code, phoneNumber).first();

    if (!verification) {
      return c.json({ error: 'Invalid verification code' }, 400);
    }

    if (verification.is_used === 1) {
      return c.json({ error: 'Verification code already used' }, 400);
    }

    if ((verification.expires_at as number) < Date.now()) {
      return c.json({ error: 'Verification code expired' }, 400);
    }

    // Check user exists
    const user = await c.env.DB.prepare(
      'SELECT id FROM users WHERE phone_number = ?'
    ).bind(phoneNumber).first();

    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    // Hash new password
    const passwordHash = await hashPassword(data.newPassword);

    // Update password
    await c.env.DB.prepare(
      'UPDATE users SET password_hash = ? WHERE phone_number = ?'
    ).bind(passwordHash, phoneNumber).run();

    // Mark code as used
    await c.env.DB.prepare(
      'UPDATE verification_codes SET is_used = 1 WHERE code = ?'
    ).bind(data.code).run();

    // Invalidate sessions (this is a simplified approach, ideally we would delete sessions from KV)
    // We would need the user's sessions to delete them properly from SESSIONS binding
    // For now we assume they just have to re-login with the new password

    return c.json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: 'Validation error', details: error.errors }, 400);
    }
    console.error('Reset password error:', error);
    return c.json({ error: 'Reset password failed' }, 500);
  }
});

export default auth;
