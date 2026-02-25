-- Migration: Add B1 Vehicle Category with 3D Town Simulation
-- Create B1 (Light Vehicles) category with interactive 3D driving simulation

-- Insert B1 module
INSERT INTO modules (
    id,
    title,
    description,
    order_index,
    license_category,
    estimated_duration,
    lesson_count,
    requires_subscription,
    created_at,
    updated_at
) VALUES (
    'mod-b1-basics',
    'Vehicle Basics & Town Driving',
    'Learn fundamental vehicle operation and practice driving in a realistic 3D town environment',
    1,
    'B1',
    30,
    1,
    0,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- Insert 3D Town Simulation lesson
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
    'les-b1-town-sim',
    'mod-b1-basics',
    '3D Town Driving Simulation',
    'Interactive 3D simulation of town driving. Practice navigating city streets, obeying traffic lights, avoiding obstacles, and parking. Features realistic physics, traffic elements, and scoring system. Use WASD keys to drive, Space for handbrake, and C to change camera views.',
    1,
    'interactive',
    'https://pub-16856a23f68347f2ae1c5b71791e9070.r2.dev/content/B1/01-vehicle-basics/lesson-01-town-simulation/',
    30,
    0,
    CURRENT_TIMESTAMP
);
