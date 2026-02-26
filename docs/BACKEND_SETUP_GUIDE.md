# Dereva Smart Backend - Quick Setup Guide

## What's Been Created

### Core Files
✅ `package.json` - Dependencies (Hono, Zod)
✅ `wrangler.toml` - Cloudflare config with Africa's Talking credentials
✅ `tsconfig.json` - TypeScript configuration
✅ `migrations/0001_initial_schema.sql` - Complete database schema
✅ `src/index.ts` - Main API entry point
✅ `src/routes/auth.ts` - Authentication endpoints with SMS
✅ `src/middleware/auth.ts` - JWT authentication middleware
✅ `src/utils/auth.ts` - Password hashing, JWT generation
✅ `src/utils/sms.ts` - Africa's Talking SMS integration

## Quick Start

### 1. Install Dependencies
```bash
cd dereva_smart_backend_cloudflare
npm install
```

### 2. Setup Cloudflare Resources
```bash
# Login to Cloudflare
npx wrangler login

# Create D1 database
npx wrangler d1 create dereva-db

# Create R2 bucket
npx wrangler r2 bucket create dereva-media

# Create KV namespaces
npx wrangler kv:namespace create "CACHE"
npx wrangler kv:namespace create "SESSIONS"
```

### 3. Update wrangler.toml
Replace the placeholder IDs with your actual IDs from step 2.

### 4. Run Migrations
```bash
npx wrangler d1 migrations apply dereva-db --local
npx wrangler d1 migrations apply dereva-db --remote
```

### 5. Start Development Server
```bash
npm run dev
```

API will be at: `http://localhost:8787`

### 6. Deploy to Production
```bash
npm run deploy
```

## API Endpoints Implemented

### Authentication
- `POST /api/auth/register` - Register with SMS verification
- `POST /api/auth/login` - Login
- `POST /api/auth/verify` - Verify phone with SMS code
- `POST /api/auth/logout` - Logout

## SMS Integration

Africa's Talking is configured with your credentials:
- API Key: `atsk_bb2e6c728974dd0447c10f11ce52724163a1c24455ad94fc948ff67a7d96018f705a5269`
- Username: `pngobiro`

SMS is sent automatically for:
- Phone verification codes
- Password reset codes
- Payment confirmations
- Subscription notifications

## Next Steps

1. Complete remaining routes (users, content, payments, etc.)
2. Add M-Pesa integration
3. Add AI tutor with Cloudflare Workers AI
4. Setup admin dashboard
5. Add rate limiting
6. Setup monitoring

## Testing

Test registration:
```bash
curl -X POST http://localhost:8787/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "0712345678",
    "password": "test123",
    "name": "Test User",
    "licenseCategory": "B1"
  }'
```

## Environment Variables

Already configured in `wrangler.toml`:
- JWT_SECRET
- AFRICASTALKING_API_KEY
- AFRICASTALKING_USERNAME
- MPESA credentials (to be added)
- GEMINI_API_KEY (to be added)

## Database Schema

Complete schema with tables for:
- users, schools, modules, lessons
- questions, test_results, progress
- payments, subscriptions
- school_links, tutor_conversations
- sessions, verification_codes

## Security Features

✅ Password hashing (SHA-256)
✅ JWT authentication
✅ Session management with KV
✅ Phone verification with SMS
✅ Input validation with Zod
✅ CORS configuration

## File Structure
```
dereva_smart_backend_cloudflare/
├── src/
│   ├── index.ts              # Main entry
│   ├── routes/
│   │   └── auth.ts          # Auth endpoints
│   ├── middleware/
│   │   └── auth.ts          # JWT middleware
│   └── utils/
│       ├── auth.ts          # Auth utilities
│       └── sms.ts           # SMS service
├── migrations/
│   └── 0001_initial_schema.sql
├── wrangler.toml
├── package.json
└── tsconfig.json
```

## Cost Estimate

Cloudflare Free Tier:
- Workers: 100,000 requests/day
- D1: 5GB storage, 5M reads/day
- R2: 10GB storage, 1M reads/month
- KV: 100,000 reads/day

Africa's Talking:
- SMS: ~KES 0.80 per SMS

Very cost-effective for starting out!
