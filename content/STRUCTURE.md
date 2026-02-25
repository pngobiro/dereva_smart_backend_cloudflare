# Content Organization Structure

## Directory Hierarchy

```
content/
├── {LICENSE_CATEGORY}/
│   ├── README.md                                    # Category overview
│   ├── {MODULE_NUMBER}-{MODULE_NAME}/
│   │   ├── lesson-{NUMBER}-{NAME}/                 # Self-contained lesson folder
│   │   │   ├── index.html                          # Main lesson content
│   │   │   ├── images/                             # Lesson images (local fallback)
│   │   │   │   ├── image1.jpg
│   │   │   │   └── image2.jpg
│   │   │   ├── videos/                             # Lesson videos (optional)
│   │   │   │   └── video1.mp4
│   │   │   └── README.md                           # Lesson documentation
│   │   └── README.md                               # Module details
│   └── ...
└── README.md                                        # Root documentation
```

## Self-Contained Lesson Structure

Each lesson is a complete, self-contained folder that can work offline:

```
lesson-01-introduction/
├── index.html          # Main HTML file (entry point)
├── images/             # Local images for offline use
│   ├── diagram1.jpg
│   └── photo1.jpg
├── videos/             # Local videos (optional, for offline)
│   └── tutorial.mp4
├── css/                # Custom styles (optional)
│   └── lesson.css
├── js/                 # Custom scripts (optional)
│   └── interactive.js
└── README.md           # Lesson metadata and documentation
```

### Benefits of Self-Contained Structure

1. **Offline Support**: All assets in one folder
2. **Easy Upload**: Upload entire folder to R2 at once
3. **Portability**: Can be moved/copied as a unit
4. **Version Control**: Git tracks changes per lesson
5. **Testing**: Open index.html directly in browser

## Naming Conventions

### License Categories
- `A1` - Motorcycles up to 125cc (11kW max)
- `A` - Motorcycles (unlimited)
- `B1` - Light vehicles (cars, vans)
- `B` - Heavy vehicles
- `C` - Light commercial vehicles
- `D` - Heavy commercial vehicles
- `E` - Articulated vehicles
- `F` - Agricultural tractors
- `G` - Road rollers

### Module Naming
Format: `{NUMBER}-{SLUG}`
- Number: 01, 02, 03, etc. (zero-padded)
- Slug: lowercase, hyphen-separated

Examples:
- `01-motorcycle-basics`
- `02-road-safety`
- `03-traffic-rules`

### Lesson Naming
Format: `lesson-{NUMBER}-{SLUG}.{EXT}`
- Number: 01, 02, 03, etc. (zero-padded)
- Slug: lowercase, hyphen-separated
- Extension: html, mp4, pdf, etc.

Examples:
- `lesson-01-introduction.html`
- `lesson-02-controls.html`
- `lesson-03-practice.mp4`

### Database IDs
Format: `{PREFIX}-{CATEGORY}-{MODULE}-{LESSON}`

Module IDs:
- `mod-a1-basics` - A1 Motorcycle Basics
- `mod-a1-safety` - A1 Road Safety
- `mod-a1-traffic` - A1 Traffic Rules

Lesson IDs:
- `les-a1-basics-intro` - Introduction lesson
- `les-a1-basics-controls` - Controls lesson
- `les-a1-safety-defensive` - Defensive riding lesson

## Content Types

### HTML Lessons
- Interactive lessons with embedded media
- Must be mobile-responsive
- Include navigation and progress tracking
- Max file size: 500KB (excluding external resources)

### Video Lessons
- MP4 format, H.264 codec
- Resolution: 1080p or 720p
- Max file size: 50MB
- Include subtitles/captions

### PDF Documents
- Study guides and reference materials
- Max file size: 10MB
- Searchable text (not scanned images)

### Images
- PNG or JPG format
- Max file size: 2MB per image
- Include alt text for accessibility

## R2 Upload Structure

When uploading to Cloudflare R2, maintain the same structure:

```
dereva-media/
└── content/
    ├── A1/
    │   ├── 01-motorcycle-basics/
    │   │   ├── lesson-01-introduction.html
    │   │   └── assets/
    │   └── 02-road-safety/
    │       └── lesson-01-defensive-riding.html
    └── B1/
        └── ...
```

## Database Mapping

### Modules Table
```sql
INSERT INTO modules (id, title, description, order_index, license_category, icon_url, requires_subscription)
VALUES 
('mod-a1-basics', 'Motorcycle Basics', 'Learn fundamental motorcycle operation', 1, 'A1', 'https://...', 0),
('mod-a1-safety', 'Road Safety', 'Master defensive riding techniques', 2, 'A1', 'https://...', 0);
```

### Lessons Table
```sql
INSERT INTO lessons (id, module_id, title, description, order_index, type, content_url, duration_minutes, requires_subscription)
VALUES 
('les-a1-basics-intro', 'mod-a1-basics', 'Introduction to Motorcycles', 'Complete beginner guide', 1, 'INTERACTIVE', 'https://pub-xxxxx.r2.dev/content/A1/01-motorcycle-basics/lesson-01-introduction.html', 30, 0);
```

## Content Development Workflow

1. **Plan Module Structure**
   - Define module objectives
   - Outline lesson topics
   - Determine content types

2. **Create Content Files**
   - Follow naming conventions
   - Use templates for consistency
   - Include all required metadata

3. **Local Testing**
   - Test HTML lessons in browser
   - Verify video playback
   - Check mobile responsiveness

4. **Upload to R2**
   ```bash
   wrangler r2 object put dereva-media/content/A1/01-motorcycle-basics/lesson-01-introduction.html \
     --file=content/A1/01-motorcycle-basics/lesson-01-introduction.html
   ```

5. **Update Database**
   - Insert/update module records
   - Insert/update lesson records
   - Set correct content URLs

6. **Test in App**
   - Verify content loads correctly
   - Test on multiple devices
   - Check progress tracking

## Best Practices

1. **Consistency**: Follow naming conventions strictly
2. **Documentation**: Update README files when adding content
3. **Accessibility**: Include alt text, captions, transcripts
4. **Performance**: Optimize images and videos
5. **Versioning**: Use git to track content changes
6. **Testing**: Test all content before deployment


---

## LLM Content Creation Guidelines

### Overview
This section provides guidelines for creating high-quality, production-grade HTML lessons and quizzes. All new content follows the **Cinematic Dark Design System** demonstrated in the Category A Motorcycle module. This system has been proven in production and should be used as the reference implementation.

---

### Design System: Cinematic Dark Theme

All lessons and quizzes use this shared design language. Copy the CSS variables and base styles exactly.

#### Core CSS Variables & Fonts

```css
/* Google Fonts import — always include in <head> */
/* <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;700&display=swap" rel="stylesheet"> */

:root {
    --fire: #ff6b1a;        /* primary accent — orange */
    --ember: #ff3f00;       /* deeper orange for gradients */
    --gold: #ffc947;        /* secondary accent — gold */
    --dark: #0d0d14;        /* page background */
    --surface: #14141f;     /* slightly lighter surface */
    --card: #1c1c2e;        /* card backgrounds */
    --border: rgba(255,107,26,0.2);   /* default border */
    --text: #e8e4dc;        /* primary text */
    --muted: #8a8a9a;       /* secondary / placeholder text */
    --success: #22c55e;
    --danger: #ef4444;
    --gold-feedback: #ffc947;
}

/* Typography */
/* Headings: 'Bebas Neue', sans-serif — for all h1, h2, labels */
/* Body:     'DM Sans', sans-serif   — for all body text, buttons, UI */

* { box-sizing: border-box; margin: 0; padding: 0; }

body {
    font-family: 'DM Sans', sans-serif;
    background: var(--dark);
    color: var(--text);
    font-size: 16px;
    line-height: 1.6;
}
```

#### Animated Background Grid

Apply to hero sections and full-page backgrounds:

```css
/* Option A: Apply to body::before for page-wide grid */
body::before {
    content: '';
    position: fixed;
    inset: 0;
    background-image:
        linear-gradient(rgba(255,107,26,0.05) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,107,26,0.05) 1px, transparent 1px);
    background-size: 50px 50px;
    animation: gridMove 20s linear infinite;
    pointer-events: none;
    z-index: 0;
}

/* Option B: Apply to a specific hero::before */
.hero::before {
    content: '';
    position: absolute;
    inset: 0;
    background-image:
        linear-gradient(rgba(255,107,26,0.07) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,107,26,0.07) 1px, transparent 1px);
    background-size: 50px 50px;
    animation: gridMove 18s linear infinite;
}

@keyframes gridMove {
    0%   { background-position: 0 0; }
    100% { background-position: 50px 50px; }
}
```

#### Fixed Navigation Bar

```html
<nav>
    <a href="#" class="nav-logo">NTSA · CAT A</a>
    <div class="nav-links">
        <a href="#section1">Section 1</a>
        <a href="#section2">Section 2</a>
        <a href="quiz.html">Quiz</a>
    </div>
</nav>
```

```css
nav {
    position: fixed;
    top: 0; left: 0; right: 0;
    z-index: 100;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 40px;
    background: rgba(13,13,20,0.85);
    backdrop-filter: blur(16px);
    border-bottom: 1px solid var(--border);
}
.nav-logo {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 22px;
    letter-spacing: 2px;
    color: var(--fire);
    text-decoration: none;
}
.nav-links { display: flex; gap: 28px; }
.nav-links a {
    color: var(--muted);
    text-decoration: none;
    font-size: 14px;
    transition: color 0.2s;
}
.nav-links a:hover { color: var(--fire); }

@media (max-width: 600px) {
    nav { padding: 14px 20px; }
    .nav-links { display: none; }
}
```

#### Hero Section

```html
<section class="hero">
    <div class="hero-content">
        <div class="badge">NTSA Kenya · Official Curriculum</div>
        <h1>Module Title<br>Here</h1>
        <p>Module subtitle or description text here.</p>
        <div class="hero-cta">
            <a href="#content" class="btn btn-fire">📚 Start Learning</a>
            <a href="quiz.html" class="btn btn-ghost">🎯 Take the Quiz</a>
        </div>
        <!-- Optional: 3D SVG bike/vehicle illustration here -->
    </div>
    <div class="scroll-hint">Scroll <div class="arrow"></div></div>
</section>
```

```css
.hero {
    position: relative;
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    background: radial-gradient(ellipse 80% 60% at 50% 120%, rgba(255,107,26,0.22) 0%, transparent 70%),
                var(--dark);
}
.hero-content {
    position: relative;
    text-align: center;
    padding: 40px 20px;
    max-width: 900px;
}
.badge {
    display: inline-block;
    background: rgba(255,107,26,0.15);
    border: 1px solid var(--fire);
    color: var(--fire);
    font-size: 11px;
    letter-spacing: 3px;
    text-transform: uppercase;
    padding: 6px 18px;
    border-radius: 100px;
    margin-bottom: 28px;
    animation: fadeSlideDown 0.8s ease both;
}
.hero h1 {
    font-family: 'Bebas Neue', sans-serif;
    font-size: clamp(52px, 10vw, 110px);
    line-height: 0.9;
    letter-spacing: 2px;
    background: linear-gradient(135deg, #fff 30%, var(--gold) 70%, var(--fire) 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: fadeSlideDown 0.9s ease 0.1s both;
}
.hero p {
    font-size: 18px;
    color: var(--muted);
    margin: 24px auto 40px;
    max-width: 600px;
    line-height: 1.7;
    animation: fadeSlideDown 0.9s ease 0.2s both;
}
.hero-cta {
    display: inline-flex;
    gap: 14px;
    flex-wrap: wrap;
    justify-content: center;
    animation: fadeSlideDown 0.9s ease 0.3s both;
}
.scroll-hint {
    position: absolute;
    bottom: 32px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    color: var(--muted);
    font-size: 12px;
    letter-spacing: 2px;
    text-transform: uppercase;
}
.scroll-hint .arrow {
    width: 20px; height: 20px;
    border-right: 2px solid var(--fire);
    border-bottom: 2px solid var(--fire);
    transform: rotate(45deg);
    animation: arrowBounce 1.4s infinite;
}
@keyframes fadeSlideDown {
    from { opacity: 0; transform: translateY(-24px); }
    to   { opacity: 1; transform: translateY(0); }
}
@keyframes arrowBounce {
    0%,100% { transform: rotate(45deg) translateY(0); }
    50%     { transform: rotate(45deg) translateY(6px); }
}
```

#### 3D Floating Vehicle (CSS preserve-3d)

The reference motorcycle SVG from `index.html` should be reused. For non-motorcycle modules, adapt the SVG to match the vehicle category. Use this wrapper pattern:

```html
<div class="bike-3d-wrapper">
    <div class="bike-3d">
        <!-- SVG vehicle illustration here -->
    </div>
</div>
```

```css
.bike-3d-wrapper {
    perspective: 1000px;
    margin: 50px auto 0;
    width: 340px;
}
.bike-3d {
    transform-style: preserve-3d;
    animation: bikeFloat 5s ease-in-out infinite, bikeRotate 16s linear infinite;
}
@keyframes bikeFloat {
    0%, 100% { transform: rotateY(-15deg) rotateX(6deg) translateY(0); }
    50%       { transform: rotateY(-15deg) rotateX(6deg) translateY(-12px); }
}
@keyframes bikeRotate {
    0%   { transform: rotateY(-25deg) rotateX(6deg); }
    50%  { transform: rotateY(15deg) rotateX(6deg); }
    100% { transform: rotateY(-25deg) rotateX(6deg); }
}
```

---

### Buttons

Always use these two button variants:

```html
<a href="quiz.html" class="btn btn-fire">🎯 Primary Action</a>
<a href="index.html" class="btn btn-ghost">← Back</a>
<button class="btn btn-fire" disabled>Disabled State</button>
```

```css
.btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 14px 30px;
    border-radius: 8px;
    font-size: 15px;
    font-weight: 600;
    text-decoration: none;
    cursor: pointer;
    border: none;
    transition: transform 0.25s, box-shadow 0.25s;
    font-family: 'DM Sans', sans-serif;
}
.btn-fire {
    background: linear-gradient(135deg, var(--fire), var(--ember));
    color: #fff;
    box-shadow: 0 8px 24px rgba(255,63,0,0.4);
}
.btn-fire:hover:not(:disabled) {
    transform: translateY(-3px);
    box-shadow: 0 14px 34px rgba(255,63,0,0.5);
}
.btn-fire:disabled { opacity: 0.4; cursor: not-allowed; }
.btn-ghost {
    background: transparent;
    border: 1.5px solid var(--border);
    color: var(--text);
}
.btn-ghost:hover {
    border-color: var(--fire);
    color: var(--fire);
    transform: translateY(-3px);
}
```

---

### Section Layout

```html
<section class="section" id="section-id">
    <div class="section-label">Short Label</div>
    <h2 class="section-title">Section Heading</h2>
    <p class="section-subtitle">Supporting description text goes here, max ~580px wide.</p>

    <!-- content -->
</section>

<hr class="divider">
```

```css
.section {
    padding: 80px 20px;
    max-width: 1060px;
    margin: 0 auto;
}
.section-label {
    font-size: 11px;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: var(--fire);
    margin-bottom: 12px;
}
.section-title {
    font-family: 'Bebas Neue', sans-serif;
    font-size: clamp(38px, 6vw, 64px);
    line-height: 1;
    margin-bottom: 20px;
    letter-spacing: 1px;
}
.section-subtitle {
    color: var(--muted);
    font-size: 17px;
    max-width: 580px;
    line-height: 1.7;
    margin-bottom: 48px;
}
.divider {
    border: none;
    height: 1px;
    background: linear-gradient(to right, transparent, var(--border), transparent);
    margin: 10px 0;
}
```

---

### Interactive Components

#### A. 3D Flip Cards (Category/Concept Cards)

Use for displaying categorized information that learners actively reveal. **Click or hover to flip.**

```html
<div class="cards-grid">
    <div class="flip-card" onclick="this.classList.toggle('flipped')">
        <div class="flip-card-inner">
            <div class="flip-front">
                <div class="card-icon">🛵</div>
                <div class="card-category">Category</div>
                <div class="card-title">A1 — Moped</div>
                <div class="card-hint">Tap to see requirements →</div>
            </div>
            <div class="flip-back">
                <div class="card-category">A1 Requirements</div>
                <div class="detail-row">
                    <span class="detail-label">Engine</span>
                    <span class="detail-val">Up to 50 CC</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Min. Age</span>
                    <span class="detail-val">16 years</span>
                </div>
                <!-- add more detail-rows as needed -->
            </div>
        </div>
    </div>
    <!-- repeat for each card -->
</div>
```

```css
.cards-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 24px;
}
.flip-card {
    height: 300px;
    perspective: 900px;
    cursor: pointer;
}
.flip-card-inner {
    position: relative;
    width: 100%; height: 100%;
    transform-style: preserve-3d;
    transition: transform 0.7s cubic-bezier(0.4, 0, 0.2, 1);
}
.flip-card:hover .flip-card-inner,
.flip-card.flipped .flip-card-inner {
    transform: rotateY(180deg);
}
.flip-front, .flip-back {
    position: absolute;
    inset: 0;
    backface-visibility: hidden;
    -webkit-backface-visibility: hidden;
    border-radius: 16px;
    padding: 32px;
    border: 1px solid var(--border);
}
.flip-front {
    background: var(--card);
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
}
.flip-back {
    background: linear-gradient(135deg, #1e1830, #201828);
    transform: rotateY(180deg);
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 12px;
    border-color: var(--fire);
}
.card-icon  { font-size: 52px; margin-bottom: 12px; line-height: 1; }
.card-category { font-size: 11px; letter-spacing: 3px; text-transform: uppercase; color: var(--fire); margin-bottom: 6px; }
.card-title { font-family: 'Bebas Neue', sans-serif; font-size: 36px; letter-spacing: 1px; margin-bottom: 4px; }
.card-hint  { font-size: 12px; color: var(--muted); }
.detail-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 0;
    border-bottom: 1px solid rgba(255,255,255,0.07);
    font-size: 14px;
}
.detail-row:last-child { border-bottom: none; }
.detail-label { color: var(--muted); }
.detail-val   { color: var(--gold); font-weight: 600; }
```

---

#### B. Gear / Feature Cards (Hover Lift)

Use for listing items like protective gear, training units, rules etc.

```html
<div class="gear-grid">
    <div class="gear-card">
        <div class="gear-icon">🪖</div>
        <div class="gear-name">Certified Helmet</div>
        <div class="gear-desc">Must be certified and securely fastened. A loose helmet will fly off during impact.</div>
    </div>
    <!-- repeat -->
</div>
```

```css
.gear-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 20px;
}
.gear-card {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 14px;
    padding: 28px 22px;
    transition: border-color 0.3s, transform 0.3s, box-shadow 0.3s;
    cursor: default;
}
.gear-card:hover {
    border-color: var(--fire);
    transform: translateY(-6px);
    box-shadow: 0 16px 40px rgba(255,107,26,0.15);
}
.gear-icon { font-size: 40px; margin-bottom: 14px; }
.gear-name { font-weight: 700; font-size: 17px; margin-bottom: 6px; }
.gear-desc { font-size: 13px; color: var(--muted); line-height: 1.6; }
```

---

#### C. Interactive Controls Arena (Click-to-Reveal Panel)

Use for vehicle controls, instrument identification, and any interactive labelling exercise.

```html
<div class="controls-arena">
    <div class="controls-layout">
        <!-- Left: SVG diagram with labeled hotspots -->
        <div class="bike-stage">
            <div class="bike-rotating">
                <!-- Vehicle SVG here -->
            </div>
        </div>

        <!-- Right: Button panel + info box -->
        <div>
            <div class="controls-panel">
                <button class="control-btn" onclick="showControl('clutch')" data-ctrl="clutch">
                    <span class="cb-icon">✊</span>
                    <div>
                        <div class="cb-name">Clutch Lever</div>
                        <div class="cb-sub">Left Hand</div>
                    </div>
                </button>
                <!-- repeat for each control -->
            </div>
            <div class="control-info-box" id="controlInfo">
                <span class="highlight-ring"></span>Select a control above to learn its function.
            </div>
        </div>
    </div>
</div>
```

```css
.controls-arena {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 20px;
    padding: 40px;
    position: relative;
    overflow: hidden;
}
.controls-arena::after {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(ellipse 60% 50% at 50% 100%, rgba(255,107,26,0.08), transparent);
    pointer-events: none;
}
.controls-layout {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 30px;
    align-items: center;
}
@media (max-width: 700px) { .controls-layout { grid-template-columns: 1fr; } }

/* 3D rotating bike stage */
.bike-rotating {
    transform-style: preserve-3d;
    animation: stageBike 8s ease-in-out infinite;
}
@keyframes stageBike {
    0%,100% { transform: rotateY(-8deg) rotateX(4deg); }
    50%      { transform: rotateY(8deg) rotateX(2deg); }
}

/* Control buttons */
.controls-panel { display: flex; flex-direction: column; gap: 12px; }
.control-btn {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 16px 20px;
    background: rgba(255,255,255,0.03);
    border: 1.5px solid var(--border);
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.25s;
    text-align: left;
    color: var(--text);
    font-family: 'DM Sans', sans-serif;
}
.control-btn:hover, .control-btn.active {
    background: rgba(255,107,26,0.1);
    border-color: var(--fire);
    transform: translateX(4px);
}
.cb-icon { font-size: 28px; flex-shrink: 0; }
.cb-name { font-weight: 700; font-size: 15px; }
.cb-sub  { font-size: 12px; color: var(--muted); }

/* Info box */
.control-info-box {
    margin-top: 24px;
    padding: 20px;
    background: rgba(255,107,26,0.07);
    border: 1px solid var(--fire);
    border-radius: 12px;
    min-height: 80px;
    font-size: 15px;
    line-height: 1.7;
    transition: opacity 0.2s;
}

/* Pulsing ring indicator */
.highlight-ring {
    display: inline-block;
    width: 14px; height: 14px;
    background: var(--fire);
    border-radius: 50%;
    box-shadow: 0 0 0 4px rgba(255,107,26,0.3), 0 0 0 8px rgba(255,107,26,0.1);
    animation: ringPulse 1.5s infinite;
    margin-right: 10px;
    vertical-align: middle;
}
@keyframes ringPulse {
    0%,100% { box-shadow: 0 0 0 4px rgba(255,107,26,0.3), 0 0 0 8px rgba(255,107,26,0.1); }
    50%     { box-shadow: 0 0 0 6px rgba(255,107,26,0.2), 0 0 0 14px rgba(255,107,26,0.05); }
}
```

```javascript
// showControl() — used with the Controls Arena
const controlData = {
    clutch: {
        icon: '✊',
        text: '<strong>Clutch Lever (Left Hand):</strong> Disengages engine power from the rear wheel...'
    },
    throttle: {
        icon: '🔄',
        text: '<strong>Throttle & Front Brake (Right Hand):</strong> Roll towards you to accelerate...'
    }
    // add all controls
};

function showControl(key) {
    document.querySelectorAll('.control-btn').forEach(b => b.classList.remove('active'));
    document.querySelector(`[data-ctrl="${key}"]`).classList.add('active');
    const d = controlData[key];
    const box = document.getElementById('controlInfo');
    box.style.opacity = '0';
    setTimeout(() => {
        box.innerHTML = `<span style="font-size:22px;margin-right:10px;">${d.icon}</span>${d.text}`;
        box.style.opacity = '1';
    }, 200);
}
```

---

#### D. Timeline (Sequential Rules / Steps)

Use for ordered content like carrying rules, training steps, or safety procedures.

```html
<div class="timeline">
    <div class="tl-item">
        <div class="tl-dot"></div>
        <div class="tl-step">Rule 01</div>
        <div class="tl-title">Proper Seating</div>
        <div class="tl-desc">Passengers must sit astride on a designated seat — never sideways or on the tank.</div>
    </div>
    <!-- repeat tl-item -->
</div>
```

```css
.timeline { position: relative; padding-left: 40px; }
.timeline::before {
    content: '';
    position: absolute;
    left: 12px; top: 0; bottom: 0;
    width: 2px;
    background: linear-gradient(to bottom, var(--fire), transparent);
}
.tl-item  { position: relative; margin-bottom: 36px; }
.tl-dot   {
    position: absolute;
    left: -34px; top: 4px;
    width: 14px; height: 14px;
    background: var(--fire);
    border-radius: 50%;
    box-shadow: 0 0 10px rgba(255,107,26,0.6);
}
.tl-step  { font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: var(--fire); margin-bottom: 4px; }
.tl-title { font-weight: 700; font-size: 17px; margin-bottom: 6px; }
.tl-desc  { color: var(--muted); font-size: 14px; line-height: 1.6; }
```

---

#### E. Warning Strip

```html
<div class="warning-strip">
    <span class="wi">⚠️</span>
    <span><strong>Crash Rate Awareness:</strong> Motorcycles have a disproportionately high crash rate. Defensive riding is critical to survival.</span>
</div>
```

```css
.warning-strip {
    background: rgba(255,201,71,0.08);
    border: 1px solid rgba(255,201,71,0.3);
    border-radius: 10px;
    padding: 16px 20px;
    display: flex;
    gap: 12px;
    align-items: flex-start;
    font-size: 14px;
    color: #e0cc80;
    line-height: 1.6;
    margin-bottom: 40px;
}
.warning-strip .wi { font-size: 20px; flex-shrink: 0; }
```

---

#### F. Quiz CTA Block

Always end lesson pages with this call-to-action:

```html
<section class="section">
    <div class="quiz-cta">
        <div class="section-label" style="justify-content:center;display:flex;">Knowledge Check</div>
        <h2 class="section-title" style="margin-bottom:16px;">Ready to be Tested?</h2>
        <p style="color:var(--muted);max-width:500px;margin:0 auto 36px;font-size:16px;line-height:1.7;">
            Take the interactive quiz. You need 70% to pass.
        </p>
        <a href="quiz.html" class="btn btn-fire" style="font-size:17px;padding:16px 40px;">🎯 Start the Quiz Now</a>
    </div>
</section>
```

```css
.quiz-cta {
    background: linear-gradient(135deg, rgba(255,107,26,0.1), rgba(255,63,0,0.05));
    border: 1px solid var(--border);
    border-radius: 24px;
    padding: 60px 40px;
    text-align: center;
    position: relative;
    overflow: hidden;
}
.quiz-cta::before {
    content: '🏍';
    position: absolute;
    font-size: 200px;
    opacity: 0.04;
    bottom: -30px;
    right: -20px;
    line-height: 1;
    /* Change emoji to match the module topic */
}
```

---

#### G. Scroll Reveal Animation

Add `class="reveal"` to any section/element that should animate in on scroll. Initialize with the IntersectionObserver snippet below.

```html
<div class="cards-grid reveal">
    <!-- content -->
</div>
```

```css
.reveal {
    opacity: 0;
    transform: translateY(30px);
    transition: opacity 0.7s ease, transform 0.7s ease;
}
.reveal.visible {
    opacity: 1;
    transform: none;
}
```

```javascript
// Paste once at the bottom of each lesson page
const reveals = document.querySelectorAll('.reveal');
const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); }
    });
}, { threshold: 0.12 });
reveals.forEach(r => io.observe(r));
```

---

### Quiz Page: Full System

The quiz system is a single self-contained `quiz.html` file. The complete reference implementation is in:
`content/A/01-motorcycle-basics/quiz.html`

#### Core Architecture

| Feature | Implementation |
|---|---|
| Timer | SVG circle countdown, 20s per question |
| Streak tracker | JS counter, combo toast at 3+ |
| Animated progress | CSS gradient fill bar |
| Answer animations | CSS keyframes — pop on correct, shake on wrong |
| Results screen | SVG ring draw animation on completion |
| Confetti | CSS particle system on 100% score |
| Restart | Full state reset without page reload |

#### Quiz HTML Shell

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>[Module] Quiz | NTSA Kenya</title>
    <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;700&display=swap" rel="stylesheet">
    <style>
        /* === PASTE FULL QUIZ CSS HERE (see quiz.html reference) === */
    </style>
</head>
<body>
<div class="quiz-wrap">
    <div class="top-bar">
        <a href="index.html" class="back-link">← Back to Lesson</a>
        <div class="streaks" id="streakDisplay">🔥 Streak: 0</div>
    </div>

    <div class="quiz-card">
        <!-- QUIZ VIEW -->
        <div id="quizView">
            <div class="progress-area">
                <div class="progress-meta">
                    <span class="q-counter" id="qCounter">Question 1 / 10</span>
                    <div class="timer-ring-wrap">
                        <div class="timer-ring">
                            <svg viewBox="0 0 36 36" width="36" height="36">
                                <circle class="bg" cx="18" cy="18" r="15.5"/>
                                <circle class="fg" id="timerCircle" cx="18" cy="18" r="15.5" stroke-dasharray="97.4" stroke-dashoffset="0"/>
                            </svg>
                            <div class="timer-text" id="timerText">20</div>
                        </div>
                        <span>seconds</span>
                    </div>
                </div>
                <div class="progress-track"><div class="progress-fill" id="progressFill"></div></div>
            </div>

            <div class="question-label" id="qCategory">Category Label</div>
            <div class="question-text" id="questionText">Loading...</div>
            <ul class="options-list" id="optionsList"></ul>
            <div class="feedback-box" id="feedbackBox"></div>

            <div class="card-footer">
                <div class="score-badge">Score: <strong id="liveScore">0</strong> / <span id="maxScore">10</span></div>
                <button class="btn btn-fire" id="actionBtn" onclick="handleAction()" disabled>Submit Answer</button>
            </div>
        </div>

        <!-- RESULTS VIEW -->
        <div id="resultsView" style="display:none; text-align:center;">
            <div class="result-scene">
                <svg class="result-ring" viewBox="0 0 180 180">
                    <circle class="ring-bg" cx="90" cy="90" r="78"/>
                    <circle class="ring-score" id="ringScore" cx="90" cy="90" r="78"/>
                </svg>
                <div class="result-inner">
                    <div class="result-pct" id="resultPct">0%</div>
                    <div class="result-label" id="resultLabel">Score</div>
                </div>
            </div>
            <div class="result-title" id="resultTitle">Result</div>
            <p class="result-sub" id="resultSub"></p>
            <div class="result-breakdown">
                <div class="rb-item"><div class="rb-val" id="rbCorrect" style="color:var(--success)">0</div><div class="rb-key">Correct</div></div>
                <div class="rb-item"><div class="rb-val" id="rbWrong" style="color:var(--danger)">0</div><div class="rb-key">Wrong</div></div>
                <div class="rb-item"><div class="rb-val" id="rbStreak" style="color:var(--gold)">0</div><div class="rb-key">Best Streak</div></div>
                <div class="rb-item"><div class="rb-val" id="rbTime" style="color:var(--fire)">0s</div><div class="rb-key">Avg Time</div></div>
            </div>
            <div class="result-btns">
                <button class="btn btn-ghost" onclick="restartQuiz()">🔄 Try Again</button>
                <a href="index.html" class="btn btn-fire">📚 Back to Lesson</a>
            </div>
        </div>
    </div>
</div>
<div class="combo-toast" id="comboToast">🔥 Combo x3!</div>
<script>
    /* === PASTE FULL QUIZ JS HERE (see quiz.html reference) === */
</script>
</body>
</html>
```

#### Quiz CSS (Essential Blocks)

```css
/* Body / background */
body {
    font-family: 'DM Sans', sans-serif;
    background: var(--dark);
    color: var(--text);
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
}
/* Animated grid bg on body::before — same as lesson page */

.quiz-wrap { position: relative; width: 100%; max-width: 740px; z-index: 1; }

/* Top bar */
.top-bar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
.back-link { color: var(--muted); text-decoration: none; font-size: 14px; transition: color 0.2s; }
.back-link:hover { color: var(--fire); }
.streaks { display: flex; align-items: center; gap: 6px; font-size: 14px; color: var(--gold); font-weight: 700; }

/* Card */
.quiz-card {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 24px;
    padding: 40px;
    box-shadow: 0 40px 80px rgba(0,0,0,0.5);
    position: relative;
    overflow: hidden;
}
.quiz-card::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0; height: 3px;
    background: linear-gradient(90deg, var(--ember), var(--fire), var(--gold));
}

/* Progress */
.progress-area { margin-bottom: 32px; }
.progress-meta { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; font-size: 13px; color: var(--muted); }
.q-counter { font-weight: 700; font-size: 14px; color: var(--fire); }
.progress-track { width: 100%; height: 6px; background: rgba(255,255,255,0.07); border-radius: 100px; overflow: hidden; }
.progress-fill { height: 100%; width: 0%; border-radius: 100px; background: linear-gradient(90deg, var(--ember), var(--gold)); transition: width 0.5s cubic-bezier(0.4,0,0.2,1); }

/* Timer ring */
.timer-ring { position: relative; width: 36px; height: 36px; }
.timer-ring svg { transform: rotate(-90deg); }
.timer-ring circle { fill: none; stroke-width: 3; }
.timer-ring .bg { stroke: rgba(255,255,255,0.1); }
.timer-ring .fg { stroke: var(--fire); stroke-dasharray: 100; stroke-dashoffset: 0; stroke-linecap: round; transition: stroke-dashoffset 1s linear, stroke 0.3s; }
.timer-text { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; }

/* Options */
.options-list { list-style: none; display: flex; flex-direction: column; gap: 10px; }
.option-item {
    display: flex; align-items: center; gap: 14px;
    padding: 16px 20px;
    background: rgba(255,255,255,0.03);
    border: 1.5px solid rgba(255,255,255,0.08);
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.22s;
    font-size: 15px;
}
.option-item:hover:not(.locked) { background: rgba(255,107,26,0.08); border-color: rgba(255,107,26,0.5); transform: translateX(4px); }
.option-item.selected { background: rgba(255,107,26,0.1); border-color: var(--fire); }
.option-item.correct  { background: rgba(34,197,94,0.12); border-color: var(--success); animation: correctPop 0.4s ease; }
.option-item.wrong    { background: rgba(239,68,68,0.1);  border-color: var(--danger);  animation: wrongShake 0.4s ease; }

@keyframes correctPop  { 0%,100%{transform:scale(1)}50%{transform:scale(1.02)} }
@keyframes wrongShake  { 0%,100%{transform:translateX(0)}25%{transform:translateX(-8px)}75%{transform:translateX(8px)} }

.opt-letter {
    width: 30px; height: 30px; border-radius: 8px;
    background: rgba(255,255,255,0.06);
    display: flex; align-items: center; justify-content: center;
    font-weight: 700; font-size: 13px; flex-shrink: 0;
    transition: background 0.2s;
}
.option-item.selected .opt-letter { background: var(--fire); color:#fff; }
.option-item.correct .opt-letter  { background: var(--success); color:#fff; }
.option-item.wrong .opt-letter    { background: var(--danger);  color:#fff; }

/* Feedback */
.feedback-box {
    margin-top: 22px; padding: 16px 20px; border-radius: 12px;
    font-size: 14px; line-height: 1.7; display: none; border-left: 4px solid;
}
.feedback-box.show { display: flex; gap: 12px; align-items: flex-start; animation: feedIn 0.35s ease; }
.feedback-box.correct-fb { background: rgba(34,197,94,0.1); border-color: var(--success); color: #86efac; }
.feedback-box.wrong-fb   { background: rgba(239,68,68,0.1); border-color: var(--danger);  color: #fca5a5; }
@keyframes feedIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }

/* Footer */
.card-footer { display: flex; align-items: center; justify-content: space-between; margin-top: 28px; }
.score-badge { font-size: 13px; color: var(--muted); }
.score-badge strong { color: var(--gold); font-size: 16px; }

/* Results */
.result-scene { position: relative; margin: 0 auto 36px; width: 180px; height: 180px; }
.result-ring  { width: 180px; height: 180px; }
.result-ring circle { fill: none; stroke-width: 12; }
.ring-bg { stroke: rgba(255,255,255,0.06); }
.ring-score { stroke-dasharray: 490; stroke-dashoffset: 490; stroke-linecap: round; transition: stroke-dashoffset 1.4s cubic-bezier(0.4,0,0.2,1) 0.3s; }
.result-inner { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }
.result-pct   { font-family: 'Bebas Neue', sans-serif; font-size: 56px; line-height: 1; }
.result-label { font-size: 12px; color: var(--muted); letter-spacing: 2px; text-transform: uppercase; }
.result-title { font-family: 'Bebas Neue', sans-serif; font-size: 42px; margin-bottom: 10px; }
.result-sub   { color: var(--muted); font-size: 15px; max-width: 440px; margin: 0 auto 36px; line-height: 1.7; }
.result-breakdown { display: flex; justify-content: center; gap: 30px; margin-bottom: 36px; flex-wrap: wrap; }
.rb-item { background: var(--card); border: 1px solid var(--border); border-radius: 12px; padding: 18px 28px; text-align: center; }
.rb-val  { font-family: 'Bebas Neue', sans-serif; font-size: 36px; }
.rb-key  { font-size: 12px; color: var(--muted); letter-spacing: 1px; text-transform: uppercase; }
.result-btns { display: flex; gap: 14px; justify-content: center; flex-wrap: wrap; }

/* Combo toast */
.combo-toast {
    position: fixed; top: 24px; right: 24px;
    background: linear-gradient(135deg, var(--fire), var(--gold));
    color: #000; font-weight: 800; font-size: 15px;
    padding: 12px 22px; border-radius: 100px; z-index: 999;
    pointer-events: none; opacity: 0;
    transform: translateY(-10px) scale(0.9);
    transition: all 0.3s;
}
.combo-toast.show { opacity: 1; transform: translateY(0) scale(1); }

/* Confetti particle */
.confetti-particle {
    position: fixed; width: 8px; height: 8px; border-radius: 2px;
    pointer-events: none; z-index: 9999;
    animation: confettiFall linear forwards;
}
@keyframes confettiFall {
    0%   { transform: translateY(-20px) rotate(0deg); opacity: 1; }
    100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
}
```

#### Quiz JavaScript Engine

```javascript
// ── DATA STRUCTURE ──────────────────────────────────────────
// Each question object:
const quizData = [
    {
        question: "Question text here?",
        options: ["Option A", "Option B", "Option C", "Option D"],
        correct: 1,         // zero-based index of correct answer
        explanation: "Explanation shown after answering.",
        category: "Category Label"   // shown above question
    }
    // 10 questions recommended per quiz
];

// ── STATE ───────────────────────────────────────────────────
const TIME_PER_Q = 20;   // seconds per question
let currentQ = 0, score = 0, streak = 0, bestStreak = 0;
let hasAnswered = false, timerInterval = null, timeLeft = TIME_PER_Q;
let totalTimeUsed = 0, questionStartTime = 0;

// ── LOAD QUESTION ────────────────────────────────────────────
function loadQuestion() {
    hasAnswered = false;
    timeLeft = TIME_PER_Q;
    questionStartTime = Date.now();
    const actionBtn = document.getElementById('actionBtn');
    actionBtn.textContent = 'Submit Answer';
    actionBtn.disabled = true;
    actionBtn.dataset.state = '';
    const feedbackBox = document.getElementById('feedbackBox');
    feedbackBox.className = 'feedback-box';
    feedbackBox.style.display = 'none';

    const q = quizData[currentQ];
    document.getElementById('qCounter').textContent = `Question ${currentQ + 1} / ${quizData.length}`;
    document.getElementById('qCategory').textContent = q.category;
    document.getElementById('questionText').textContent = q.question;
    document.getElementById('liveScore').textContent = score;
    document.getElementById('progressFill').style.width = `${(currentQ / quizData.length) * 100}%`;

    const ol = document.getElementById('optionsList');
    ol.innerHTML = '';
    ['A','B','C','D'].forEach((letter, i) => {
        const li = document.createElement('li');
        li.className = 'option-item';
        li.innerHTML = `<span class="opt-letter">${letter}</span><span>${q.options[i]}</span>`;
        li.onclick = () => selectOption(i, li);
        ol.appendChild(li);
    });
    startTimer();
}

// ── TIMER ────────────────────────────────────────────────────
function startTimer() {
    clearInterval(timerInterval);
    updateTimer();
    timerInterval = setInterval(() => {
        timeLeft--;
        updateTimer();
        if (timeLeft <= 0) { clearInterval(timerInterval); if (!hasAnswered) timeOut(); }
    }, 1000);
}
function updateTimer() {
    document.getElementById('timerText').textContent = timeLeft;
    const offset = 97.4 - (timeLeft / TIME_PER_Q) * 97.4;
    const circle = document.getElementById('timerCircle');
    circle.style.strokeDashoffset = offset;
    circle.style.stroke = timeLeft <= 5 ? '#ef4444' : timeLeft <= 10 ? '#ffc947' : 'var(--fire)';
}
function timeOut() {
    hasAnswered = true;
    streak = 0;
    document.getElementById('streakDisplay').textContent = `🔥 Streak: 0`;
    const q = quizData[currentQ];
    document.querySelectorAll('.option-item').forEach(i => i.classList.add('locked'));
    document.querySelectorAll('.option-item')[q.correct].classList.add('correct');
    showFeedback(false, '⏰ Time\'s up! ' + q.explanation);
    const btn = document.getElementById('actionBtn');
    btn.textContent = currentQ === quizData.length - 1 ? 'See Results →' : 'Next Question →';
    btn.disabled = false;
    btn.dataset.state = 'next';
}

// ── SELECT / SUBMIT ──────────────────────────────────────────
function selectOption(index, li) {
    if (hasAnswered) return;
    document.querySelectorAll('.option-item').forEach(el => el.classList.remove('selected'));
    li.classList.add('selected');
    li.dataset.idx = index;
    document.getElementById('actionBtn').disabled = false;
}
function handleAction() {
    const btn = document.getElementById('actionBtn');
    if (btn.dataset.state === 'next') { btn.dataset.state = ''; nextQuestion(); return; }
    const selected = document.querySelector('.option-item.selected');
    if (!selected || hasAnswered) return;
    submitAnswer(parseInt(selected.dataset.idx));
}
function submitAnswer(selectedIdx) {
    hasAnswered = true;
    clearInterval(timerInterval);
    totalTimeUsed += Math.round((Date.now() - questionStartTime) / 1000);

    const q = quizData[currentQ];
    document.querySelectorAll('.option-item').forEach(i => i.classList.add('locked'));
    const isCorrect = selectedIdx === q.correct;

    if (isCorrect) {
        document.querySelectorAll('.option-item')[selectedIdx].classList.add('correct');
        score++;
        streak++;
        if (streak > bestStreak) bestStreak = streak;
        document.getElementById('liveScore').textContent = score;
        document.getElementById('streakDisplay').textContent = `🔥 Streak: ${streak}`;
        if (streak >= 3) showCombo(streak);
        showFeedback(true, '✅ Correct! ' + q.explanation);
    } else {
        document.querySelectorAll('.option-item')[selectedIdx].classList.add('wrong');
        document.querySelectorAll('.option-item')[q.correct].classList.add('correct');
        streak = 0;
        document.getElementById('streakDisplay').textContent = `🔥 Streak: 0`;
        showFeedback(false, '❌ Incorrect. ' + q.explanation);
    }
    const btn = document.getElementById('actionBtn');
    btn.textContent = currentQ === quizData.length - 1 ? 'See Results →' : 'Next Question →';
    btn.disabled = false;
    btn.dataset.state = 'next';
}

// ── FEEDBACK ─────────────────────────────────────────────────
function showFeedback(correct, msg) {
    const fb = document.getElementById('feedbackBox');
    fb.className = `feedback-box show ${correct ? 'correct-fb' : 'wrong-fb'}`;
    fb.style.display = 'flex';
    fb.innerHTML = `<span style="font-size:18px;flex-shrink:0">${correct ? '💡' : '📖'}</span><span>${msg}</span>`;
}

// ── NAVIGATION ───────────────────────────────────────────────
function nextQuestion() {
    currentQ++;
    if (currentQ < quizData.length) { loadQuestion(); } else { showResults(); }
}

// ── RESULTS ──────────────────────────────────────────────────
function showResults() {
    document.getElementById('quizView').style.display = 'none';
    document.getElementById('resultsView').style.display = 'block';

    const pct = Math.round((score / quizData.length) * 100);
    const avgTime = Math.round(totalTimeUsed / quizData.length);

    document.getElementById('resultPct').textContent = `${pct}%`;
    document.getElementById('rbCorrect').textContent = score;
    document.getElementById('rbWrong').textContent = quizData.length - score;
    document.getElementById('rbStreak').textContent = bestStreak;
    document.getElementById('rbTime').textContent = `${avgTime}s`;

    const ring = document.getElementById('ringScore');
    const offset = 490 - (pct / 100) * 490;

    if (pct >= 80) {
        ring.style.stroke = '#22c55e';
        document.getElementById('resultTitle').textContent = 'Excellent Rider! 🏆';
        document.getElementById('resultSub').textContent = 'Outstanding! You have a solid command of the material.';
        document.getElementById('resultLabel').textContent = 'Pass';
        document.getElementById('resultPct').style.color = '#22c55e';
        if (pct === 100) launchConfetti();
    } else if (pct >= 60) {
        ring.style.stroke = '#ffc947';
        document.getElementById('resultTitle').textContent = 'Almost There! 📚';
        document.getElementById('resultSub').textContent = 'Good effort! Review the lesson, then try again for a pass.';
        document.getElementById('resultLabel').textContent = 'Near Pass';
        document.getElementById('resultPct').style.color = '#ffc947';
    } else {
        ring.style.stroke = '#ef4444';
        document.getElementById('resultTitle').textContent = 'Needs More Study 📖';
        document.getElementById('resultSub').textContent = 'Go back through the lesson material, then retake the quiz.';
        document.getElementById('resultLabel').textContent = 'Fail';
        document.getElementById('resultPct').style.color = '#ef4444';
    }
    ring.style.strokeDasharray = 490;
    ring.style.strokeDashoffset = 490;
    setTimeout(() => { ring.style.strokeDashoffset = offset; }, 100);
}

// ── COMBO TOAST ──────────────────────────────────────────────
function showCombo(n) {
    const toast = document.getElementById('comboToast');
    toast.textContent = `🔥 ${n} in a Row!`;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2000);
}

// ── CONFETTI (100% score only) ────────────────────────────────
function launchConfetti() {
    const colors = ['#ff6b1a','#ffc947','#22c55e','#60a5fa','#f472b6','#fff'];
    for (let i = 0; i < 80; i++) {
        setTimeout(() => {
            const el = document.createElement('div');
            el.className = 'confetti-particle';
            el.style.left = Math.random() * 100 + 'vw';
            el.style.background = colors[Math.floor(Math.random() * colors.length)];
            el.style.animationDuration = (1.5 + Math.random() * 2) + 's';
            document.body.appendChild(el);
            setTimeout(() => el.remove(), 3500);
        }, i * 30);
    }
}

// ── RESTART ──────────────────────────────────────────────────
function restartQuiz() {
    currentQ = 0; score = 0; streak = 0; bestStreak = 0;
    totalTimeUsed = 0; hasAnswered = false;
    document.getElementById('resultsView').style.display = 'none';
    document.getElementById('quizView').style.display = 'block';
    document.getElementById('streakDisplay').textContent = '🔥 Streak: 0';
    loadQuestion();
}

// ── INIT ─────────────────────────────────────────────────────
loadQuestion();
```

---

### Content Creation Workflow for LLMs

When generating a new lesson from curriculum source material, follow this exact process:

#### Step 1 — Analyze Curriculum
- Identify the NTSA module number, title, and learning objectives
- Extract all content sections (theory topics)
- Note safety-critical information for warning strips
- Identify practical/hands-on content suitable for the Controls Arena
- List 10 testable facts for the quiz

#### Step 2 — Structure the Lesson (index.html)
Use this page section order:
1. `<nav>` — fixed navigation bar
2. `.hero` — full-viewport hero with 3D vehicle + badge + CTA buttons
3. `.section` — primary content category (flip cards if classifying items)
4. `<hr class="divider">`
5. `.section` — secondary topic (gear cards for lists)
6. `<hr class="divider">`
7. `.section` — controls/interactive element (Controls Arena if vehicle-related)
8. `<hr class="divider">`
9. `.section` — sequential/procedural content (Timeline)
10. `.section` — quiz CTA block

#### Step 3 — Build the Quiz (quiz.html)
- Write exactly 10 questions
- Mix of: licence categories (3), controls (3), safety/gear (2), passengers/loads (1), curriculum rules (1)
- Every question must have a 4-option multiple choice format
- `correct` is a zero-based integer index
- `explanation` should be 1–2 complete sentences
- `category` is a short topic label (shown above the question text)
- Pass mark: 70% (7/10 correct)

#### Step 4 — Quality Checks
- All `class="reveal"` elements present and IntersectionObserver initialized
- Nav links point to correct anchor IDs
- Quiz `href="quiz.html"` / back link `href="index.html"` are correct
- Timer set to `const TIME_PER_Q = 20`
- Confetti only triggers on 100%
- Mobile responsive: test at 375px width

---

### File Structure for Each Category A Lesson

```
content/
└── A/
    └── 01-motorcycle-basics/
        ├── index.html      ← Full lesson with hero, sections, interactive controls
        ├── quiz.html       ← Timed quiz with streak tracker, results ring, confetti
        └── README.md       ← Lesson metadata
```

#### README.md Template

```markdown
# Lesson: [Title]

**Module:** [Number] — [Module Name]  
**Category:** [A1 / A2 / A3 / B / C / D]  
**Duration:** ~30 minutes  
**Pass Mark:** 70% (quiz)

## Learning Objectives
- Objective 1
- Objective 2
- Objective 3

## Files
| File | Purpose |
|---|---|
| index.html | Main interactive lesson |
| quiz.html  | 10-question timed assessment |

## Quiz Topics
1. [Topic 1] — 3 questions
2. [Topic 2] — 3 questions
3. [Topic 3] — 2 questions
4. [Topic 4] — 2 questions

## R2 Upload Path
`dereva-media/content/[CATEGORY]/[MODULE]/`

## Database IDs
- Module: `mod-[category]-[slug]`
- Lesson: `les-[category]-[slug]-intro`
- Quiz:   `les-[category]-[slug]-quiz`
```

---

### Accessibility & Performance

```css
/* Always include reduced-motion support */
@media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
    }
}

/* Ensure sufficient color contrast on all text */
/* var(--text) #e8e4dc on var(--card) #1c1c2e — passes WCAG AA */
/* var(--muted) #8a8a9a on var(--card) #1c1c2e — use for non-essential text only */
```

```html
<!-- Always include on interactive SVG elements -->
<svg role="img" aria-label="Motorcycle diagram showing control positions">
<!-- Always add alt text to images -->
<img src="..." alt="Rider wearing certified helmet and reflective jacket">
<!-- ARIA labels on interactive buttons -->
<button class="control-btn" aria-label="Learn about the clutch lever">
```

### Best Practices Summary

1. **Self-contained**: Every lesson folder works offline with no external dependencies except Google Fonts
2. **Dark theme always**: Use the Cinematic Dark design system — do not create light-theme lessons
3. **Fonts always**: Always import Bebas Neue (headings) + DM Sans (body) from Google Fonts
4. **3D on hero**: Every lesson hero must include a floating 3D SVG illustration relevant to the topic
5. **Flip cards for classifications**: Any set of 2–4 categories/types should use the flip card component
6. **Controls Arena for vehicles**: Any lesson covering vehicle parts or controls must include the interactive Controls Arena
7. **Timeline for sequences**: Ordered rules, steps, or procedures use the Timeline component
8. **Reveal on scroll**: Add `class="reveal"` to all major sections and initialize IntersectionObserver
9. **10 questions per quiz**: Always exactly 10, timed at 20 seconds each, pass at 70%
10. **Confetti only at 100%**: The confetti system fires only on a perfect score — not on pass
