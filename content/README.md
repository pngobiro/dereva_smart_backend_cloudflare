# Dereva Smart Content Library

This folder contains organized learning content for all license categories.

## Folder Structure

```
content/
├── A1/          # Motorcycles up to 125cc (11kW max)
├── A/           # Motorcycles (unlimited)
├── B1/          # Light vehicles (cars, vans)
├── B/           # Heavy vehicles
├── C/           # Light commercial vehicles
├── D/           # Heavy commercial vehicles
├── E/           # Articulated vehicles
├── F/           # Agricultural tractors
└── G/           # Road rollers
```

## Content Types

Each category folder can contain:
- **HTML files**: Interactive lessons with embedded videos and images
- **Videos**: MP4 files for video lessons
- **Images**: PNG/JPG for diagrams and illustrations
- **PDFs**: Downloadable study materials

## Naming Convention

Files should follow this pattern:
- `{topic_name}.html` - Interactive HTML lessons
- `{topic_name}.mp4` - Video lessons
- `{topic_name}.pdf` - PDF documents

## Upload to R2

To upload content to Cloudflare R2:

```bash
# Upload entire category folder
wrangler r2 object put dereva-media/content/A1/motorcycle_basics.html --file=content/A1/motorcycle_basics.html

# Or use the upload script
npm run upload-content
```

## Database Integration

After uploading to R2, update the database with content URLs:

```sql
UPDATE lessons 
SET content_url = 'https://pub-xxxxx.r2.dev/content/A1/motorcycle_basics.html'
WHERE id = 'les-a1-basics';
```

## Content Guidelines

1. **HTML Lessons**: Must be mobile-responsive and work offline
2. **Videos**: Use YouTube embeds or upload MP4 to R2
3. **Images**: Use Unsplash or upload to R2 (max 2MB per image)
4. **Accessibility**: Include alt text for images, captions for videos
5. **File Size**: Keep HTML files under 500KB, videos under 50MB

## Current Content

### A1 Category (Motorcycles)
- ✅ motorcycle_basics.html - Complete beginner's guide with videos
- ✅ road_safety.html - Safety principles and defensive riding

### B1 Category (Light Vehicles)
- 🔄 Coming soon

### Other Categories
- 📝 Planned
