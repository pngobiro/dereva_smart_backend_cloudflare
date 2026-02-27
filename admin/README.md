# Dereva Smart Admin Dashboard

Next.js admin dashboard for managing Dereva Smart content, schools, users, and analytics.

## Features

- **Content Management**: Create and manage learning modules and quizzes
- **Schools Management**: Add and manage driving schools
- **Users Management**: View and filter user accounts
- **Analytics**: Platform statistics and insights
- **R2 Upload**: Upload JSON and media files directly to Cloudflare R2

## Tech Stack

- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS 4
- React 19
- Cloudflare Workers (Backend API)
- Cloudflare D1 (Database)
- Cloudflare R2 (Storage)

## Getting Started

### Prerequisites

- Node.js 18+ installed
- Backend deployed to Cloudflare Workers

### Installation

```bash
# Navigate to admin directory
cd admin

# Install dependencies
npm install

# Create environment file
cp .env.local.example .env.local
```

### Environment Variables

Edit `.env.local`:

```env
NEXT_PUBLIC_API_URL=https://dereva-smart-backend.pngobiro.workers.dev
```

### Development

```bash
# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to access the admin dashboard.

### Production Build

```bash
# Build for production
npm run build

# Start production server
npm start
```

## API Integration

The admin dashboard connects to the Cloudflare Workers backend via REST API:

### Endpoints Used

- `GET /api/modules` - List all learning modules
- `POST /api/admin/modules` - Create new module
- `DELETE /api/admin/modules/:id` - Delete module
- `GET /api/quizzes` - List all quizzes
- `POST /api/admin/quizzes` - Create new quiz
- `DELETE /api/admin/quizzes/:id` - Delete quiz
- `GET /api/schools` - List all schools
- `POST /api/admin/schools` - Create new school
- `DELETE /api/admin/schools/:id` - Delete school
- `GET /api/admin/users` - List all users
- `GET /api/admin/analytics` - Get platform statistics
- `POST /api/admin/upload` - Upload files to R2

## Database Schema

The admin interfaces with these D1 tables:

- `learning_modules` - Learning content modules
- `quiz_banks` - Quiz metadata
- `driving_schools` - Driving school information
- `users` - User accounts
- `quiz_attempts` - Quiz attempt records

## R2 Storage Structure

```
content/
├── B1/
│   ├── modules/
│   │   └── module-01/
│   │       └── module.json
│   └── quizzes/
│       └── quiz-01/
│           ├── quiz.json
│           └── images/
├── A/
└── C/
```

## Usage

### Creating a Quiz

1. Navigate to Content → Quizzes
2. Click "+ New Quiz"
3. Fill in quiz details:
   - ID (e.g., `quiz-b1-road-signs-001`)
   - Title, description
   - License category, topic, difficulty
   - Questions count, time limit, passing score
   - JSON URL (relative path in R2)
4. Click "Create Quiz"

### Uploading Content

1. Navigate to Content → Upload
2. Enter R2 file path (e.g., `content/B1/quizzes/quiz-01/quiz.json`)
3. Select file (JSON, PNG, JPG, MP4)
4. Click "Upload to R2"

### Managing Schools

1. Navigate to Schools
2. Click "+ New School"
3. Fill in school details
4. Set status (Active/Pending/Suspended)
5. Click "Create School"

## Deployment

### Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Deploy to Cloudflare Pages

```bash
# Build
npm run build

# Deploy to Pages
npx wrangler pages deploy out
```

## Development Notes

- All API calls go through `lib/api.ts` for centralized management
- Components use React hooks for state management
- Tailwind CSS for styling with custom color scheme
- TypeScript for type safety

## Troubleshooting

### CORS Errors

Ensure backend CORS settings include admin domain:

```typescript
cors({
  origin: ['http://localhost:3000', 'https://admin.derevasmart.com'],
  // ...
})
```

### API Connection Failed

1. Check `.env.local` has correct API URL
2. Verify backend is deployed and accessible
3. Check browser console for detailed errors

### Upload Failures

1. Verify R2 bucket permissions
2. Check file path format (must start with `content/`)
3. Ensure file size is within limits

