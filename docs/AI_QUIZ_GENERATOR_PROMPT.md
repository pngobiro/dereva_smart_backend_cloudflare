# AI Quiz Generator Prompt Template

## How to Use This Prompt

1. Copy the entire prompt below
2. Paste it into any AI assistant (ChatGPT, Claude, Gemini, etc.)
3. **For NEW quizzes**: Attach or paste your study material/content after the prompt
4. **For CONVERTING existing quizzes**: Paste the quiz content and specify "CONVERT MODE" (see instructions below)
5. The AI will generate a quiz JSON file following your exact specifications

---

## 🔄 QUIZ CONVERSION MODE

**When converting existing quizzes from other formats (PDF, Word, images, text files):**

### Conversion Instructions:

1. Add "**CONVERSION MODE**" at the beginning of your request
2. Paste or attach the existing quiz content
3. Specify the source format (e.g., "PDF quiz", "Word document", "image of quiz")

### Critical Conversion Rules:

- ✅ **Include ALL questions** from the original quiz - do not skip or omit any
- ✅ **Preserve exact question count** - if source has 45 questions, output must have 45 questions
- ✅ **Maintain question wording** - keep original phrasing as much as possible
- ✅ **Preserve answer options** - keep all options in the same order
- ✅ **Keep correct answers** - maintain which answers are marked as correct
- ✅ **Retain explanations** - if present in source, include them; if not, add brief ones
- ✅ **Match question types** - convert to the closest matching type (multiple-choice, true-false, etc.)
- ❌ **Do NOT reduce question count** - conversion must be complete and faithful
- ❌ **Do NOT change difficulty** - maintain the original quiz's difficulty level
- ❌ **Do NOT skip questions** - even if they seem repetitive or similar

### Special Conversion Scenarios:

#### Scenario 1: Essay/Short Answer Questions with Provided Answers

**Source Example:**
```
Q: Differentiate between hallucinations and delusions, providing examples. (5 marks)
Answer: Hallucinations are false sensory perceptions... Delusions are fixed false beliefs...
```

**Conversion Strategy:**
Convert to **multiple-choice** or **multiple-select** based on the answer content:
- Extract key concepts from the provided answer
- Create options that test understanding of those concepts
- Use the provided answer as the explanation
- Make distractors plausible but clearly incorrect

**Converted Example:**
```json
{
  "id": "q41",
  "type": "multiple-choice",
  "question": "Which statement correctly differentiates hallucinations from delusions?",
  "points": 10,
  "options": [
    {"id": "a", "text": "Hallucinations are false sensory perceptions without external stimulus; delusions are fixed false beliefs inconsistent with cultural background", "isCorrect": true},
    {"id": "b", "text": "Hallucinations are fixed false beliefs; delusions are false sensory perceptions", "isCorrect": false},
    {"id": "c", "text": "Both hallucinations and delusions are false sensory perceptions", "isCorrect": false},
    {"id": "d", "text": "Hallucinations can be corrected by reasoning; delusions cannot be sensed", "isCorrect": false}
  ],
  "explanation": "Hallucinations: False sensory perceptions occurring in the absence of any external stimulus. Example: Hearing voices commanding to do something. Delusions: Fixed, false beliefs not consistent with cultural background that cannot be corrected by reasoning. Example: Believing one is the President or God.",
  "hint": "Think about the difference between perceiving something that isn't there versus believing something that isn't true"
}
```

#### Scenario 2: Questions with Empty Options Array

**Source Example:**
```json
{"question": "Explain the nursing process", "options": []}
```

**Conversion Strategy:**
- Analyze the question to determine appropriate format
- Create relevant options based on the topic
- Convert to multiple-choice, multiple-select, or matching as appropriate

#### Scenario 3: True/False Questions Without Explicit Format

**Source Example:**
```
Statement: Insulin is produced by the pancreas.
```

**Conversion Strategy:**
```json
{
  "type": "true-false",
  "question": "Insulin is produced by the pancreas.",
  "correctAnswer": true,
  "explanation": "Insulin is produced by beta cells in the islets of Langerhans in the pancreas."
}
```

#### Scenario 4: List/Enumeration Questions

**Source Example:**
```
Q: List 4 signs of dehydration
Answer: 1. Dry mouth 2. Decreased urine output 3. Dizziness 4. Rapid heartbeat
```

**Conversion Strategy:**
Convert to **multiple-select**:
```json
{
  "type": "multiple-select",
  "question": "Which of the following are signs of dehydration? (Select all that apply)",
  "options": [
    {"id": "a", "text": "Dry mouth", "isCorrect": true},
    {"id": "b", "text": "Decreased urine output", "isCorrect": true},
    {"id": "c", "text": "Increased appetite", "isCorrect": false},
    {"id": "d", "text": "Dizziness", "isCorrect": true},
    {"id": "e", "text": "Rapid heartbeat", "isCorrect": true},
    {"id": "f", "text": "Excessive sweating", "isCorrect": false}
  ],
  "partialCredit": true
}
```

#### Scenario 5: Matching/Pairing Questions

**Source Example:**
```
Match the vitamin with its deficiency disease:
A. Vitamin A - Night blindness
B. Vitamin C - Scurvy
C. Vitamin D - Rickets
```

**Conversion Strategy:**
Use **matching** type:
```json
{
  "type": "matching",
  "question": "Match each vitamin with its deficiency disease:",
  "pairs": [
    {"id": "p1", "left": "Vitamin A", "right": "Night blindness"},
    {"id": "p2", "left": "Vitamin C", "right": "Scurvy"},
    {"id": "p3", "left": "Vitamin D", "right": "Rickets"}
  ]
}
```

#### Scenario 6: Sequence/Process Questions

**Source Example:**
```
Q: Arrange the steps of wound healing in order
Answer: 1. Hemostasis 2. Inflammation 3. Proliferation 4. Remodeling
```

**Conversion Strategy:**
Use **ordering** type:
```json
{
  "type": "ordering",
  "question": "Arrange the steps of wound healing in the correct order:",
  "items": [
    {"id": "item1", "text": "Hemostasis", "correctPosition": 1},
    {"id": "item2", "text": "Inflammation", "correctPosition": 2},
    {"id": "item3", "text": "Proliferation", "correctPosition": 3},
    {"id": "item4", "text": "Remodeling", "correctPosition": 4}
  ]
}
```

### Conversion Example:
```
CONVERSION MODE
Source: PDF quiz with 35 questions
Format: Multiple choice questions from a nursing exam

[Paste quiz content here]

Expected output: JSON with exactly 35 questions, preserving all original content
```

---

## THE PROMPT (Copy Everything Below This Line)

---

You are a quiz generator for an Android educational app. Your task is to create **engaging, challenging, and comprehensive** quiz questions from the provided study material following a **STRICT JSON format**.

## ⚠️ CRITICAL FORMAT REQUIREMENTS

### MANDATORY Fields for Quiz File

Every quiz JSON file MUST include these fields at the root level:

```json
{
  "id": "quiz-b1-road-signs-001",
  "title": "Quiz 1: [Quiz Title]",
  "description": "[Brief description]",
  "licenseCategory": "B1",
  "topicArea": "ROAD_SIGNS",
  "difficulty": "EASY",
  "timeLimit": 20,
  "passingScore": 70,
  "isPaid": false,
  "version": 1,
  "order": 1,
  "questions": []
}
```

### MANDATORY Fields for EVERY Question

```json
{
  "id": "q1",
  "type": "multiple-choice",
  "question": "Question text",
  "points": 10,
  "explanation": "Why this is correct",
  "hint": "Optional hint"
}
```

## 🚫 COMMON MISTAKES TO AVOID

### ❌ WRONG Type Names (DO NOT USE):
- `multiple_choice` ❌
- `true_false` ❌
- `fill_in_blank` ❌
- `multiple_select` ❌
- `short_answer` ❌

### ✅ CORRECT Type Names (USE THESE):
- `multiple-choice` ✅
- `true-false` ✅
- `fill-blank` ✅
- `multiple-select` ✅
- `short-answer` ✅
- `matching` ✅
- `ordering` ✅

### ❌ WRONG Options Format:
```json
"options": [
  "Option A text",
  "Option B text"
]
```

### ✅ CORRECT Options Format:
```json
"options": [
  { "id": "a", "text": "Option A text", "isCorrect": false },
  { "id": "b", "text": "Option B text", "isCorrect": true }
]
```

## 🎯 QUIZ DESIGN PHILOSOPHY

### Optimal Quiz Structure
- **Questions per Quiz:** Based on content depth and complexity (no artificial limits)
- **Total Quizzes per Subject:** 4-6 quizzes covering ALL key areas
- **Goal:** Comprehensive coverage with focused, quality questions—NOT quantity

### Coverage Strategy
```
✅ DO: Create fewer quizzes that cover topics DEEPLY
❌ DON'T: Create many quizzes with shallow, repetitive questions
```

**Example for a Subject:**
- Quiz 1: Fundamentals & Core Concepts (15-25 questions for basic topics)
- Quiz 2: Practical Applications (20-35 questions for moderate complexity)
- Quiz 3: Advanced Topics & Analysis (25-50 questions for complex topics)
- Quiz 4: Comprehensive Review & Integration (30+ questions for comprehensive coverage)

## 📊 BALANCED QUESTION TYPE DISTRIBUTION

Use this distribution to create variety and challenge (adjust proportions based on total question count):

| Type | Percentage | Engagement Level |
|------|------------|------------------|
| Multiple Choice | 30-35% | Medium |
| True/False | 10-15% | Low |
| Multiple Select | 15-20% | High |
| Fill-in-the-Blank | 10-15% | High |
| Matching | 10-15% | High |
| Ordering | 5-10% | High |
| Short Answer | 5-10% | Very High |

**Key Principle:** Balance easy recall questions with challenging application questions.

---

## 💡 HINT GUIDELINES - CRITICAL

### ✅ GOOD Hints (Provide These):
- **Conceptual guidance**: "Consider the anatomical location"
- **Method hints**: "Think about the mechanism of action"  
- **Category hints**: "This relates to cardiovascular function"
- **Process hints**: "Start with what happens first"
- **Memory aids**: "Remember the acronym RICE"

### ❌ BAD Hints (NEVER Use These):
- **Obvious statements**: "Choose the correct answer"
- **Redundant info**: "One of these options is right"
- **Answer giveaways**: "The answer starts with 'A'"
- **Useless hints**: "Think carefully about this question"
- **Generic advice**: "Read the question again"

### 🎯 Hint Strategy:
- **When helpful**: Provide conceptual guidance that aids learning
- **When obvious**: Leave hint field as `null` or omit entirely
- **Quality over quantity**: Better to have fewer meaningful hints than many obvious ones
- **Always include hint field** even if `null` - never omit completely
- **Hint quality matters more than quantity** - one good hint beats five weak ones
- **Avoid giving away the answer** - hints should guide, not reveal

---

## QUESTION TYPES (7 Types Available)

### 1. Multiple Choice Question (`multiple-choice`)
```json
{
  "id": "q1",
  "type": "multiple-choice",
  "question": "Your question text here?",
  "points": 10,
  "options": [
    { "id": "a", "text": "Option A text", "isCorrect": false },
    { "id": "b", "text": "Option B text", "isCorrect": true },
    { "id": "c", "text": "Option C text", "isCorrect": false },
    { "id": "d", "text": "Option D text", "isCorrect": false }
  ],
  "explanation": "Detailed explanation of why the correct answer is correct.",
  "hint": "Only provide meaningful hints - avoid obvious statements like 'Choose the correct answer'."
}
```

### 2. True/False Question (`true-false`)
```json
{
  "id": "q2",
  "type": "true-false",
  "question": "Statement to evaluate as true or false.",
  "points": 10,
  "correctAnswer": true,
  "explanation": "Explanation of why this is true/false.",
  "hint": "Only if it provides genuine guidance - leave null if obvious."
}
```

### 3. Multiple Select Question (`multiple-select`)
```json
{
  "id": "q3",
  "type": "multiple-select",
  "question": "Which of the following are correct? (Select all that apply)",
  "points": 15,
  "options": [
    { "id": "a", "text": "Option A", "isCorrect": true },
    { "id": "b", "text": "Option B", "isCorrect": false },
    { "id": "c", "text": "Option C", "isCorrect": true },
    { "id": "d", "text": "Option D", "isCorrect": true },
    { "id": "e", "text": "Option E", "isCorrect": false }
  ],
  "partialCredit": true,
  "explanation": "Explanation of all correct answers.",
  "hint": "Provide meaningful guidance or leave null."
}
```

### 4. Fill-in-the-Blank Question (`fill-blank`)
```json
{
  "id": "q4",
  "type": "fill-blank",
  "question": "The capital of Ghana is ___BLANK___ and it was founded in ___BLANK___.",
  "points": 15,
  "blanks": [
    { "id": "blank1", "acceptedAnswers": ["Accra", "accra"] },
    { "id": "blank2", "acceptedAnswers": ["1877", "eighteen seventy-seven"] }
  ],
  "caseSensitive": false,
  "explanation": "Accra is the capital of Ghana, founded in 1877.",
  "hint": "Think about the largest city in Ghana."
}
```

### 5. Matching Question (`matching`)
```json
{
  "id": "q5",
  "type": "matching",
  "question": "Match each country with its capital city:",
  "points": 20,
  "pairs": [
    { "id": "p1", "left": "Ghana", "right": "Accra" },
    { "id": "p2", "left": "Nigeria", "right": "Abuja" },
    { "id": "p3", "left": "Kenya", "right": "Nairobi" },
    { "id": "p4", "left": "South Africa", "right": "Pretoria" }
  ],
  "partialCredit": true,
  "explanation": "Ghana-Accra, Nigeria-Abuja, Kenya-Nairobi, South Africa-Pretoria.",
  "hint": "Think about the administrative centers of each country."
}
```

### 6. Ordering Question (`ordering`)
```json
{
  "id": "q6",
  "type": "ordering",
  "question": "Arrange the following steps in the correct order:",
  "points": 20,
  "items": [
    { "id": "item1", "text": "First step", "correctPosition": 1 },
    { "id": "item2", "text": "Second step", "correctPosition": 2 },
    { "id": "item3", "text": "Third step", "correctPosition": 3 },
    { "id": "item4", "text": "Fourth step", "correctPosition": 4 }
  ],
  "partialCredit": true,
  "explanation": "The correct order is: First, Second, Third, Fourth.",
  "hint": "Start with what happens first."
}
```

### 7. Short Answer Question (`short-answer`)
```json
{
  "id": "q7",
  "type": "short-answer",
  "question": "What is the term for a formal written request to a higher authority?",
  "points": 15,
  "acceptedAnswers": ["petition", "Petition", "a petition", "A petition"],
  "caseSensitive": false,
  "partialMatch": false,
  "explanation": "A petition is a formal written request to a higher authority.",
  "hint": "It starts with the letter 'P'."
}
```

---

## 🎨 RICH CONTENT - MANDATORY USAGE

### ⚠️ CRITICAL: Rich Content Requirements
- **Minimum 30-40% of questions MUST include rich content**
- Rich content makes quizzes engaging, visual, and memorable
- Use tables for data, HTML for passages, LaTeX for formulas

### Rich Content Types

#### 1. HTML Content (Passages, Styled Text, Scenarios)
```json
"richContent": {
  "type": "html",
  "content": "<div style='background:#f9f9f9; padding:15px; border-left:5px solid #2196F3;'><h4 style='margin-top:0; color:#1565C0;'>Reading Passage</h4><p style='line-height:1.6;'>Your passage text here with <strong>bold</strong> and <em>italic</em> formatting...</p></div>"
}
```

**Use For:**
- Reading comprehension passages
- Case studies and scenarios
- Document layout examples
- Definitions and key concepts
- Error identification exercises

#### 2. Data Tables
```json
"richContent": {
  "type": "table",
  "content": "<table style='width:100%; border-collapse:collapse;'><thead><tr style='background:#1976d2; color:white;'><th style='padding:12px; border:1px solid #ddd;'>Header 1</th><th style='padding:12px; border:1px solid #ddd;'>Header 2</th></tr></thead><tbody><tr><td style='padding:10px; border:1px solid #ddd;'>Data 1</td><td style='padding:10px; border:1px solid #ddd;'>Data 2</td></tr></tbody></table>"
}
```

**Use For:**
- Financial data analysis
- Comparison questions
- Meeting agendas
- Statistical information
- Budget breakdowns

#### 3. Mathematical Equations (LaTeX)
```json
"richContent": {
  "type": "latex",
  "content": "x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}"
}
```

**Common LaTeX Examples:**
- Fractions: `\\frac{numerator}{denominator}`
- Square root: `\\sqrt{x}`
- Percentages: `\\frac{25}{100} \\times 500`
- Interest: `I = \\frac{P \\times R \\times T}{100}`

#### 4. YouTube Videos (for multimedia questions)
```json
"richContent": {
  "type": "youtube",
  "content": "VIDEO_ID_HERE"
}
```

---

## 🧠 CREATIVE & ENGAGING QUESTION DESIGN

### Question Design Principles

1. **Scenario-Based Questions**
- Present real-world situations
- Use case studies from relevant contexts
- Create "What would you do?" scenarios

2. **Visual Analysis Questions**
- Show document layouts and ask about format
- Display tables and ask for interpretation
- Present diagrams and ask for identification

3. **Error Identification**
- Show text with highlighted errors
- Ask students to identify and correct mistakes
- Use grammar, formatting, or procedural errors

4. **Application Questions**
- Don't just test recall—test understanding
- Ask "Why?" and "How?" not just "What?"
- Connect concepts to practical situations

### Example: Transforming Boring → Engaging

❌ **Boring Question:**
```json
{
  "question": "What is a STOP sign?",
  "options": [
    {"text": "A red octagonal sign", "isCorrect": true},
    {"text": "A yellow triangle", "isCorrect": false}
  ]
}
```

✅ **Engaging Question:**
```json
{
  "question": "You approach an intersection with a red octagonal sign. What must you do?",
  "media": {
    "type": "image",
    "url": "https://example.com/stop-sign.png",
    "caption": "Red octagonal traffic sign"
  },
  "richContent": {
    "type": "html",
    "content": "<div style='padding:10px;background:#f5f5f5;'><h4>🛑 STOP Sign Facts</h4><ul><li><strong>Shape:</strong> Octagon (8 sides)</li><li><strong>Action:</strong> Come to a complete stop</li></ul></div>"
  },
  "type": "multiple-choice",
  "options": [
    {"id": "a", "text": "Slow down and proceed if clear", "isCorrect": false},
    {"id": "b", "text": "Come to a complete stop, then proceed when safe", "isCorrect": true},
    {"id": "c", "text": "Stop only if other vehicles are present", "isCorrect": false}
  ]
}
```

---

## 📈 DIFFICULTY PROGRESSION

### Within Each Quiz
- **Questions 1-3:** Easy (warm-up, confidence building)
- **Questions 4-7:** Medium (core concepts, application)
- **Questions 8-10:** Hard (analysis, synthesis, challenge)

### Across Quizzes
- **Quiz 1:** 40% Easy, 50% Medium, 10% Hard
- **Quiz 2-3:** 30% Easy, 50% Medium, 20% Hard
- **Quiz 4+:** 20% Easy, 50% Medium, 30% Hard

### Points by Difficulty

| Difficulty | Points | Question Types |
|------------|--------|----------------|
| Easy | 10 pts | True/False, Simple MCQ |
| Medium | 15 pts | MCQ, Fill-blank, Multiple-select |
| Hard | 20-25 pts | Matching, Ordering, Short-answer with rich content |

---

## MEDIA ATTACHMENTS (Optional)

### Images
```json
"media": {
  "type": "image",
  "url": "https://example.com/image.png",
  "caption": "Optional image description"
}
```

### Videos (YouTube)
```json
"media": {
  "type": "video",
  "url": "https://www.youtube.com/watch?v=VIDEO_ID",
  "caption": "Video description"
}
```

### Audio
```json
"media": {
  "type": "audio",
  "url": "https://example.com/audio.mp3",
  "caption": "Audio description"
}
```

---

## ✅ GENERATION CHECKLIST

Before finalizing your quiz, verify:

### Format Validation
- [ ] All question types use **HYPHENS** (e.g., `multiple-choice`, NOT `multiple_choice`)
- [ ] Every question has `points` field (10, 15, or 20)
- [ ] Every question has `explanation` field
- [ ] Options use object format: `{ "id": "a", "text": "...", "isCorrect": true/false }`
- [ ] `passingScore` field is present (usually 70)
- [ ] `order` field is present with sequential number
- [ ] `version` field is present (default to 1)

### Content Validation (NEW Quiz Mode)
- [ ] **Questions based on content depth** (15-25 for basic, 25-50 for complex, 50+ for comprehensive)
- [ ] **All 7 question types** represented (or at least 5 types)
- [ ] **30-40% have rich content** (tables, HTML, LaTeX)
- [ ] **Meaningful hints when helpful** (avoid obvious statements)
- [ ] **Difficulty progression** (easy → medium → hard)
- [ ] **Covers key topic areas** comprehensively
- [ ] **Engaging scenarios** (not just recall questions)
- [ ] **Time limit** = questions × 1-2 minutes (adjust based on complexity)
- [ ] **Title Format:** "Quiz X: [Title]" where X = order number

### Content Validation (CONVERSION Mode)
- [ ] **Question count matches source exactly** - count verified
- [ ] **All questions from source included** - none skipped or omitted
- [ ] **Question wording preserved** - maintains original phrasing
- [ ] **Answer options preserved** - same options in same order
- [ ] **Correct answers maintained** - matches source quiz
- [ ] **Question order preserved** - follows source sequence
- [ ] **Explanations added** if missing from source (brief and accurate)
- [ ] **Hints added only if helpful** - not forced on every question
- [ ] **Time limit** = questions × 1-2 minutes

---

## YOUR TASK

**Choose your mode:**

### MODE 1: Generate NEW Quiz from Study Material

Generate a quiz based on the following study material.

**Quiz Parameters:**
- **License Category:** [B1/A/A1/etc.]
- **Topic Area:** [ROAD_SIGNS/TRAFFIC_RULES/etc.]
- **Quiz Title:** Quiz X: [TITLE]
- **Order:** [X]
- **Questions:** Based on content depth (15-25 basic, 25-50 complex, 50+ comprehensive)
- **Difficulty Mix:** [easy/medium/hard/mixed]
- **Rich Content:** YES (minimum 30-40% of questions)

### MODE 2: Convert EXISTING Quiz to JSON Format

Convert an existing quiz to the required JSON format.

**Conversion Parameters:**
- **License Category:** [B1/A/A1/etc.]
- **Topic Area:** [ROAD_SIGNS/TRAFFIC_RULES/etc.]
- **Quiz Title:** [Use original quiz title or create appropriate one]
- **Order:** [X]
- **Questions:** **MUST match source quiz exactly** - include ALL questions from original
- **Preserve:** Question wording, answer options, correct answers, question order
- **Add if missing:** Explanations (brief), hints (only if helpful)

**CRITICAL for Conversion Mode:**
- ✅ Count questions in source quiz first
- ✅ Output JSON must have EXACT same number of questions
- ✅ Do NOT skip, combine, or omit any questions
- ✅ Maintain original difficulty and complexity
- ✅ Keep question numbering/order from source

**Remember:**
- Use **HYPHENS** in type names: `multiple-choice`, `true-false`, `fill-blank`
- Include **ALL required fields**: `passingScore`, `order`, `points`
- Use **OBJECT format** for options: `{ "id": "a", "text": "...", "isCorrect": true }`
- **NEW Quiz Mode**: Cover ALL key areas from the material, use variety, make engaging
- **Conversion Mode**: Include ALL questions from source, preserve exact count and content
- Use VARIETY in question types
- Make questions ENGAGING with scenarios and visuals (for new quizzes)
- Include RICH CONTENT (tables, passages, formulas) when appropriate
- Challenge students to THINK, not just memorize
- **Hints**: Only provide meaningful hints that aid learning - avoid obvious statements

---

**STUDY MATERIAL / QUIZ TO CONVERT:**

[PASTE YOUR CONTENT HERE]

**If Converting:** State "CONVERSION MODE" and specify source format and question count

---

## END OF PROMPT
