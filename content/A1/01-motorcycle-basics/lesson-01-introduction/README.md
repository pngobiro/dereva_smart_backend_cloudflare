# Lesson: Introduction to Motorcycles

**Lesson ID:** `les-a1-basics-intro`  
**Module:** Motorcycle Basics (`mod-a1-basics`)  
**Duration:** 30 minutes  
**Type:** INTERACTIVE (HTML)

## Description
Complete beginner's guide to motorcycle operation, covering controls, safety checks, basic riding techniques, and essential safety gear.

## Content Structure

```
lesson-01-introduction/
├── index.html          # Main lesson content
├── images/             # Local images (fallback for offline)
│   ├── motorcycle-controls.jpg
│   ├── safety-gear.jpg
│   ├── riding-position.jpg
│   └── cornering.jpg
├── videos/             # Local videos (optional, for offline)
│   └── placeholder.txt
└── README.md           # This file
```

## Topics Covered

1. Understanding Your Motorcycle
   - Throttle, brakes, clutch, gear shifter
   - Key components and controls

2. Pre-Ride Safety Checks (T-CLOCS)
   - Tires, Controls, Lights, Oil, Chain, Stands

3. Starting Your Motorcycle
   - Step-by-step startup procedure

4. Basic Riding Position
   - Posture, arm position, grip, foot placement

5. Moving Off
   - Friction zone technique
   - Smooth starts

6. Stopping Safely
   - Using both brakes
   - Emergency braking

7. Gear Shifting
   - Upshifting and downshifting techniques

8. Cornering Basics
   - MSF cornering technique (Slow, Look, Press, Roll)

9. Safety Gear (ATGATT)
   - Helmet, jacket, gloves, pants, boots

## Embedded Media

### YouTube Videos
- Complete Beginner's Guide: `gPE7wzXqexY`
- How to Start a Motorcycle: `lkzXH8YXqyg`
- Friction Zone Control: `gj9YJRlvHLI`
- Cornering Techniques: `ljywO-B_yew`

### External Images (Unsplash)
- Motorcycle controls
- Pre-ride inspection
- Riding position
- Safety gear
- Braking technique
- Cornering

## Database Entry

```sql
INSERT INTO lessons (
    id, module_id, title, description, order_index, 
    type, content_url, duration_minutes, requires_subscription
) VALUES (
    'les-a1-basics-intro',
    'mod-a1-basics',
    'Introduction to Motorcycles',
    'Complete beginner guide to motorcycle operation, controls, and basic riding techniques',
    1,
    'INTERACTIVE',
    'https://pub-xxxxx.r2.dev/content/A1/01-motorcycle-basics/lesson-01-introduction/',
    30,
    0
);
```

## Upload to R2

```bash
# Upload entire lesson folder
wrangler r2 object put dereva-media/content/A1/01-motorcycle-basics/lesson-01-introduction/ \
  --file=content/A1/01-motorcycle-basics/lesson-01-introduction/ \
  --recursive
```

## Testing

1. Open `index.html` in browser locally
2. Verify all images load
3. Test video embeds
4. Check mobile responsiveness
5. Test offline functionality (if local assets present)
