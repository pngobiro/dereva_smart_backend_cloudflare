-- Dereva Smart Database Schema
-- Initial migration for D1 database

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    phone_number TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    email TEXT,
    target_category TEXT NOT NULL,
    driving_school_id TEXT,
    subscription_status TEXT NOT NULL DEFAULT 'FREE',
    subscription_expiry_date INTEGER,
    is_phone_verified INTEGER NOT NULL DEFAULT 0,
    is_guest_mode INTEGER NOT NULL DEFAULT 0,
    user_role TEXT NOT NULL DEFAULT 'LEARNER',
    created_at INTEGER NOT NULL,
    last_active_at INTEGER NOT NULL,
    last_login_at INTEGER,
    FOREIGN KEY (driving_school_id) REFERENCES schools(id)
);

CREATE INDEX idx_users_phone ON users(phone_number);
CREATE INDEX idx_users_school ON users(driving_school_id);
CREATE INDEX idx_users_role ON users(user_role);

-- Admin users table (separate from learners)
CREATE TABLE IF NOT EXISTS admin_users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    phone_number TEXT,
    role TEXT NOT NULL,
    school_id TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at INTEGER NOT NULL,
    created_by TEXT,
    last_login_at INTEGER,
    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES admin_users(id)
);

CREATE INDEX idx_admin_email ON admin_users(email);
CREATE INDEX idx_admin_role ON admin_users(role);
CREATE INDEX idx_admin_school ON admin_users(school_id);

-- Admin roles and permissions
CREATE TABLE IF NOT EXISTS admin_roles (
    id TEXT PRIMARY KEY,
    role_name TEXT UNIQUE NOT NULL,
    description TEXT,
    permissions TEXT NOT NULL,
    created_at INTEGER NOT NULL
);

-- Insert default roles
INSERT INTO admin_roles (id, role_name, description, permissions, created_at) VALUES
('role-super-admin', 'SUPER_ADMIN', 'Dereva Smart platform owner with full access', 
 '["manage_schools","manage_admins","manage_content","manage_payments","view_analytics","manage_system"]',
 strftime('%s', 'now') * 1000),
('role-school-admin', 'SCHOOL_ADMIN', 'School owner/manager with school-level access',
 '["manage_instructors","manage_students","view_school_analytics","manage_school_settings"]',
 strftime('%s', 'now') * 1000),
('role-instructor', 'INSTRUCTOR', 'Driving instructor with limited access',
 '["view_assigned_students","update_student_progress","view_schedule"]',
 strftime('%s', 'now') * 1000);

-- Admin activity log
CREATE TABLE IF NOT EXISTS admin_activity_log (
    id TEXT PRIMARY KEY,
    admin_id TEXT NOT NULL,
    action TEXT NOT NULL,
    entity_type TEXT,
    entity_id TEXT,
    details TEXT,
    ip_address TEXT,
    user_agent TEXT,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (admin_id) REFERENCES admin_users(id) ON DELETE CASCADE
);

CREATE INDEX idx_admin_log_admin ON admin_activity_log(admin_id);
CREATE INDEX idx_admin_log_action ON admin_activity_log(action);
CREATE INDEX idx_admin_log_date ON admin_activity_log(created_at);

-- Driving schools table
CREATE TABLE IF NOT EXISTS schools (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    registration_number TEXT UNIQUE NOT NULL,
    phone_number TEXT NOT NULL,
    email TEXT,
    address TEXT,
    county TEXT,
    town TEXT,
    is_verified INTEGER NOT NULL DEFAULT 0,
    commission_rate REAL NOT NULL DEFAULT 0.15,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
);

CREATE INDEX idx_schools_registration ON schools(registration_number);

-- School license categories (many-to-many relationship)
CREATE TABLE IF NOT EXISTS school_license_categories (
    id TEXT PRIMARY KEY,
    school_id TEXT NOT NULL,
    license_category TEXT NOT NULL,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
    UNIQUE(school_id, license_category)
);

CREATE INDEX idx_school_licenses_school ON school_license_categories(school_id);
CREATE INDEX idx_school_licenses_category ON school_license_categories(license_category);

-- Modules table
CREATE TABLE IF NOT EXISTS modules (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    order_index INTEGER NOT NULL,
    license_category TEXT NOT NULL,
    thumbnail_url TEXT,
    estimated_duration INTEGER NOT NULL,
    lesson_count INTEGER NOT NULL,
    download_size INTEGER NOT NULL DEFAULT 0,
    requires_subscription INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
);

CREATE INDEX idx_modules_category ON modules(license_category);
CREATE INDEX idx_modules_order ON modules(order_index);

-- Lessons table
CREATE TABLE IF NOT EXISTS lessons (
    id TEXT PRIMARY KEY,
    module_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    order_index INTEGER NOT NULL,
    content_type TEXT NOT NULL,
    content_url TEXT,
    content_text TEXT,
    duration INTEGER NOT NULL,
    requires_subscription INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE
);

CREATE INDEX idx_lessons_module ON lessons(module_id);
CREATE INDEX idx_lessons_order ON lessons(order_index);

-- Questions table
CREATE TABLE IF NOT EXISTS questions (
    id TEXT PRIMARY KEY,
    question_text TEXT NOT NULL,
    option_a TEXT NOT NULL,
    option_b TEXT NOT NULL,
    option_c TEXT NOT NULL,
    option_d TEXT NOT NULL,
    correct_answer TEXT NOT NULL,
    explanation TEXT,
    category TEXT NOT NULL,
    license_category TEXT NOT NULL,
    difficulty TEXT NOT NULL DEFAULT 'MEDIUM',
    image_url TEXT,
    created_at INTEGER NOT NULL
);

CREATE INDEX idx_questions_category ON questions(category);
CREATE INDEX idx_questions_license ON questions(license_category);
CREATE INDEX idx_questions_difficulty ON questions(difficulty);

-- Test results table
CREATE TABLE IF NOT EXISTS test_results (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    test_type TEXT NOT NULL,
    total_questions INTEGER NOT NULL,
    correct_answers INTEGER NOT NULL,
    score REAL NOT NULL,
    time_taken INTEGER NOT NULL,
    passed INTEGER NOT NULL,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_test_results_user ON test_results(user_id);
CREATE INDEX idx_test_results_date ON test_results(created_at);

-- Progress tracking table
CREATE TABLE IF NOT EXISTS lesson_progress (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    lesson_id TEXT NOT NULL,
    module_id TEXT NOT NULL,
    is_completed INTEGER NOT NULL DEFAULT 0,
    completion_percentage INTEGER NOT NULL DEFAULT 0,
    time_spent INTEGER NOT NULL DEFAULT 0,
    last_position INTEGER NOT NULL DEFAULT 0,
    started_at INTEGER NOT NULL,
    completed_at INTEGER,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE,
    FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE,
    UNIQUE(user_id, lesson_id)
);

CREATE INDEX idx_progress_user ON lesson_progress(user_id);
CREATE INDEX idx_progress_lesson ON lesson_progress(lesson_id);
CREATE INDEX idx_progress_module ON lesson_progress(module_id);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    amount REAL NOT NULL,
    currency TEXT NOT NULL DEFAULT 'KES',
    payment_method TEXT NOT NULL,
    transaction_id TEXT UNIQUE,
    mpesa_receipt_number TEXT,
    phone_number TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING',
    subscription_type TEXT NOT NULL,
    subscription_months INTEGER,
    created_at INTEGER NOT NULL,
    completed_at INTEGER,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_payments_user ON payments(user_id);
CREATE INDEX idx_payments_transaction ON payments(transaction_id);
CREATE INDEX idx_payments_status ON payments(status);

-- Subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    payment_id TEXT,
    subscription_type TEXT NOT NULL,
    start_date INTEGER NOT NULL,
    end_date INTEGER,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (payment_id) REFERENCES payments(id)
);

CREATE INDEX idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_active ON subscriptions(is_active);

-- School linking table
CREATE TABLE IF NOT EXISTS school_links (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    school_id TEXT NOT NULL,
    link_code TEXT UNIQUE NOT NULL,
    license_category TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING',
    linked_at INTEGER,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
    UNIQUE(user_id, school_id, license_category)
);

CREATE INDEX idx_school_links_user ON school_links(user_id);
CREATE INDEX idx_school_links_school ON school_links(school_id);
CREATE INDEX idx_school_links_code ON school_links(link_code);

-- School instructors table
CREATE TABLE IF NOT EXISTS school_instructors (
    id TEXT PRIMARY KEY,
    school_id TEXT NOT NULL,
    name TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    email TEXT,
    instructor_license_number TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
);

CREATE INDEX idx_instructors_school ON school_instructors(school_id);
CREATE INDEX idx_instructors_phone ON school_instructors(phone_number);

-- Instructor license categories (many-to-many)
CREATE TABLE IF NOT EXISTS instructor_license_categories (
    id TEXT PRIMARY KEY,
    instructor_id TEXT NOT NULL,
    license_category TEXT NOT NULL,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (instructor_id) REFERENCES school_instructors(id) ON DELETE CASCADE,
    UNIQUE(instructor_id, license_category)
);

CREATE INDEX idx_instructor_licenses_instructor ON instructor_license_categories(instructor_id);
CREATE INDEX idx_instructor_licenses_category ON instructor_license_categories(license_category);

-- Student-Instructor assignments
CREATE TABLE IF NOT EXISTS student_instructor_assignments (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    instructor_id TEXT NOT NULL,
    school_id TEXT NOT NULL,
    license_category TEXT NOT NULL,
    assigned_at INTEGER NOT NULL,
    completed_at INTEGER,
    is_active INTEGER NOT NULL DEFAULT 1,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (instructor_id) REFERENCES school_instructors(id) ON DELETE CASCADE,
    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
);

CREATE INDEX idx_assignments_user ON student_instructor_assignments(user_id);
CREATE INDEX idx_assignments_instructor ON student_instructor_assignments(instructor_id);
CREATE INDEX idx_assignments_school ON student_instructor_assignments(school_id);

-- AI Tutor conversations table
CREATE TABLE IF NOT EXISTS tutor_conversations (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    context TEXT,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_tutor_user ON tutor_conversations(user_id);
CREATE INDEX idx_tutor_date ON tutor_conversations(created_at);

-- Sessions table (for JWT refresh tokens)
CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    expires_at INTEGER NOT NULL,
    device_id TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_sessions_expires ON sessions(expires_at);

-- Verification codes table
CREATE TABLE IF NOT EXISTS verification_codes (
    code TEXT PRIMARY KEY,
    phone_number TEXT NOT NULL,
    expires_at INTEGER NOT NULL,
    is_used INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL
);

CREATE INDEX idx_verification_phone ON verification_codes(phone_number);
CREATE INDEX idx_verification_expires ON verification_codes(expires_at);
