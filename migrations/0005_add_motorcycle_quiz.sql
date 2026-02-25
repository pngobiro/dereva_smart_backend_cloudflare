-- Migration: Add Motorcycle Basics Quiz
-- Add interactive quiz lesson for A1 motorcycle basics module

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
    'les-a1-basics-quiz',
    'mod-a1-intro',
    'Motorcycle Basics Quiz',
    'Test your knowledge with this interactive quiz covering T-CLOCS checks, safety gear, riding position, controls, and basic motorcycle operation. Includes multiple choice, true/false, fill-in-the-blank, and matching questions with multimedia support.',
    4,
    'interactive',
    'https://pub-16856a23f68347f2ae1c5b71791e9070.r2.dev/content/A1/01-motorcycle-basics/lesson-01-introduction/quiz.html',
    15,
    0,
    CURRENT_TIMESTAMP
);
