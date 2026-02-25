# Content Management Guide

## Overview

The `manage_content.js` script helps you sync content from the `content/` directory to Cloudflare R2 storage.

## Quick Start

```bash
# List content structure
npm run content:list

# Smart sync (only upload new/modified files)
npm run content:sync

# Watch for changes and auto-upload
npm run content:watch

# Force upload all files
npm run content:force

# View sync statistics
npm run content:stats

# Reset sync state
npm run content:reset
```

## Commands

### List Content Structure
```bash
npm run content:list
```
Shows the organized content library with:
- License categories (A1, B1, C, etc.)
- Modules within each category
- Lessons within each module
- ✅ indicator for lessons with `index.html`

### Smart Sync (Recommended)
```bash
npm run content:sync
```
- Only uploads new or modified files
- Tracks file hashes to detect changes
- Deletes remote files when deleted locally
- Saves sync state for efficiency

### Watch Mode
```bash
npm run content:watch
```
- Performs initial sync
- Watches for file changes
- Automatically uploads changed files
- Perfect for development

### Force Upload
```bash
npm run content:force
```
- Uploads ALL files regardless of state
- Useful after major changes
- Resets sync state

### Statistics
```bash
npm run content:stats
```
Shows:
- Last sync time
- Number of tracked files
- Total size
- Recently uploaded files

### Reset Sync State
```bash
npm run content:reset
```
- Clears sync state
- Next sync will upload everything
- Useful if sync state is corrupted

## Advanced Options

### Preserve Remote Files
```bash
node scripts/manage_content.js --no-delete
```
Syncs files but doesn't delete remote files when deleted locally.

### Direct Script Usage
```bash
# Smart sync
node scripts/manage_content.js

# With options
node scripts/manage_content.js --force --no-delete
```

## How It Works

### File Tracking
- Calculates MD5 hash of each file
- Stores hash, modification time, and size
- Compares with previous state to detect changes

### Upload Path
Files are uploaded to R2 with the path:
```
dereva-media/content/{category}/{module}/{lesson}/{file}
```

Example:
```
Local:  content/A1/01-motorcycle-basics/lesson-01-introduction/index.html
R2:     dereva-media/content/A1/01-motorcycle-basics/lesson-01-introduction/index.html
```

### Skipped Files
The following files are automatically skipped:
- `README.md` - Documentation files
- `.gitkeep` - Git placeholder files
- Hidden files (starting with `.`)

### Sync State
Stored in `.content-sync-state.json`:
```json
{
  "files": {
    "content/A1/01-motorcycle-basics/lesson-01-introduction/index.html": {
      "hash": "abc123...",
      "mtime": 1234567890,
      "size": 12345,
      "lastUpload": 1234567890
    }
  },
  "lastSync": 1234567890
}
```

## Environment Variables

Create a `.env` file in the project root:

```env
# R2 Bucket name
R2_BUCKET_NAME=dereva-media

# Use wrangler CLI (recommended)
USE_WRANGLER=true

# OR use API directly (requires credentials)
USE_WRANGLER=false
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_API_TOKEN=your_api_token
```

## Workflow Examples

### Adding New Content

1. Create content in organized structure:
   ```
   content/A1/01-motorcycle-basics/lesson-02-controls/
   ├── index.html
   ├── images/
   │   └── throttle.jpg
   └── videos/
       └── demo.mp4
   ```

2. List to verify structure:
   ```bash
   npm run content:list
   ```

3. Sync to R2:
   ```bash
   npm run content:sync
   ```

### Development Workflow

1. Start watch mode:
   ```bash
   npm run content:watch
   ```

2. Edit content files
3. Files automatically upload on save
4. Test in app immediately

### Production Deployment

1. Review changes:
   ```bash
   npm run content:list
   ```

2. Force upload everything:
   ```bash
   npm run content:force
   ```

3. Verify statistics:
   ```bash
   npm run content:stats
   ```

## Troubleshooting

### Sync State Corrupted
```bash
npm run content:reset
npm run content:sync
```

### Files Not Uploading
1. Check file isn't in skip list (README.md, .gitkeep, hidden)
2. Verify wrangler is installed: `wrangler --version`
3. Check credentials in `.env`
4. Try force upload: `npm run content:force`

### Upload Failures
- Script retries failed uploads automatically (5 attempts)
- Check network connection
- Verify R2 bucket exists
- Check Cloudflare account permissions

### Watch Mode Not Detecting Changes
- Ensure you're editing files in `content/` directory
- Some editors create temp files - these are ignored
- Try manual sync: `npm run content:sync`

## Best Practices

1. **Use Smart Sync**: Let the script detect changes automatically
2. **Watch During Development**: Use `--watch` for instant feedback
3. **List Before Sync**: Review structure with `--list` first
4. **Check Stats**: Monitor with `--stats` after major changes
5. **Backup Sync State**: Keep `.content-sync-state.json` in version control
6. **Test Locally**: Open `index.html` files in browser before uploading

## Integration with Database

After uploading content, update the database with R2 URLs:

```sql
-- Get R2 public URL from wrangler.toml or Cloudflare dashboard
-- Example: https://pub-xxxxx.r2.dev

UPDATE lessons 
SET content_url = 'https://pub-xxxxx.r2.dev/content/A1/01-motorcycle-basics/lesson-01-introduction/'
WHERE id = 'les-a1-basics-intro';
```

## Performance

- **Smart Sync**: Only uploads changed files (fast)
- **Force Upload**: Uploads everything (slow for large libraries)
- **Watch Mode**: Instant uploads on file save
- **Retries**: Automatic retry with exponential backoff
- **Parallel**: Sequential uploads for reliability

## Security

- Credentials stored in `.env` (not in version control)
- API tokens have limited permissions
- Wrangler CLI uses secure authentication
- Sync state doesn't contain sensitive data

## Support

For issues or questions:
1. Check this guide
2. Review `content/STRUCTURE.md`
3. Run `node scripts/manage_content.js --help`
4. Check Cloudflare R2 documentation
