-- Add Premium Parking Maneuvers Lesson to B1 Module
-- Migration: 0008_add_parking_maneuvers_lesson.sql

-- Insert Lesson 3: Advanced Parking Maneuvers (PREMIUM)
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
    'lesson-b1-parking-maneuvers',
    'mod-b1-basics',
    'Advanced Parking Maneuvers',
    'Master all parking techniques including parallel parking, bay parking (90°), angle parking (45°), and hill start parking. Includes interactive simulator, video tutorials, and comprehensive quizzes for each parking type.',
    3,
    'HTML',
    'https://pub-16856a23f68347f2ae1c5b71791e9070.r2.dev/content/B1/01-vehicle-basics/lesson-03-parking-maneuvers/index.html',
    45,
    1,
    strftime('%s', 'now') * 1000
);

-- Update module lesson count
UPDATE modules 
SET lesson_count = 3,
    updated_at = strftime('%s', 'now') * 1000
WHERE id = 'mod-b1-basics';
