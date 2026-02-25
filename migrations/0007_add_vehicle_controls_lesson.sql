-- Migration: Add Vehicle Controls Lesson to B1 Module
-- Interactive lesson covering vehicle controls, road rules, and safety procedures

INSERT INTO lessons (
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
    'les-b1-vehicle-controls',
    'mod-b1-basics',
    'Vehicle Controls & Road Rules',
    'Comprehensive guide to vehicle controls, road rules in Kenya, traffic signs, and emergency procedures. Features interactive demonstrations of steering, acceleration, braking, clutch operation, and gear changes. Includes POWDERY safety checks and essential driving techniques.',
    2,
    'interactive',
    'https://pub-16856a23f68347f2ae1c5b71791e9070.r2.dev/content/B1/01-vehicle-basics/lesson-02-vehicle-controls/',
    25,
    0,
    CURRENT_TIMESTAMP
);

-- Update module lesson count
UPDATE modules 
SET lesson_count = 2
WHERE id = 'mod-b1-basics';
