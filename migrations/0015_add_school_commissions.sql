-- Create school commissions table
CREATE TABLE IF NOT EXISTS school_commissions (
    id TEXT PRIMARY KEY,
    school_id TEXT NOT NULL,
    payment_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    payment_amount REAL NOT NULL,
    commission_rate REAL NOT NULL,
    commission_amount REAL NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING',
    paid_at INTEGER,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
    FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_school_commissions_school_id ON school_commissions(school_id);
CREATE INDEX IF NOT EXISTS idx_school_commissions_status ON school_commissions(status);
CREATE INDEX IF NOT EXISTS idx_school_commissions_payment_id ON school_commissions(payment_id);
