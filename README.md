# Dereva Smart Backend - Cloudflare

A serverless backend for the Dereva Smart driving school platform, built on Cloudflare's edge infrastructure.

## Architecture

### Services Used
- **Cloudflare Workers**: Serverless API endpoints
- **D1 Database**: SQL database for structured data
- **R2 Storage**: Object storage for media files (videos, images, audio)
- **KV Storage**: Key-value store for caching and sessions
- **Workers AI**: AI-powered tutor using Llama models
- **Durable Objects**: Real-time features (future)

### Features
- RESTful API for mobile apps and web dashboard
- Authentication & Authorization (JWT)
- User management (learners, instructors, schools)
- Content management (modules, lessons, questions)
- Payment processing (M-Pesa integration)
- Progress tracking
- AI tutor integration
- Media file management
- School management dashboard

## Project Structure

```
dereva_smart_backend_cloudflare/
├── src/
│   ├── index.ts                 # Main entry point
│   ├── routes/                  # API routes
│   │   ├── auth.ts             # Authentication endpoints
│   │   ├── users.ts            # User management
│   │   ├── content.ts          # Content management
│   │   ├── questions.ts        # Questions & tests
│   │   ├── progress.ts         # Progress tracking
│   │   ├── payments.ts         # Payment processing
│   │   ├── schools.ts          # School management
│   │   └── tutor.ts            # AI tutor
│   ├── middleware/              # Middleware functions
│   │   ├── auth.ts             # JWT verification
│   │   ├── cors.ts             # CORS handling
│   │   └── rateLimit.ts        # Rate limiting
│   ├── services/                # Business logic
│   │   ├── authService.ts
│   │   ├── contentService.ts
│   │   ├── paymentService.ts
│   │   └── tutorService.ts
│   ├── models/                  # Data models & types
│   ├── utils/                   # Utility functions
│   └── db/                      # Database utilities
├── migrations/                  # D1 database migrations
├── tests/                       # Test files
├── wrangler.toml               # Cloudflare configuration
├── package.json
└── tsconfig.json
```

## Setup

### Prerequisites
- Node.js 18+
- Cloudflare account
- Wrangler CLI

### Installation

1. Install dependencies:
```bash
npm install
```

2. Login to Cloudflare:
```bash
npx wrangler login
```

3. Create D1 database:
```bash
npx wrangler d1 create dereva-db
```

4. Create R2 bucket:
```bash
npx wrangler r2 bucket create dereva-media
```

5. Create KV namespaces:
```bash
npx wrangler kv:namespace create "CACHE"
npx wrangler kv:namespace create "SESSIONS"
```

6. Update `wrangler.toml` with your IDs

7. Run migrations:
```bash
npm run db:migrate
```

### Development

Start local development server:
```bash
npm run dev
```

The API will be available at `http://localhost:8787`

### Deployment

Deploy to Cloudflare:
```bash
npm run deploy
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/verify` - Verify phone number
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/logout` - Logout

### Users
- `GET /api/users/me` - Get current user
- `PUT /api/users/me` - Update profile
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id/category` - Update license category

### Content
- `GET /api/content/modules` - List modules
- `GET /api/content/modules/:id` - Get module details
- `GET /api/content/lessons/:id` - Get lesson details
- `POST /api/content/modules/:id/download` - Request module download

### Questions
- `GET /api/questions` - List questions
- `GET /api/questions/random` - Get random questions for test
- `POST /api/tests/submit` - Submit test results

### Progress
- `GET /api/progress` - Get user progress
- `POST /api/progress/lesson` - Update lesson progress
- `GET /api/progress/stats` - Get statistics

### Payments
- `POST /api/payments/mpesa/initiate` - Initiate M-Pesa payment
- `POST /api/payments/mpesa/callback` - M-Pesa callback
- `GET /api/payments/history` - Payment history

### Schools
- `GET /api/schools` - List schools
- `GET /api/schools/:id` - Get school details
- `POST /api/schools/:id/link` - Link user to school
- `GET /api/schools/:id/students` - Get school students

### AI Tutor
- `POST /api/tutor/ask` - Ask AI tutor a question
- `GET /api/tutor/history` - Get conversation history

## Database Schema

See `migrations/` folder for complete schema.

### Main Tables
- `users` - User accounts
- `schools` - Driving schools
- `modules` - Learning modules
- `lessons` - Individual lessons
- `questions` - Test questions
- `test_results` - Test submissions
- `progress` - Learning progress
- `payments` - Payment records
- `subscriptions` - User subscriptions

## Environment Variables

Required environment variables in `wrangler.toml`:

- `JWT_SECRET` - Secret for JWT tokens
- `MPESA_CONSUMER_KEY` - M-Pesa API key
- `MPESA_CONSUMER_SECRET` - M-Pesa API secret
- `MPESA_SHORTCODE` - M-Pesa business shortcode
- `MPESA_PASSKEY` - M-Pesa passkey
- `GEMINI_API_KEY` - Google Gemini API key (for AI tutor)

## Security

- JWT-based authentication
- Rate limiting on all endpoints
- CORS configuration
- Input validation with Zod
- SQL injection prevention
- XSS protection

## Performance

- Edge caching with KV
- CDN delivery for media files
- Optimized database queries
- Connection pooling
- Lazy loading

## Monitoring

View logs:
```bash
npm run tail
```

## Testing

Run tests:
```bash
npm test
```

## License

MIT
