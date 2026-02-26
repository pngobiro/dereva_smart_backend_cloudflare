# B1 License Category Quizzes

This folder contains quiz banks for the B1 (Light Motor Vehicles) license category.

## Structure

```
B1/quizzes/
├── quiz-01-road-signs/
│   ├── quiz.json           # Quiz questions and metadata
│   ├── images/             # Quiz-specific images (optional)
│   └── README.md           # Quiz documentation
├── quiz-02-traffic-rules/
│   └── quiz.json
├── quiz-03-vehicle-safety/
│   └── quiz.json
├── quiz-04-defensive-driving/
│   └── quiz.json
└── quiz-05-comprehensive/
    └── quiz.json
```

## Quiz JSON Format

Each quiz.json file follows this structure:

```json
{
  "id": "quiz-b1-road-signs-001",
  "title": "Quiz 1: Road Signs and Markings",
  "description": "Test your knowledge of Kenyan road signs",
  "licenseCategory": "B1",
  "topicArea": "ROAD_SIGNS",
  "difficulty": "EASY|MEDIUM|HARD|MIXED",
  "timeLimit": 30,
  "passingScore": 70,
  "isPaid": false,
  "version": 1,
  "order": 1,
  "questions": [...]
}
```

## Question Types Supported

### 1. Multiple Choice (`multiple-choice`)
```json
{
  "id": "q1",
  "type": "multiple-choice",
  "question": "What does a red octagonal sign mean?",
  "points": 10,
  "options": [
    { "id": "a", "text": "Give way", "isCorrect": false },
    { "id": "b", "text": "Stop", "isCorrect": true }
  ],
  "explanation": "A red octagonal sign is a STOP sign.",
  "hint": "Think about the shape",
  "media": {
    "type": "image",
    "url": "B1/quizzes/quiz-01-road-signs/images/stop-sign.jpg",
    "caption": "Red octagonal STOP sign"
  }
}
```

### 2. True/False (`true-false`)
```json
{
  "id": "q2",
  "type": "true-false",
  "question": "You can overtake on a broken white line.",
  "points": 10,
  "correctAnswer": true,
  "explanation": "Broken lines allow overtaking when safe.",
  "hint": "Think about what 'broken' means"
}
```

### 3. Multiple Select (`multiple-select`)
```json
{
  "id": "q3",
  "type": "multiple-select",
  "question": "Which are types of road signs? (Select all)",
  "points": 15,
  "options": [
    { "id": "a", "text": "Warning", "isCorrect": true },
    { "id": "b", "text": "Prohibition", "isCorrect": true },
    { "id": "c", "text": "Suggestion", "isCorrect": false }
  ],
  "partialCredit": true,
  "explanation": "Main types are Warning, Prohibition, Mandatory, Information.",
  "hint": "Four main categories"
}
```

### 4. Fill in the Blank (`fill-blank`)
```json
{
  "id": "q4",
  "type": "fill-blank",
  "question": "The speed limit in built-up areas is ___BLANK___ km/h.",
  "points": 15,
  "blanks": [
    {
      "id": "blank1",
      "acceptedAnswers": ["50", "fifty"]
    }
  ],
  "caseSensitive": false,
  "explanation": "Default speed limit in towns is 50 km/h.",
  "hint": "Think about city driving"
}
```

### 5. Matching (`matching`)
```json
{
  "id": "q5",
  "type": "matching",
  "question": "Match each sign shape with its meaning:",
  "points": 20,
  "pairs": [
    { "id": "p1", "left": "Octagon", "right": "Stop" },
    { "id": "p2", "left": "Triangle", "right": "Warning" },
    { "id": "p3", "left": "Circle", "right": "Prohibition" }
  ],
  "partialCredit": true,
  "explanation": "Each shape has a specific meaning in road signs.",
  "hint": "Think about common sign shapes"
}
```

### 6. Ordering (`ordering`)
```json
{
  "id": "q6",
  "type": "ordering",
  "question": "Arrange these steps in the correct order for parallel parking:",
  "points": 20,
  "items": [
    { "id": "item1", "text": "Signal and position", "correctPosition": 1 },
    { "id": "item2", "text": "Reverse slowly", "correctPosition": 2 },
    { "id": "item3", "text": "Straighten wheels", "correctPosition": 3 },
    { "id": "item4", "text": "Check position", "correctPosition": 4 }
  ],
  "partialCredit": true,
  "explanation": "Correct sequence ensures safe parking.",
  "hint": "Start with what you do first"
}
```

### 7. Short Answer (`short-answer`)
```json
{
  "id": "q7",
  "type": "short-answer",
  "question": "What is the legal blood alcohol limit for drivers in Kenya?",
  "points": 15,
  "acceptedAnswers": ["0", "0%", "0.00%", "zero"],
  "caseSensitive": false,
  "partialMatch": false,
  "explanation": "Kenya has zero tolerance - 0.00% blood alcohol.",
  "hint": "Kenya has zero tolerance"
}
```

## Rich Content Support

### Images
```json
"media": {
  "type": "image",
  "url": "B1/quizzes/quiz-01-road-signs/images/sign.jpg",
  "caption": "Example road sign"
}
```

### Videos
```json
"media": {
  "type": "video",
  "url": "B1/quizzes/quiz-03-vehicle-safety/videos/brake-check.mp4",
  "caption": "How to check brakes"
}
```

### Audio
```json
"media": {
  "type": "audio",
  "url": "B1/quizzes/quiz-02-traffic-rules/audio/siren.mp3",
  "caption": "Emergency vehicle siren"
}
```

### HTML Content
```json
"richContent": {
  "type": "html",
  "content": "<div style='background:#f9f9f9; padding:15px;'><h4>Scenario</h4><p>You are approaching a junction...</p></div>"
}
```

### Data Tables
```json
"richContent": {
  "type": "table",
  "content": "<table><thead><tr><th>Speed Limit</th><th>Area</th></tr></thead><tbody><tr><td>50 km/h</td><td>Built-up</td></tr></tbody></table>"
}
```

### LaTeX Math
```json
"richContent": {
  "type": "latex",
  "content": "\\text{Stopping Distance} = \\frac{v^2}{2 \\times \\mu \\times g}"
}
```

## Quiz Difficulty Levels

- **EASY**: Basic recall, simple concepts (10 points per question)
- **MEDIUM**: Application, understanding (15 points per question)
- **HARD**: Analysis, complex scenarios (20 points per question)
- **MIXED**: Combination of all levels

## Best Practices

1. **Question Count**: 10-20 for topic quizzes, 40-50 for comprehensive
2. **Time Limit**: 1-2 minutes per question
3. **Passing Score**: 70% for topic quizzes, 80% for comprehensive
4. **Explanations**: Always provide clear, educational explanations
5. **Hints**: Only provide meaningful hints, not obvious statements
6. **Media**: Use images/videos to enhance understanding
7. **Variety**: Mix question types for engagement

## Free vs Premium

- **Free Quizzes** (`isPaid: false`): Basic road signs, essential rules
- **Premium Quizzes** (`isPaid: true`): Advanced topics, comprehensive tests

## Database Integration

Each quiz folder is registered in the `quiz_banks` table:

```sql
INSERT INTO quiz_banks (
    id, title, description, license_category, topic_area,
    difficulty, total_questions, time_limit, passing_score,
    is_premium, json_url, version, display_order
) VALUES (
    'quiz-b1-road-signs-001',
    'Quiz 1: Road Signs and Markings',
    'Test your knowledge of Kenyan road signs',
    'B1', 'ROAD_SIGNS', 'EASY', 10, 30, 70, 0,
    'B1/quizzes/quiz-01-road-signs/quiz.json',
    1, 1
);
```

## Adding New Quizzes

1. Create folder: `B1/quizzes/quiz-XX-topic-name/`
2. Create `quiz.json` with questions
3. Add images/media to subfolder if needed
4. Create migration to insert into `quiz_banks` table
5. Test quiz in app
6. Deploy to production

## Validation

Before deploying, validate your quiz JSON:

```bash
# Check JSON syntax
cat quiz.json | jq .

# Validate required fields
# - All questions have id, type, question, points, explanation
# - Options have id, text, isCorrect
# - Time limit and passing score are reasonable
```
