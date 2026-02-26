# Quiz System Documentation

## Overview

The Dereva Smart quiz system has been redesigned to use JSON-based quiz banks stored in R2, supporting rich multimedia content and flexible question types.

## Architecture

### Database Schema

**quiz_banks** - Quiz metadata and references
- `id`: Unique quiz identifier
- `title`: Quiz display title
- `description`: Quiz description
- `license_category`: License category (A1, A, B1, B, C, D, E, F, G)
- `topic_area`: Topic classification (ROAD_SIGNS, TRAFFIC_RULES, etc.)
- `difficulty`: EASY, MEDIUM, HARD, or MIXED
- `total_questions`: Number of questions in quiz
- `time_limit`: Time limit in minutes
- `passing_score`: Minimum score to pass (percentage)
- `is_premium`: 0 for free, 1 for premium
- `json_url`: Path to quiz JSON file in R2
- `version`: Quiz version number
- `display_order`: Display order in list

**quiz_attempts** - User quiz sessions
- `id`: Attempt identifier
- `user_id`: User who took the quiz
- `quiz_bank_id`: Reference to quiz_banks
- `started_at`: Start timestamp
- `completed_at`: Completion timestamp
- `time_taken`: Time taken in seconds
- `total_questions`: Number of questions
- `correct_answers`: Number correct
- `score`: Percentage score
- `passed`: 1 if passed, 0 if failed
- `answers_json`: JSON of user answers

### Content Structure

```
content/
└── B1/
    └── quizzes/
        ├── quiz-01-road-signs/
        │   ├── quiz.json
        │   ├── images/          # Optional
        │   ├── videos/          # Optional
        │   └── audio/           # Optional
        ├── quiz-02-traffic-rules/
        │   └── quiz.json
        └── ...
```

## Quiz JSON Format

### Root Structure

```json
{
  "id": "quiz-b1-road-signs-001",
  "title": "Quiz 1: Road Signs and Markings",
  "description": "Test your knowledge of Kenyan road signs",
  "licenseCategory": "B1",
  "topicArea": "ROAD_SIGNS",
  "difficulty": "EASY",
  "timeLimit": 30,
  "passingScore": 70,
  "isPaid": false,
  "version": 1,
  "order": 1,
  "questions": [...]
}
```

### Question Types

#### 1. Multiple Choice
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
  "hint": "Think about the shape"
}
```

#### 2. True/False
```json
{
  "id": "q2",
  "type": "true-false",
  "question": "You can overtake on a broken white line.",
  "points": 10,
  "correctAnswer": true,
  "explanation": "Broken lines allow overtaking when safe."
}
```

#### 3. Multiple Select
```json
{
  "id": "q3",
  "type": "multiple-select",
  "question": "Which are types of road signs? (Select all)",
  "points": 15,
  "options": [
    { "id": "a", "text": "Warning", "isCorrect": true },
    { "id": "b", "text": "Prohibition", "isCorrect": true }
  ],
  "partialCredit": true,
  "explanation": "Main types are Warning, Prohibition, Mandatory, Information."
}
```

#### 4. Fill in the Blank
```json
{
  "id": "q4",
  "type": "fill-blank",
  "question": "The speed limit in built-up areas is ___BLANK___ km/h.",
  "points": 15,
  "blanks": [
    { "id": "blank1", "acceptedAnswers": ["50", "fifty"] }
  ],
  "caseSensitive": false,
  "explanation": "Default speed limit in towns is 50 km/h."
}
```

#### 5. Matching
```json
{
  "id": "q5",
  "type": "matching",
  "question": "Match each sign shape with its meaning:",
  "points": 20,
  "pairs": [
    { "id": "p1", "left": "Octagon", "right": "Stop" },
    { "id": "p2", "left": "Triangle", "right": "Warning" }
  ],
  "partialCredit": true,
  "explanation": "Each shape has a specific meaning."
}
```

#### 6. Ordering
```json
{
  "id": "q6",
  "type": "ordering",
  "question": "Arrange these steps in correct order:",
  "points": 20,
  "items": [
    { "id": "item1", "text": "Signal", "correctPosition": 1 },
    { "id": "item2", "text": "Check mirrors", "correctPosition": 2 }
  ],
  "partialCredit": true,
  "explanation": "Correct sequence ensures safety."
}
```

#### 7. Short Answer
```json
{
  "id": "q7",
  "type": "short-answer",
  "question": "What is the legal blood alcohol limit in Kenya?",
  "points": 15,
  "acceptedAnswers": ["0", "0%", "0.00%", "zero"],
  "caseSensitive": false,
  "explanation": "Kenya has zero tolerance - 0.00%."
}
```

### Rich Content Support

#### Images
```json
"media": {
  "type": "image",
  "url": "B1/quizzes/quiz-01-road-signs/images/stop-sign.jpg",
  "caption": "Red octagonal STOP sign"
}
```

#### Videos
```json
"media": {
  "type": "video",
  "url": "B1/quizzes/quiz-03-vehicle-safety/videos/brake-check.mp4",
  "caption": "How to check brakes"
}
```

#### Audio
```json
"media": {
  "type": "audio",
  "url": "B1/quizzes/quiz-02-traffic-rules/audio/siren.mp3",
  "caption": "Emergency vehicle siren"
}
```

#### HTML Content
```json
"richContent": {
  "type": "html",
  "content": "<div style='background:#f9f9f9; padding:15px;'><h4>Scenario</h4><p>You are approaching...</p></div>"
}
```

#### Data Tables
```json
"richContent": {
  "type": "table",
  "content": "<table><thead><tr><th>Speed Limit</th><th>Area</th></tr></thead><tbody><tr><td>50 km/h</td><td>Built-up</td></tr></tbody></table>"
}
```

#### LaTeX Math
```json
"richContent": {
  "type": "latex",
  "content": "\\text{Stopping Distance} = \\frac{v^2}{2 \\times \\mu \\times g}"
}
```

## Current B1 Quizzes

### Quiz 1: Road Signs and Markings (FREE)
- **ID**: quiz-b1-road-signs-001
- **Questions**: 10 (currently uploaded)
- **Time**: 30 minutes
- **Passing**: 70%
- **Topics**: Sign shapes, colors, meanings, road markings

### Quiz 2: Traffic Rules and Regulations (PREMIUM)
- **ID**: quiz-b1-traffic-rules-001
- **Questions**: 25
- **Time**: 35 minutes
- **Passing**: 70%
- **Topics**: Right of way, speed limits, regulations

### Quiz 3: Vehicle Safety and Maintenance (PREMIUM)
- **ID**: quiz-b1-vehicle-safety-001
- **Questions**: 20
- **Time**: 30 minutes
- **Passing**: 70%
- **Topics**: Safety checks, maintenance, emergencies

### Quiz 4: Defensive Driving (PREMIUM)
- **ID**: quiz-b1-defensive-driving-001
- **Questions**: 25
- **Time**: 35 minutes
- **Passing**: 70%
- **Topics**: Hazard awareness, safe driving practices

### Quiz 5: Comprehensive Mock Test (PREMIUM)
- **ID**: quiz-b1-comprehensive-001
- **Questions**: 50
- **Time**: 60 minutes
- **Passing**: 80%
- **Topics**: All topics combined

## API Endpoints

### Get Quiz Banks
```
GET /api/quizzes?category=B1
```

Response:
```json
{
  "quizzes": [
    {
      "id": "quiz-b1-road-signs-001",
      "title": "Quiz 1: Road Signs and Markings",
      "description": "Test your knowledge...",
      "licenseCategory": "B1",
      "topicArea": "ROAD_SIGNS",
      "difficulty": "EASY",
      "totalQuestions": 10,
      "timeLimit": 30,
      "passingScore": 70,
      "isPremium": false,
      "order": 1
    }
  ]
}
```

### Get Quiz Content
```
GET /api/quizzes/:id
```

Response: Full quiz JSON with questions

### Submit Quiz Attempt
```
POST /api/quizzes/:id/attempts
```

Request:
```json
{
  "answers": [
    { "questionId": "q1", "answer": "b" },
    { "questionId": "q2", "answer": true }
  ],
  "timeTaken": 1200
}
```

Response:
```json
{
  "attemptId": "attempt-123",
  "score": 85,
  "passed": true,
  "correctAnswers": 17,
  "totalQuestions": 20,
  "feedback": [...]
}
```

## Content Management

### Upload Quiz
```bash
# Sync all content including quizzes
node scripts/manage_content.js

# Watch for changes
node scripts/manage_content.js --watch
```

### Add New Quiz

1. Create folder: `content/B1/quizzes/quiz-XX-topic/`
2. Create `quiz.json` with questions
3. Add media files if needed (images/, videos/, audio/)
4. Run sync: `node scripts/manage_content.js`
5. Create migration to add to `quiz_banks` table
6. Apply migration: `npx wrangler d1 migrations apply dereva-smart --remote`

### Update Existing Quiz

1. Edit `quiz.json` file
2. Increment `version` number
3. Run sync: `node scripts/manage_content.js`
4. Update database if metadata changed

## Best Practices

1. **Question Quality**: Write clear, unambiguous questions
2. **Explanations**: Always provide educational explanations
3. **Hints**: Only meaningful hints, not obvious statements
4. **Media**: Use images/videos to enhance understanding
5. **Variety**: Mix question types for engagement
6. **Difficulty**: Progress from easy to hard
7. **Time Limits**: 1-2 minutes per question
8. **Testing**: Test all quizzes before deployment

## Public URLs

Quiz JSON files are accessible at:
```
https://pub-YOUR-ID.r2.dev/content/B1/quizzes/quiz-01-road-signs/quiz.json
```

Media files:
```
https://pub-YOUR-ID.r2.dev/content/B1/quizzes/quiz-01-road-signs/images/sign.jpg
```

## Migration History

- **0011_redesign_quiz_system.sql**: Created quiz_banks and quiz_attempts tables, inserted B1 quiz banks
