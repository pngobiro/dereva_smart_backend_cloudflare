-- School Student Progress Sharing
-- Tracks quiz attempts and progress for students linked to schools

CREATE TABLE IF NOT EXISTS school_student_progress (
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
    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (quiz_attempt_id) REFERENCES quiz_attempts(id) ON DELETE CASCADE,
    FOREIGN KEY (quiz_bank_id) REFERENCES quiz_banks(id) ON DELETE CASCADE
);

CREATE INDEX idx_school_progress_school ON school_student_progress(school_id);
CREATE INDEX idx_school_progress_user ON school_student_progress(user_id);
CREATE INDEX idx_school_progress_date ON school_student_progress(completed_at);
CREATE INDEX idx_school_progress_category ON school_student_progress(category);

-- Add index for school + user queries
CREATE INDEX idx_school_progress_school_user ON school_student_progress(school_id, user_id);
