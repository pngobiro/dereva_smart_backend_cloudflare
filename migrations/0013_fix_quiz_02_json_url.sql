-- Fix Quiz 2 json_url to include content/ prefix for R2

UPDATE quiz_banks 
SET 
    json_url = 'content/B1/quizzes/quiz-02-traffic-rules/quiz.json',
    updated_at = strftime('%s', 'now') * 1000
WHERE id = 'quiz-b1-traffic-rules-002';
