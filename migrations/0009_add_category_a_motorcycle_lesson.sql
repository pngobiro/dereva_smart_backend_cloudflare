-- Migration: Add Category A Motorcycle Lesson
-- Category A is for unlimited motorcycles (no power restrictions)

-- First, ensure the module exists for Category A
INSERT OR IGNORE INTO modules (
    id,
    title,
    description,
    order_index,
    license_category,
    thumbnail_url,
    estimated_duration,
    lesson_count,
    download_size,
    requires_subscription,
    created_at,
    updated_at
) VALUES (
    'mod-a-basics',
    'Motorcycle Basics - Category A',
    'Master unlimited motorcycle operation and safety fundamentals',
    1,
    'A',
    'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=400',
    45,
    1,
    2500000,
    0,
    strftime('%s', 'now') * 1000,
    strftime('%s', 'now') * 1000
);

-- Add the Category A motorcycle introduction lesson
INSERT OR IGNORE INTO lessons (
    id,
    module_id,
    title,
    description,
    order_index,
    content_type,
    content_url,
    duration,
    requires_subscription,
    created_at
) VALUES (
    'les-a-basics-intro',
    'mod-a-basics',
    'Introduction to Category A Motorcycles',
    'Complete guide to unlimited motorcycle operation, safety, and advanced riding techniques',
    1,
    'INTERACTIVE',
    'https://pub-16856a23f68347f2ae1c5b71791e9070.r2.dev/content/A/01-motorcycle-basics/lesson-01-introduction/index.html',
    45,
    0,
    strftime('%s', 'now') * 1000
);
