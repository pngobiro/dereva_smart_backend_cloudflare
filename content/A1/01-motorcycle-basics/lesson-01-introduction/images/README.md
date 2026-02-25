# Lesson Images

This folder contains local images for offline viewing. When online, the lesson uses Unsplash CDN for better performance.

## Image List

1. **motorcycle-controls.jpg** - Diagram of motorcycle controls
2. **safety-gear.jpg** - Complete safety gear setup
3. **riding-position.jpg** - Proper riding posture
4. **pre-ride-check.jpg** - T-CLOCS inspection points
5. **braking-technique.jpg** - Proper braking form
6. **cornering.jpg** - Cornering body position

## Image Specifications

- Format: JPG or PNG
- Max size: 500KB per image
- Resolution: 1200x800px (landscape) or 800x1200px (portrait)
- Compression: 80% quality
- Alt text: Required for accessibility

## Sources

Images can be sourced from:
- Unsplash (free, no attribution required)
- Custom photography
- Licensed stock photos
- Generated diagrams

## Usage in HTML

```html
<!-- Online: Use Unsplash CDN -->
<img src="https://images.unsplash.com/photo-xxxxx?w=800&q=80" 
     alt="Motorcycle controls" 
     class="content-image"
     onerror="this.src='images/motorcycle-controls.jpg'">

<!-- Fallback to local image if CDN fails -->
```
