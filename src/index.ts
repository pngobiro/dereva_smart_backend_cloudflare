import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';

// Routes
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import contentRoutes from './routes/content';
import questionRoutes from './routes/questions';
import quizRoutes from './routes/quizzes';
import progressRoutes from './routes/progress';
import paymentRoutes from './routes/payments';
import schoolRoutes from './routes/schools';
import tutorRoutes from './routes/tutor';

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
  origin: ['http://localhost:3000', 'https://derevasmart.com', 'https://admin.derevasmart.com'],
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
app.route('/api/questions', questionRoutes);
app.route('/api/quizzes', quizRoutes);
app.route('/api/progress', progressRoutes);
app.route('/api/payments', paymentRoutes);
app.route('/api/schools', schoolRoutes);
app.route('/api/tutor', tutorRoutes);

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
