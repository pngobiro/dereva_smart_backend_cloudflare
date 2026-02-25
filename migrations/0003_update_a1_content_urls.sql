-- Migration: Update A1 Content URLs with R2 hosted content
-- Description: Update existing A1 lessons with actual R2 content URLs
-- Date: 2025-02-25

-- Update existing A1 lesson with rich HTML content
UPDATE lessons 
SET 
    content_url = 'https://pub-8bd8024b277632ef32a837c352da4229.r2.dev/content/A1/01-motorcycle-basics/lesson-01-introduction/',
    content_type = 'interactive',
    description = 'Complete beginner guide to motorcycle operation, controls, and basic riding techniques. Covers T-CLOCS safety checks, starting procedures, riding position, moving off, stopping, gear shifting, cornering, and safety gear (ATGATT).',
    duration = 30
WHERE id = 'les-a1-welcome';

-- Add new A1 lesson for road safety with rich HTML content
INSERT OR IGNORE INTO lessons (
    id, module_id, title, description, order_index, 
    content_type, content_url, content_text, duration, 
    requires_subscription, created_at
) VALUES (
    'les-a1-safety',
    'mod-a1-intro',
    'Road Safety for Motorcyclists',
    'Master defensive riding techniques and hazard awareness. Learn SIPDE method, common hazards, visibility strategies, safe following distance, lane positioning, group riding, emergency situations, and night riding safety.',
    3,
    'interactive',
    'https://pub-8bd8024b277632ef32a837c352da4229.r2.dev/content/A1/02-road-safety/lesson-01-defensive-riding/',
    NULL,
    25,
    0,
    strftime('%s', 'now') * 1000
);

-- Verify the updates
SELECT 
    l.id,
    l.title,
    l.content_type,
    l.duration,
    l.content_url,
    l.requires_subscription
FROM lessons l
WHERE l.module_id = 'mod-a1-intro'
ORDER BY l.order_index;
