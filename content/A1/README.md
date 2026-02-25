# A1 License Category - Motorcycles (up to 125cc, 11kW max)

## Module Structure

### Module 01: Motorcycle Basics
**Module ID:** `mod-a1-basics`
**Description:** Learn the fundamentals of motorcycle operation, controls, and basic riding techniques.

Lessons:
1. **lesson-01-introduction.html** (`les-a1-basics-intro`)
   - Understanding your motorcycle
   - Pre-ride safety checks (T-CLOCS)
   - Starting your motorcycle
   - Basic riding position
   - Moving off and stopping
   - Gear shifting
   - Cornering basics
   - Safety gear (ATGATT)

2. **lesson-02-controls.html** (`les-a1-basics-controls`) - Coming soon
   - Throttle control
   - Brake control
   - Clutch control
   - Gear shifter operation

3. **lesson-03-practice.html** (`les-a1-basics-practice`) - Coming soon
   - Practice exercises
   - Common beginner mistakes
   - Building confidence

---

### Module 02: Road Safety
**Module ID:** `mod-a1-safety`
**Description:** Master defensive riding techniques and hazard awareness for safe motorcycle operation.

Lessons:
1. **lesson-01-defensive-riding.html** (`les-a1-safety-defensive`)
   - SIPDE method
   - Common hazards
   - Visibility strategies
   - Safe following distance
   - Lane positioning
   - Group riding
   - Emergency situations
   - Night riding

2. **lesson-02-weather-conditions.html** (`les-a1-safety-weather`) - Coming soon
   - Riding in rain
   - Wind management
   - Hot weather riding
   - Cold weather riding

3. **lesson-03-emergency-maneuvers.html** (`les-a1-safety-emergency`) - Coming soon
   - Emergency braking
   - Swerving techniques
   - Avoiding obstacles

---

### Module 03: Traffic Rules
**Module ID:** `mod-a1-traffic`
**Description:** Understand traffic laws, road signs, and regulations specific to motorcyclists.

Lessons:
1. **lesson-01-road-signs.html** (`les-a1-traffic-signs`) - Coming soon
   - Warning signs
   - Regulatory signs
   - Information signs
   - Road markings

2. **lesson-02-right-of-way.html** (`les-a1-traffic-row`) - Coming soon
   - Intersection rules
   - Roundabouts
   - Pedestrian crossings
   - Lane changes

3. **lesson-03-traffic-laws.html** (`les-a1-traffic-laws`) - Coming soon
   - Speed limits
   - Parking regulations
   - Alcohol and drugs
   - License requirements

---

## Content URLs for Database

When uploading to R2, use these URLs:

```sql
-- Module 01 Lessons
UPDATE lessons SET content_url = 'https://pub-xxxxx.r2.dev/content/A1/01-motorcycle-basics/lesson-01-introduction.html' WHERE id = 'les-a1-basics-intro';

-- Module 02 Lessons
UPDATE lessons SET content_url = 'https://pub-xxxxx.r2.dev/content/A1/02-road-safety/lesson-01-defensive-riding.html' WHERE id = 'les-a1-safety-defensive';
```

## File Naming Convention

```
{category}/{module-number}-{module-name}/lesson-{lesson-number}-{lesson-name}.{extension}
```

Examples:
- `A1/01-motorcycle-basics/lesson-01-introduction.html`
- `A1/01-motorcycle-basics/lesson-02-controls.html`
- `A1/02-road-safety/lesson-01-defensive-riding.html`
