# School Progress Sharing Feature

## Overview
When a user is connected to a driving school (has `driving_school_id` set), their mock test progress is automatically shared with the school. This allows schools to monitor their students' performance and provide better support.

## How It Works

### Automatic Progress Sharing
1. User completes a quiz/mock test
2. System checks if user has `driving_school_id` set
3. If yes, creates a record in `school_student_progress` table
4. School can view this progress through admin dashboard

### Data Shared
- Quiz name and category
- Score and pass/fail status
- Number of questions and correct answers
- Time taken to complete
- Completion timestamp

## Database Schema

### school_student_progress Table
```sql
CREATE TABLE school_student_progress (
    id TEXT PRIMARY KEY,
    school_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    quiz_attempt_id TEXT NOT NULL,
    quiz_bank_id TEXT NOT NULL,
    quiz_name TEXT NOT NULL,
    category TEXT NOT NULL,
    score REAL NOT NULL,
    passed INTEGER NOT NULL,
    total_questions INTEGER NOT NULL,
    correct_answers INTEGER NOT NULL,
    time_taken INTEGER,
    completed_at INTEGER NOT NULL,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (school_id) REFERENCES schools(id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (quiz_attempt_id) REFERENCES quiz_attempts(id),
    FOREIGN KEY (quiz_bank_id) REFERENCES quiz_banks(id)
);
```

## API Endpoints

### Get School Student Progress
```
GET /api/admin/schools/:schoolId/progress
Query Parameters:
  - userId (optional): Filter by specific user
  - category (optional): Filter by license category (B1, B2, C1)
  - limit (optional): Number of records to return (default: 50)

Response:
{
  "progress": [
    {
      "id": "progress-123",
      "userId": "user-456",
      "userName": "John Doe",
      "userPhone": "0712345678",
      "quizName": "Traffic Rules Quiz",
      "category": "B1",
      "score": 85,
      "passed": true,
      "totalQuestions": 40,
      "correctAnswers": 34,
      "timeTaken": 1200,
      "completedAt": 1234567890000
    }
  ]
}
```

### Get School Statistics
```
GET /api/admin/schools/:schoolId/stats

Response:
{
  "totalStudents": 50,
  "totalAttempts": 250,
  "averageScore": 78,
  "passRate": 85,
  "topPerformers": [
    {
      "id": "user-123",
      "name": "Jane Smith",
      "phoneNumber": "0723456789",
      "avgScore": 92,
      "attempts": 10,
      "passedCount": 10
    }
  ],
  "categoryStats": [
    {
      "category": "B1",
      "attempts": 150,
      "avgScore": 80,
      "passed": 130,
      "passRate": 87
    }
  ]
}
```

### Get Individual Student Progress
```
GET /api/admin/schools/:schoolId/students/:userId/progress

Response:
{
  "student": {
    "id": "user-123",
    "name": "John Doe",
    "phoneNumber": "0712345678",
    "targetCategory": "B1"
  },
  "summary": {
    "totalAttempts": 15,
    "avgScore": 82,
    "passedCount": 13,
    "passRate": 87
  },
  "progress": [
    {
      "id": "progress-123",
      "quizName": "Traffic Rules Quiz",
      "category": "B1",
      "score": 85,
      "passed": true,
      "totalQuestions": 40,
      "correctAnswers": 34,
      "timeTaken": 1200,
      "completedAt": 1234567890000
    }
  ]
}
```

## Admin Dashboard Pages

### School Progress Overview
**URL:** `/schools/:schoolId/progress`

Features:
- Summary statistics (total students, attempts, avg score, pass rate)
- Top performers (last 30 days)
- Performance by category
- Filters by category and user
- Recent quiz attempts table

### Individual Student Progress
**URL:** `/schools/:schoolId/students/:userId/progress`

Features:
- Student information
- Summary statistics
- Complete quiz history
- Score trends

## Implementation Details

### Backend (src/routes/quizzes.ts)
When a quiz is submitted:
1. Save quiz attempt to `quiz_attempts` table
2. Check if user has `driving_school_id`
3. If yes, create record in `school_student_progress`
4. Include quiz metadata (name, category, score, etc.)

### Admin Routes (src/routes/admin.ts)
Three new endpoints:
1. `/admin/schools/:schoolId/progress` - List all progress
2. `/admin/schools/:schoolId/stats` - School statistics
3. `/admin/schools/:schoolId/students/:userId/progress` - Individual student

### Admin UI
Two new pages:
1. School progress overview with filters and stats
2. Individual student progress detail page

## Privacy & Security

- Only school admins can view their own students' progress
- Students must be linked to school (`driving_school_id` set)
- Progress is shared automatically, no opt-in required
- Data includes only quiz performance, not personal details

## Use Cases

1. **School Monitoring**
   - Track overall student performance
   - Identify struggling students
   - Monitor category-specific performance

2. **Student Support**
   - Provide targeted help to low performers
   - Recognize top performers
   - Track individual progress over time

3. **Commission Justification**
   - Schools can see value they provide
   - Track student engagement
   - Demonstrate student success rates

## Testing

1. Create a user with `driving_school_id` set
2. Complete a quiz as that user
3. Check `school_student_progress` table for new record
4. View progress in admin dashboard at `/schools/:schoolId/progress`
5. Verify statistics are calculated correctly

## Future Enhancements

- Email notifications to schools for student milestones
- Export progress reports to PDF/Excel
- Comparative analytics across schools
- Student progress sharing opt-out option
- Real-time progress updates via WebSocket
