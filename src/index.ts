import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';

// Routes
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import contentRoutes from './routes/content';
import modulesRoutes from './routes/modules';
import questionRoutes from './routes/questions';
import quizRoutes from './routes/quizzes';
import progressRoutes from './routes/progress';
import paymentRoutes from './routes/payments';
import schoolRoutes from './routes/schools';
import tutorRoutes from './routes/tutor';
import adminRoutes from './routes/admin';

// Types
export type Env = {
  DB: D1Database;
  MEDIA_BUCKET: R2Bucket;
  CACHE: KVNamespace;
  SESSIONS: KVNamespace;
  AI: any;
  JWT_SECRET: string;
  MPESA_CONSUMER_KEY: string;
  MPESA_CONSUMER_SECRET: string;
  MPESA_SHORTCODE: string;
  MPESA_PASSKEY: string;
  GEMINI_API_KEY: string;
  AFRICASTALKING_API_KEY: string;
  AFRICASTALKING_USERNAME: string;
  AFRICASTALKING_SENDER_ID: string;
  ENVIRONMENT: string;
};

const app = new Hono<{ Bindings: Env }>();

// Middleware
app.use('*', logger());
app.use('*', prettyJSON());
app.use('*', cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'https://derevasmart.com', 'https://admin.derevasmart.com'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  exposeHeaders: ['Content-Length'],
  maxAge: 600,
  credentials: true,
}));

// Health check
app.get('/', (c) => {
  return c.json({
    status: 'ok',
    message: 'Dereva Smart API',
    version: '1.0.0',
    environment: c.env.ENVIRONMENT,
    timestamp: new Date().toISOString(),
  });
});

app.get('/health', (c) => {
  return c.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.route('/api/auth', authRoutes);
app.route('/api/users', userRoutes);
app.route('/api/content', contentRoutes);
app.route('/api/modules', modulesRoutes);
app.route('/api/questions', questionRoutes);
app.route('/api/quizzes', quizRoutes);
app.route('/api/progress', progressRoutes);
app.route('/api/payments', paymentRoutes);
app.route('/api/schools', schoolRoutes);
app.route('/api/tutor', tutorRoutes);
app.route('/api/admin', adminRoutes);

// Account Deletion Request Page
app.get('/account-deletion', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Account Deletion - Dereva Smart Kenya</title>
      <style>
        body { font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333; line-height: 1.6; }
        h1 { color: #1a73e8; }
        .form-group { margin-bottom: 15px; }
        label { display: block; margin-bottom: 5px; font-weight: bold; }
        input[type="text"] { width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box; }
        button { background: #d32f2f; color: white; border: none; padding: 10px 20px; font-size: 16px; border-radius: 4px; cursor: pointer; }
        button:hover { background: #b71c1c; }
        .alert { padding: 15px; background-color: #f8d7da; color: #721c24; border-radius: 4px; margin-bottom: 20px; }
      </style>
    </head>
    <body>
      <h1>Account Deletion Request</h1>
      <div class="alert">
        <strong>Warning:</strong> Deleting your account will permanently remove all your progress, test results, and active subscriptions. This action cannot be undone.
      </div>
      <p>To request the deletion of your account and all associated data, please enter the phone number associated with your Dereva Smart Kenya account.</p>
      
      <form action="/account-deletion" method="POST">
        <div class="form-group">
          <label for="phone">Phone Number (e.g., 0712345678):</label>
          <input type="text" id="phone" name="phone" required placeholder="Enter your phone number">
        </div>
        <button type="submit">Request Deletion</button>
      </form>
    </body>
    </html>
  `);
});

app.post('/account-deletion', async (c) => {
  const body = await c.req.parseBody();
  const phone = body.phone as string;
  
  if (!phone) {
    return c.html('<h3>Error: Phone number is required. <a href="/account-deletion">Go back</a></h3>', 400);
  }

  // Basic normalization for Kenyan phone numbers (if starting with 0, change to 254)
  let normalizedPhone = phone.replace(/\\D/g, '');
  if (normalizedPhone.startsWith('0')) {
    normalizedPhone = '254' + normalizedPhone.substring(1);
  } else if (!normalizedPhone.startsWith('254')) {
    normalizedPhone = '254' + normalizedPhone;
  }

  try {
    // Look up user
    const db = c.env.DB;
    const user = await db.prepare('SELECT id FROM users WHERE phone_number = ?').bind(normalizedPhone).first();
    
    if (!user) {
      return c.html('<h3>No account found with that phone number. <a href="/account-deletion">Go back</a></h3>', 404);
    }
    
    // We can either delete immediately or flag for deletion. For compliance, let's delete their data.
    // Assuming cascading deletes aren't fully set up, we should clean up related data first.
    await db.batch([
      db.prepare('DELETE FROM progress WHERE user_id = ?').bind(user.id),
      db.prepare('DELETE FROM quiz_results WHERE user_id = ?').bind(user.id),
      db.prepare('DELETE FROM payments WHERE user_id = ?').bind(user.id),
      db.prepare('DELETE FROM users WHERE id = ?').bind(user.id)
    ]);
    
    return c.html(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Account Deleted</title>
        <style>body { font-family: sans-serif; max-width: 600px; margin: 40px auto; padding: 20px; text-align: center; }</style>
      </head>
      <body>
        <h2 style="color: green;">Success</h2>
        <p>Your account and all associated data have been permanently deleted.</p>
      </body>
      </html>
    `);
  } catch (err) {
    console.error('Deletion error:', err);
    return c.html('<h3>An error occurred processing your request. Please try again later.</h3>', 500);
  }
});

// 404 handler
app.notFound((c) => {
  return c.json({
    error: 'Not Found',
    message: 'The requested resource was not found',
    path: c.req.path,
  }, 404);
});

// Error handler
app.onError((err, c) => {
  console.error('Error:', err);
  
  return c.json({
    error: 'Internal Server Error',
    message: c.env.ENVIRONMENT === 'development' ? err.message : 'An error occurred',
  }, 500);
});

export default app;
