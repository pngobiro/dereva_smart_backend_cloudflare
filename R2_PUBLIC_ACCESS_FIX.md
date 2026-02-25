# R2 Public Access Fix ✅

## Issue
The R2 bucket `dereva-media` had public access disabled, causing 401 Unauthorized errors when the Android app tried to load lesson content.

## Solution
Enabled public access on the R2 bucket and updated database with the correct public URL.

## Steps Taken

### 1. Identified the Problem
```bash
curl -I "https://pub-8bd8024b277632ef32a837c352da4229.r2.dev/content/A1/01-motorcycle-basics/lesson-01-introduction/index.html"
# Result: HTTP/1.1 401 Unauthorized
```

### 2. Checked R2 Bucket Status
```bash
wrangler r2 bucket dev-url get dereva-media
# Result: Public access via the r2.dev URL is disabled.
```

### 3. Enabled Public Access
```bash
wrangler r2 bucket dev-url enable dereva-media
# Result: Public access enabled at 'https://pub-16856a23f68347f2ae1c5b71791e9070.r2.dev'
```

### 4. Verified Content Accessibility
```bash
curl -I "https://pub-16856a23f68347f2ae1c5b71791e9070.r2.dev/content/A1/01-motorcycle-basics/lesson-01-introduction/index.html"
# Result: HTTP/1.1 200 OK
```

### 5. Updated Database
Created migration `0004_fix_r2_public_url.sql` to update lesson URLs:

```sql
UPDATE lessons 
SET content_url = 'https://pub-16856a23f68347f2ae1c5b71791e9070.r2.dev/content/A1/01-motorcycle-basics/lesson-01-introduction/'
WHERE id = 'les-a1-welcome';

UPDATE lessons 
SET content_url = 'https://pub-16856a23f68347f2ae1c5b71791e9070.r2.dev/content/A1/02-road-safety/lesson-01-defensive-riding/'
WHERE id = 'les-a1-safety';
```

Applied to remote database:
```bash
wrangler d1 migrations apply dereva-smart --remote
```

### 6. Verified API Response
```bash
curl https://dereva-smart-backend.pngobiro.workers.dev/api/content/lessons/mod-a1-intro | jq
```

Result: All lessons now return correct public URLs ✅

## Current Status

### R2 Bucket Configuration
- **Bucket Name**: `dereva-media`
- **Public Access**: Enabled ✅
- **Public URL**: `https://pub-16856a23f68347f2ae1c5b71791e9070.r2.dev/`

### Content URLs
- **Motorcycle Basics**: https://pub-16856a23f68347f2ae1c5b71791e9070.r2.dev/content/A1/01-motorcycle-basics/lesson-01-introduction/
- **Road Safety**: https://pub-16856a23f68347f2ae1c5b71791e9070.r2.dev/content/A1/02-road-safety/lesson-01-defensive-riding/

### API Endpoints
- **Modules**: `GET /api/content/modules?category=A1` ✅
- **Lessons**: `GET /api/content/lessons/mod-a1-intro` ✅

## Testing

### Test Content Access
```bash
# Test HTML content
curl -s "https://pub-16856a23f68347f2ae1c5b71791e9070.r2.dev/content/A1/01-motorcycle-basics/lesson-01-introduction/index.html" | head -n 20

# Test API
curl -s https://dereva-smart-backend.pngobiro.workers.dev/api/content/lessons/mod-a1-intro | jq '.[] | {id, title, content_url}'
```

### Test in Android App
1. Open Dereva Smart Android app
2. Select "A1 - Motorcycle" category as guest
3. Navigate to "Learning Modules"
4. Click "Motorcycle Basics" module
5. Click "Welcome to Motorcycle Training" lesson
6. Verify HTML content loads with videos and images ✅

## Important Notes

### For Future Content Uploads
When uploading new content to R2, use the correct public URL:
```
https://pub-16856a23f68347f2ae1c5b71791e9070.r2.dev/
```

### Content Management Script
The `manage_content.js` script automatically uploads to the correct path:
```bash
npm run content:sync
```

Files are uploaded to: `dereva-media/content/{category}/{module}/{lesson}/`

### Database Updates
When adding new lessons, use the correct R2 public URL format:
```sql
INSERT INTO lessons (id, module_id, title, content_type, content_url, duration, requires_subscription)
VALUES (
  'les-a1-new',
  'mod-a1-intro',
  'New Lesson',
  'interactive',
  'https://pub-16856a23f68347f2ae1c5b71791e9070.r2.dev/content/A1/module/lesson/',
  30,
  0
);
```

## Files Modified
- `migrations/0004_fix_r2_public_url.sql` - Database migration
- `A1_CONTENT_DEPLOYMENT_COMPLETE.md` - Updated documentation

## Next Steps
- ✅ Content is now publicly accessible
- ✅ Android app can load lessons
- ⏳ User testing in production
- ⏳ Add more A1 content
- ⏳ Expand to other license categories (B1, C, D)

## Support
For R2 bucket management:
```bash
# Check public access status
wrangler r2 bucket dev-url get dereva-media

# Enable public access
wrangler r2 bucket dev-url enable dereva-media

# Disable public access (if needed)
wrangler r2 bucket dev-url disable dereva-media

# List bucket contents
wrangler r2 object list dereva-media --prefix content/
```
