# Lesson: Defensive Riding

**Lesson ID:** `les-a1-safety-defensive`  
**Module:** Road Safety (`mod-a1-safety`)  
**Duration:** 25 minutes  
**Type:** INTERACTIVE (HTML)

## Description
Master defensive riding techniques, hazard awareness, and safety strategies for safe motorcycle operation on public roads.

## Content Structure

```
lesson-01-defensive-riding/
├── index.html          # Main lesson content
├── images/             # Local images
│   ├── defensive-riding.jpg
│   ├── visibility-gear.jpg
│   ├── lane-positioning.jpg
│   └── night-riding.jpg
├── videos/             # Local videos (optional)
│   └── placeholder.txt
└── README.md           # This file
```

## Topics Covered

1. Defensive Riding Principles
   - SIPDE method (Scan, Identify, Predict, Decide, Execute)

2. Common Hazards
   - Intersections (70% of accidents)
   - Left-turning vehicles
   - Road surface conditions
   - Weather impacts
   - Blind spots

3. Visibility Strategies
   - Bright/reflective clothing
   - Headlight usage
   - Lane positioning
   - Eye contact with drivers

4. Safe Following Distance
   - 2-second rule
   - 4-second rule in poor conditions

5. Lane Positioning
   - Position 1 (Left), 2 (Center), 3 (Right)
   - Strategic positioning for visibility

6. Group Riding
   - Staggered formation
   - Hand signals
   - Maintaining safe distances

7. Emergency Situations
   - Emergency braking
   - Escape routes
   - Swerving techniques

8. Night Riding
   - Speed reduction
   - Increased following distance
   - High beam usage
   - Animal awareness

## Embedded Media

### YouTube Videos
- Motorcycle Safety Tips: `5LXqE2m_s5c`
- Common Hazards: `eqQBubilSXU`
- Group Riding: `gPE7wzXqexY?start=420`

### External Images (Unsplash)
- Defensive riding
- High visibility gear
- Lane positioning
- Night riding

## Database Entry

```sql
INSERT INTO lessons (
    id, module_id, title, description, order_index, 
    type, content_url, duration_minutes, requires_subscription
) VALUES (
    'les-a1-safety-defensive',
    'mod-a1-safety',
    'Defensive Riding',
    'Master defensive riding techniques and hazard awareness for safe motorcycle operation',
    1,
    'INTERACTIVE',
    'https://pub-xxxxx.r2.dev/content/A1/02-road-safety/lesson-01-defensive-riding/',
    25,
    0
);
```
