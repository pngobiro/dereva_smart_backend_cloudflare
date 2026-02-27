-- Update Quiz 2: Traffic Rules with correct details

UPDATE quiz_banks 
SET 
    id = 'quiz-b1-traffic-rules-002',
    title = 'Quiz 2: Traffic Rules and Right of Way',
    description = 'Test your knowledge of Kenyan traffic rules, right of way, and road safety regulations',
    topic_area = 'TRAFFIC_RULES',
    difficulty = 'MEDIUM',
    total_questions = 10,
    time_limit = 25,
    passing_score = 75,
    is_premium = 0,
    json_url = 'B1/quizzes/quiz-02-traffic-rules/quiz.json',
    version = 1,
    display_order = 2,
    updated_at = strftime('%s', 'now') * 1000
WHERE id = 'quiz-b1-traffic-rules-001';

-- If the old record doesn't exist, insert the new one
INSERT OR IGNORE INTO quiz_banks (
    id, 
    title, 
    description, 
    license_category, 
    topic_area, 
    difficulty, 
    total_questions, 
    time_limit, 
    passing_score, 
    is_premium, 
    json_url, 
    version, 
    display_order, 
    created_at, 
    updated_at
) VALUES (
    'quiz-b1-traffic-rules-002',
    'Quiz 2: Traffic Rules and Right of Way',
    'Test your knowledge of Kenyan traffic rules, right of way, and road safety regulations',
    'B1',
    'TRAFFIC_RULES',
    'MEDIUM',
    10,
    25,
    75,
    0,
    'B1/quizzes/quiz-02-traffic-rules/quiz.json',
    1,
    2,
    strftime('%s', 'now') * 1000,
    strftime('%s', 'now') * 1000
);
