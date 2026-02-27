-- Add school branches table
CREATE TABLE IF NOT EXISTS school_branches (
    id TEXT PRIMARY KEY,
    school_id TEXT NOT NULL,
    branch_name TEXT NOT NULL,
    location TEXT NOT NULL,
    contact_person TEXT,
    phone TEXT NOT NULL,
    email TEXT,
    address TEXT,
    county TEXT,
    town TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_school_branches_school_id ON school_branches(school_id);
CREATE INDEX IF NOT EXISTS idx_school_branches_active ON school_branches(is_active);

-- Add columns to schools table for main/head office info
ALTER TABLE schools ADD COLUMN total_branches INTEGER DEFAULT 0;
ALTER TABLE schools ADD COLUMN main_branch_id TEXT;
