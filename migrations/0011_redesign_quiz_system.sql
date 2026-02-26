-- Redesign Quiz System with Quiz Banks and JSON-based Questions
-- Questions stored in R2 as JSON files with multimedia support

-- Drop old questions table (backup data first if needed)
DROP TABLE IF EXISTS questions;

-- Quiz Banks (modules that contain questions)
CREATE TABLE IF NOT EXISTS quiz_banks (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    license_category TEXT NOT NULL,
    topic_area TEXT NOT NULL,
    difficulty TEXT NOT NULL DEFAULT 'MIXED',
    total_questions INTEGER NOT NULL DEFAULT 0,
    time_limit INTEGER NOT NULL,
    passing_score INTEGER NOT NULL DEFAULT 70,
    is_premium INTEGER NOT NULL DEFAULT 1,
    json_url TEXT NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
);

CREATE INDEX idx_quiz_banks_category ON quiz_banks(license_category);
CREATE INDEX idx_quiz_banks_topic ON quiz_banks(topic_area);
CREATE INDEX idx_quiz_banks_difficulty ON quiz_banks(difficulty);
CREATE INDEX idx_quiz_banks_order ON quiz_banks(display_order);

-- Quiz attempts (user quiz sessions)
CREATE TABLE IF NOT EXISTS quiz_attempts (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    quiz_bank_id TEXT NOT NULL,
    started_at INTEGER NOT NULL,
    completed_at INTEGER,
    time_taken INTEGER,
    total_questions INTEGER NOT NULL,
    correct_answers INTEGER,
    score REAL,
    passed INTEGER,
    answers_json TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (quiz_bank_id) REFERENCES quiz_banks(id) ON DELETE CASCADE
);

CREATE INDEX idx_quiz_attempts_user ON quiz_attempts(user_id);
CREATE INDEX idx_quiz_attempts_bank ON quiz_attempts(quiz_bank_id);
CREATE INDEX idx_quiz_attempts_date ON quiz_attempts(started_at);

-- Update test_results table to reference quiz_banks
ALTER TABLE test_results ADD COLUMN quiz_bank_id TEXT;
CREATE INDEX idx_test_results_quiz_bank ON test_results(quiz_bank_id);

-- Insert B1 Quiz Banks
INSERT INTO quiz_banks (
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
) VALUES
(
    'quiz-b1-road-signs-001',
    'Quiz 1: Road Signs and Markings',
    'Test your knowledge of Kenyan road signs, traffic signals, and road markings',
    'B1',
    'ROAD_SIGNS',
    'EASY',
    20,
    30,
    70,
    0,
    'B1/quizzes/quiz-01-road-signs/quiz.json',
    1,
    1,
    strftime('%s', 'now') * 1000,
    strftime('%s', 'now') * 1000
),
(
    'quiz-b1-traffic-rules-001',
    'Quiz 2: Traffic Rules and Regulations',
    'Master the essential traffic rules, right of way, and driving regulations in Kenya',
    'B1',
    'TRAFFIC_RULES',
    'MEDIUM',
    25,
    35,
    70,
    1,
    'B1/quizzes/quiz-02-traffic-rules/quiz.json',
    1,
    2,
    strftime('%s', 'now') * 1000,
    strftime('%s', 'now') * 1000
),
(
    'quiz-b1-vehicle-safety-001',
    'Quiz 3: Vehicle Safety and Maintenance',
    'Learn about vehicle safety checks, maintenance, and emergency procedures',
    'B1',
    'VEHICLE_SAFETY',
    'MEDIUM',
    20,
    30,
    70,
    1,
    'B1/quizzes/quiz-03-vehicle-safety/quiz.json',
    1,
    3,
    strftime('%s', 'now') * 1000,
    strftime('%s', 'now') * 1000
),
(
    'quiz-b1-defensive-driving-001',
    'Quiz 4: Defensive Driving',
    'Practice defensive driving techniques, hazard awareness, and safe driving practices',
    'B1',
    'DEFENSIVE_DRIVING',
    'MEDIUM',
    25,
    35,
    70,
    1,
    'B1/quizzes/quiz-04-defensive-driving/quiz.json',
    1,
    4,
    strftime('%s', 'now') * 1000,
    strftime('%s', 'now') * 1000
),
(
    'quiz-b1-comprehensive-001',
    'Quiz 5: Comprehensive Mock Test',
    'Full-length mock test covering all topics - simulates the actual driving theory exam',
    'B1',
    'COMPREHENSIVE',
    'MIXED',
    50,
    60,
    80,
    1,
    'B1/quizzes/quiz-05-comprehensive/quiz.json',
    1,
    5,
    strftime('%s', 'now') * 1000,
    strftime('%s', 'now') * 1000
);
