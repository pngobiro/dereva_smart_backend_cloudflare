# Quiz JSON Schema Design

**Version:** 2.0 | **Status:** Stable

---

## Overview

This document defines the JSON structure for rich, multimedia quiz content. The schema supports multiple question types, embedded media, HTML formatting, and optional educational context — all through a single unified content model.

---

## Table of Contents

1. [Core Principles](#core-principles)
2. [Terminology](#terminology)
3. [Quiz Object](#quiz-object)
4. [Question Object](#question-object)
5. [Question Types](#question-types)
6. [Rich Content System](#rich-content-system)
7. [Complete Examples](#complete-examples)
8. [Validation Rules](#validation-rules)
9. [Best Practices](#best-practices)
10. [Styling Reference](#styling-reference)
11. [Roadmap](#roadmap)

---

## Core Principles

1. **Unified Content Model** — Every text field (question, explanation, hint, option text) accepts either a plain string or a rich content object. No special-casing.
2. **Media Anywhere** — Images, video, and audio can be attached to any content object.
3. **Non-Revealing Context** — The optional `context` field provides educational background *without* exposing the correct answer.
4. **Accessibility First** — All media must include a caption/description.
5. **Strict Terminology** — `type` describes the *question type*; `format` describes the *content format*.

---

## Terminology

| Term | Definition |
|------|-----------|
| `type` | Question interaction type (e.g., `multiple-choice`, `true-false`) |
| `format` | Content encoding format: `text`, `html`, or `latex` |
| `context` | Optional educational background shown *with* the question; never reveals the answer |
| `explanation` | Shown *after* submission; may reveal the answer |
| `hint` | Optional nudge shown *during* the quiz; must not give away the answer |

---

## Quiz Object

```json
{
  "id": "string",
  "title": "string",
  "description": "string",
  "licenseCategory": "A1 | A | B1 | B | C | D | E",
  "topicArea": "ROAD_SIGNS | TRAFFIC_RULES | VEHICLE_CONTROL | ROAD_MARKINGS | HAZARD_PERCEPTION",
  "difficulty": "EASY | MEDIUM | HARD",
  "timeLimit": 30,
  "passingScore": 80,
  "isPaid": false,
  "version": 1,
  "order": 1,
  "questions": []
}
```

### Quiz Field Reference

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | string | ✅ | Globally unique identifier |
| `title` | string | ✅ | Display name |
| `description` | string | ✗ | Shown on quiz start screen |
| `licenseCategory` | enum | ✗ | Driving license class |
| `topicArea` | enum | ✗ | Content grouping |
| `difficulty` | enum | ✗ | `EASY`, `MEDIUM`, or `HARD` |
| `timeLimit` | number | ✗ | Minutes; omit for untimed |
| `passingScore` | number | ✗ | Percentage (0–100) |
| `isPaid` | boolean | ✗ | Paywall gate |
| `version` | number | ✗ | Schema/content version |
| `order` | number | ✗ | Display order within a collection |
| `questions` | array | ✅ | One or more question objects |

---

## Question Object

### Common Fields

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | string | ✅ | Unique within this quiz |
| `type` | enum | ✅ | See Question Types below |
| `question` | string \| ContentObject | ✅ | The question prompt |
| `points` | number | ✅ | Positive integer |
| `explanation` | string \| ContentObject | ✅ | Shown after submission |
| `hint` | string \| ContentObject | ✗ | Shown on request during quiz |
| `context` | ContentObject | ✗ | Educational background; never reveals answer |

---

## Question Types

### 1. `multiple-choice`

Exactly one correct answer. The classic format.

```json
{
  "id": "q1",
  "type": "multiple-choice",
  "question": "What does a red octagonal sign mean?",
  "points": 10,
  "options": [
    { "id": "a", "text": "Give way",    "isCorrect": false },
    { "id": "b", "text": "Stop",        "isCorrect": true  },
    { "id": "c", "text": "No entry",    "isCorrect": false },
    { "id": "d", "text": "Speed limit", "isCorrect": false }
  ],
  "explanation": "A red octagonal sign is the universal STOP sign. You must come to a complete halt before proceeding.",
  "hint": "Count the sides of the shape — what does that number suggest?"
}
```

### 2. `true-false`

Binary choice. Use `correctAnswer` instead of an options array.

```json
{
  "id": "q2",
  "type": "true-false",
  "question": "A broken white centre line means you may cross it to overtake if it is safe.",
  "points": 5,
  "correctAnswer": true,
  "explanation": "Correct. A broken (dashed) line is a guide, not a barrier. Crossing is permitted when safe.",
  "hint": "Think about what 'broken' implies — is it a solid rule or a suggestion?"
}
```

### 3. `multiple-select`

One or more correct answers. Use `partialCredit: true` to award points proportionally.

```json
{
  "id": "q3",
  "type": "multiple-select",
  "question": "Which of the following are official road sign categories? (Select all that apply)",
  "points": 10,
  "partialCredit": true,
  "options": [
    { "id": "a", "text": "Warning signs",     "isCorrect": true  },
    { "id": "b", "text": "Prohibition signs",  "isCorrect": true  },
    { "id": "c", "text": "Suggestion signs",   "isCorrect": false },
    { "id": "d", "text": "Mandatory signs",    "isCorrect": true  }
  ],
  "explanation": "Official categories are Warning, Prohibition, and Mandatory. 'Suggestion signs' is not a recognised category."
}
```

### 4. `fill-blank`

A text input embedded in a sentence. Use `{{blank}}` as the placeholder.

```json
{
  "id": "q4",
  "type": "fill-blank",
  "question": "The national speed limit on a single carriageway road is {{blank}} mph.",
  "points": 5,
  "correctAnswer": "60",
  "caseSensitive": false,
  "explanation": "The national speed limit on a single carriageway is 60 mph for cars."
}
```

### 5. `matching`

Match items in the left column to items in the right column.

```json
{
  "id": "q5",
  "type": "matching",
  "question": "Match each road marking to its meaning.",
  "points": 10,
  "pairs": [
    { "left": "Broken white centre line",  "right": "May cross if safe"          },
    { "left": "Solid white centre line",   "right": "Do not cross"               },
    { "left": "Double solid white lines",  "right": "Strictly no crossing"       },
    { "left": "Yellow zigzag lines",       "right": "No stopping at any time"    }
  ],
  "explanation": "Each marking communicates a different level of restriction to drivers."
}
```

### 6. `ordering`

Drag-and-drop items into the correct sequence.

```json
{
  "id": "q6",
  "type": "ordering",
  "question": "Place the following actions in the correct order when approaching a STOP sign.",
  "points": 10,
  "items": [
    { "id": "1", "text": "Check for oncoming traffic",         "correctPosition": 3 },
    { "id": "2", "text": "Bring vehicle to a complete stop",   "correctPosition": 2 },
    { "id": "3", "text": "Begin to slow down",                 "correctPosition": 1 },
    { "id": "4", "text": "Proceed when safe",                  "correctPosition": 4 }
  ],
  "explanation": "Always slow first, stop fully, check for traffic, then proceed."
}
```

### 7. `short-answer`

Free-text input, evaluated against a list of accepted answers.

```json
{
  "id": "q7",
  "type": "short-answer",
  "question": "What colour is a warning sign in the UK?",
  "points": 5,
  "acceptedAnswers": ["yellow", "amber", "yellow/black"],
  "caseSensitive": false,
  "explanation": "UK warning signs use a yellow (amber) background with a black border and symbol."
}
```

---

## Rich Content System

Any field that accepts a **string** also accepts a **ContentObject**. This means the full richness of the system is available wherever text appears — including option text, hints, and explanations.

### ContentObject Schema

```json
{
  "format": "text | html | latex",
  "value": "string",
  "media": {
    "type": "image | video | audio",
    "url": "https://...",
    "caption": "Descriptive caption for accessibility",
    "position": "before | after"
  }
}
```

> ⚠️ `format` is **required** when using a ContentObject. Omitting it is a validation error.

---

### Using Plain Strings (Most Common)

For simple questions, use a plain string. Do not wrap in a ContentObject unnecessarily.

```json
"question": "What is the national speed limit on a motorway?"
```

---

### Adding Media

Attach an image, video, or audio clip to any ContentObject.

**Image:**
```json
{
  "format": "text",
  "value": "What does this sign mean?",
  "media": {
    "type": "image",
    "url": "https://cdn.example.com/signs/stop.png",
    "caption": "A red octagonal road sign",
    "position": "before"
  }
}
```

**Video:**
```json
{
  "format": "text",
  "value": "After watching the clip, identify the road hazard shown.",
  "media": {
    "type": "video",
    "url": "https://cdn.example.com/clips/hazard-scenario.mp4",
    "caption": "Dashcam footage of a residential road at dusk",
    "position": "before"
  }
}
```

**Audio:**
```json
{
  "format": "text",
  "value": "Listen to the traffic scenario and answer the question.",
  "media": {
    "type": "audio",
    "url": "https://cdn.example.com/audio/roundabout-scenario.mp3",
    "caption": "Audio description of a busy roundabout",
    "position": "before"
  }
}
```

---

### HTML Questions

Use `format: "html"` for complex layouts requiring tables, styled markup, or formatted lists embedded in the question itself.

```json
{
  "question": {
    "format": "html",
    "value": "<div><p><strong>Study the road markings below:</strong></p><table style='width:100%;border-collapse:collapse;margin:10px 0;'><thead><tr style='background:#f5f5f5;'><th style='padding:8px;border:1px solid #ddd;'>Pattern</th><th style='padding:8px;border:1px solid #ddd;'>Description</th></tr></thead><tbody><tr><td style='padding:8px;border:1px solid #ddd;'>Pattern A</td><td style='padding:8px;border:1px solid #ddd;'>Broken white centre line</td></tr><tr><td style='padding:8px;border:1px solid #ddd;'>Pattern B</td><td style='padding:8px;border:1px solid #ddd;'>Solid white centre line</td></tr><tr><td style='padding:8px;border:1px solid #ddd;'>Pattern C</td><td style='padding:8px;border:1px solid #ddd;'>Double solid white lines</td></tr></tbody></table><p>Which pattern allows overtaking when safe to do so?</p></div>"
  }
}
```

---

### The `context` Field

`context` is an optional ContentObject shown alongside the question. Its purpose is **educational background only** — it must never disclose or strongly imply the correct answer.

**✅ Good — teaches without revealing:**
```json
{
  "context": {
    "format": "html",
    "value": "<div style='padding:12px;background:#f5f5f5;border-left:4px solid #666;border-radius:6px;'><h4>Road Sign Shapes</h4><p>Different shapes allow drivers to recognise signs quickly, even from a distance.</p><ul><li><strong>Octagon (8 sides)</strong> — Critical regulatory signs</li><li><strong>Triangle</strong> — Warning signs</li><li><strong>Circle</strong> — Regulatory instructions</li><li><strong>Rectangle</strong> — Information and guidance</li></ul></div>"
  }
}
```

**❌ Bad — reveals the answer:**
```json
{
  "context": {
    "format": "html",
    "value": "<p>The STOP sign is octagonal and red. When you see it, you must stop completely.</p>"
  }
}
```

> **Rule of thumb:** If removing the `context` makes the question easier to answer incorrectly, you've crossed the line into answer-revealing territory.

---

## Complete Examples

### Example 1 — Standard Multiple Choice with Context and Image

```json
{
  "id": "q_signs_01",
  "type": "multiple-choice",
  "question": {
    "format": "text",
    "value": "What must a driver do when approaching this sign?",
    "media": {
      "type": "image",
      "url": "https://cdn.example.com/signs/stop-sign.png",
      "caption": "A red octagonal STOP sign on a white post",
      "position": "before"
    }
  },
  "points": 10,
  "options": [
    { "id": "a", "text": "Slow down and give way to traffic",      "isCorrect": false },
    { "id": "b", "text": "Come to a complete stop before the line", "isCorrect": true  },
    { "id": "c", "text": "Sound the horn and proceed",             "isCorrect": false },
    { "id": "d", "text": "Stop only if other vehicles are present", "isCorrect": false }
  ],
  "explanation": "This is a STOP sign. The law requires a complete stop — slowing without stopping is an offence, regardless of whether other vehicles are present.",
  "hint": "This is one of the most critical signs on the road. What does the word on the sign say?",
  "context": {
    "format": "html",
    "value": "<div style='padding:12px;background:#f5f5f5;border-left:4px solid #666;border-radius:6px;'><h4 style='margin:0 0 8px;color:#333;'>Regulatory Signs</h4><p style='font-size:0.9em;line-height:1.6;'>Regulatory signs communicate legal obligations. Ignoring them is an offence. They are identified by their distinct shapes and colours rather than by text alone — useful in low-visibility conditions.</p></div>"
  }
}
```

---

### Example 2 — HTML Question with Table

```json
{
  "id": "q_markings_01",
  "type": "multiple-choice",
  "question": {
    "format": "html",
    "value": "<div><p><strong>Study the following road marking patterns:</strong></p><table style='width:100%;border-collapse:collapse;margin:10px 0;'><thead><tr style='background:#f5f5f5;'><th style='padding:8px;border:1px solid #ddd;text-align:left;'>Pattern</th><th style='padding:8px;border:1px solid #ddd;text-align:left;'>Visual Description</th></tr></thead><tbody><tr><td style='padding:8px;border:1px solid #ddd;'>A</td><td style='padding:8px;border:1px solid #ddd;'>Broken (dashed) white line</td></tr><tr><td style='padding:8px;border:1px solid #ddd;'>B</td><td style='padding:8px;border:1px solid #ddd;'>Solid white line</td></tr><tr><td style='padding:8px;border:1px solid #ddd;'>C</td><td style='padding:8px;border:1px solid #ddd;'>Double solid white lines</td></tr></tbody></table><p>Which pattern permits overtaking when safe to do so?</p></div>"
  },
  "points": 10,
  "options": [
    { "id": "a", "text": "Pattern A", "isCorrect": true  },
    { "id": "b", "text": "Pattern B", "isCorrect": false },
    { "id": "c", "text": "Pattern C", "isCorrect": false },
    { "id": "d", "text": "None of them", "isCorrect": false }
  ],
  "explanation": "A broken white line (Pattern A) is advisory — you may cross it to overtake if it is safe. A solid line means do not cross; double solid lines strictly prohibit crossing.",
  "hint": "Think about what a 'gap' in a line implies — can something pass through a gap?"
}
```

---

### Example 3 — Multiple Select with Partial Credit

```json
{
  "id": "q_hazard_01",
  "type": "multiple-select",
  "question": "Which of the following conditions increase stopping distance? (Select all that apply)",
  "points": 15,
  "partialCredit": true,
  "options": [
    { "id": "a", "text": "Wet road surface",       "isCorrect": true  },
    { "id": "b", "text": "Worn tyre tread",         "isCorrect": true  },
    { "id": "c", "text": "Bright sunshine",          "isCorrect": false },
    { "id": "d", "text": "Driver fatigue",           "isCorrect": true  },
    { "id": "e", "text": "Newly resurfaced road",    "isCorrect": false }
  ],
  "explanation": "Wet roads, worn tyres, and fatigue all increase stopping distance. Sunshine and new road surfaces do not inherently increase stopping distance.",
  "hint": "Consider both the vehicle's mechanical grip and the driver's reaction time."
}
```

---

## Validation Rules

| Rule | Detail |
|------|--------|
| `id` | Required; must be unique within the quiz |
| `type` | Required; must match a defined question type |
| `question` | Required |
| `points` | Required; must be a positive integer |
| `explanation` | Required |
| `format` | Required when using a ContentObject (never omit) |
| `format` values | Must be `text`, `html`, or `latex` |
| `options` | Required for `multiple-choice` and `multiple-select` |
| Correct answer | At least one option must have `isCorrect: true` |
| `correctAnswer` | Required for `true-false` and `fill-blank` |
| `pairs` | Required for `matching` |
| `items` | Required for `ordering` |
| `acceptedAnswers` | Required for `short-answer` |
| Media `url` | Must be a valid HTTPS URL |
| Media `type` | Must be `image`, `video`, or `audio` |
| Media `position` | Must be `before` or `after` |
| HTML | Must be valid, well-formed HTML |
| `context` | Must not reveal or strongly imply the correct answer |

---

## Best Practices

### Content

- Keep questions unambiguous — one defensible correct answer for `multiple-choice`
- Distractors (wrong options) should be plausible, not absurd
- `explanation` should teach, not just state "The correct answer is X"
- `hint` should prompt reasoning, not disclose the answer
- `context` should add depth; if it makes the question trivially easy, rewrite it

### Media

- Always provide a descriptive `caption` for every media item
- Host media on a stable CDN; avoid ephemeral or user-generated URLs
- Prefer `position: "before"` for scenario images shown before the question
- Keep video clips short (under 90 seconds) for quiz contexts

### HTML

- Use inline styles only — no `<style>` tags, no external CSS classes
- Prefer semantic elements: `<strong>`, `<em>`, `<table>`, `<ul>`
- Test HTML rendering in your target quiz renderer before publishing
- Avoid deeply nested structures; keep HTML readable

### IDs

- Use a consistent naming convention: `q_topic_number` (e.g., `q_signs_01`)
- IDs must be unique *within a quiz*, not globally
- Avoid auto-incremented integers; prefer descriptive slugs

---

## Styling Reference

### Recommended Inline Styles

```css
/* Context / info panel */
padding: 12px;
background: #f5f5f5;
border-left: 4px solid #666;
border-radius: 6px;
margin: 10px 0;

/* Headings inside panels */
color: #333;
margin: 0 0 8px 0;
font-size: 16px;

/* Body text */
line-height: 1.6;
font-size: 0.9em;

/* Lists */
margin: 0;
padding-left: 20px;
font-size: 0.85em;

/* Tables */
width: 100%;
border-collapse: collapse;

/* Table cells */
border: 1px solid #ddd;
padding: 8px;
text-align: left;

/* Table header row */
background: #f5f5f5;
```

### Semantic Colour Palette

| Semantic Use | Background | Border / Accent |
|-------------|------------|-----------------|
| Neutral / default | `#f5f5f5` | `#666` |
| Informational | `#e3f2fd` | `#1976d2` |
| Caution / warning | `#fff8e1` | `#f57c00` |
| Error / danger | `#ffebee` | `#c62828` |
| Success / correct | `#e8f5e9` | `#4caf50` |

---

## Roadmap

| Feature | Status |
|---------|--------|
| LaTeX support for mathematical formulas | Planned |
| Interactive SVG diagrams | Planned |
| Scenario-based multi-part questions | Planned |
| Per-question time limits | Planned |
| Adaptive difficulty within a quiz | Investigating |
| Question pools and randomisation | Investigating |
| Audio text-to-speech for accessibility | Investigating |

---

*Last updated: February 2026 — Schema v2.0*