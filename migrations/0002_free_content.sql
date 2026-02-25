-- Migration: Add free sample content for guest users
-- This provides a preview of the app's features without requiring subscription

-- Insert free modules (one per category for demo)
INSERT INTO modules (id, title, description, license_category, order_index, requires_subscription, thumbnail_url, estimated_duration, lesson_count, download_size, created_at, updated_at) VALUES
-- B1 Category (Light Vehicle) - Most common
('mod-b1-intro', 'Introduction to Driving', 'Learn the basics of driving and road safety in Kenya', 'B1', 1, 0, NULL, 30, 4, 0, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
('mod-b1-signs', 'Road Signs & Markings', 'Understanding traffic signs and road markings', 'B1', 2, 1, NULL, 45, 6, 0, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),

-- A1 Category (Motorcycle)
('mod-a1-intro', 'Motorcycle Basics', 'Introduction to motorcycle riding and safety', 'A1', 1, 0, NULL, 25, 3, 0, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),

-- C Category (Medium Goods)
('mod-c-intro', 'Commercial Vehicle Basics', 'Introduction to driving commercial vehicles', 'C', 1, 0, NULL, 30, 3, 0, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),

-- D Category (Passenger Vehicle)
('mod-d-intro', 'Passenger Transport Basics', 'Introduction to passenger vehicle operation', 'D', 1, 0, NULL, 25, 3, 0, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000);

-- Insert free lessons for B1 Introduction module
INSERT INTO lessons (id, module_id, title, description, order_index, content_type, content_url, content_text, duration, requires_subscription, created_at) VALUES
('les-b1-welcome', 'mod-b1-intro', 'Welcome to Dereva Smart', 'Get started with your driving journey', 1, 'text', NULL, 'Welcome to Dereva Smart! This comprehensive driving education platform will help you prepare for your driving test and become a safe, confident driver on Kenyan roads.', 5, 0, strftime('%s', 'now') * 1000),
('les-b1-controls', 'mod-b1-intro', 'Vehicle Controls', 'Learn about basic vehicle controls and dashboard', 2, 'text', NULL, 'Understanding your vehicle controls is essential. Learn about the steering wheel, pedals, gear shift, indicators, lights, and dashboard instruments.', 10, 0, strftime('%s', 'now') * 1000),
('les-b1-safety', 'mod-b1-intro', 'Safety First', 'Essential safety rules for Kenyan roads', 3, 'text', NULL, 'Safety is paramount. Always wear seatbelts, check mirrors, maintain safe following distance, and obey traffic rules. Remember: arrive alive!', 8, 0, strftime('%s', 'now') * 1000),
('les-b1-premium', 'mod-b1-intro', 'Advanced Techniques', 'Master advanced driving techniques', 4, 'video', NULL, NULL, 15, 1, strftime('%s', 'now') * 1000);

-- Insert free lessons for A1 Motorcycle module
INSERT INTO lessons (id, module_id, title, description, order_index, content_type, content_url, content_text, duration, requires_subscription, created_at) VALUES
('les-a1-welcome', 'mod-a1-intro', 'Welcome to Motorcycle Training', 'Introduction to motorcycle riding', 1, 'text', NULL, 'Welcome to motorcycle training! Learn the fundamentals of safe motorcycle riding in Kenya.', 5, 0, strftime('%s', 'now') * 1000),
('les-a1-gear', 'mod-a1-intro', 'Motorcycle Gear & Safety', 'Essential protective gear and safety equipment', 2, 'text', NULL, 'Always wear a helmet, gloves, jacket, and proper footwear. Your safety gear can save your life.', 10, 0, strftime('%s', 'now') * 1000);

-- Insert free lessons for C Commercial module
INSERT INTO lessons (id, module_id, title, description, order_index, content_type, content_url, content_text, duration, requires_subscription, created_at) VALUES
('les-c-welcome', 'mod-c-intro', 'Commercial Vehicle Overview', 'Introduction to commercial driving', 1, 'text', NULL, 'Commercial vehicle driving requires special skills and knowledge. Learn the basics here.', 5, 0, strftime('%s', 'now') * 1000),
('les-c-safety', 'mod-c-intro', 'Load Safety', 'Safe loading and weight distribution', 2, 'text', NULL, 'Proper load distribution is critical for vehicle stability and safety. Never overload your vehicle.', 10, 0, strftime('%s', 'now') * 1000);

-- Insert free lessons for D Passenger module
INSERT INTO lessons (id, module_id, title, description, order_index, content_type, content_url, content_text, duration, requires_subscription, created_at) VALUES
('les-d-welcome', 'mod-d-intro', 'Passenger Transport Overview', 'Introduction to passenger vehicle operation', 1, 'text', NULL, 'Passenger transport requires responsibility and care. Your passengers trust you with their safety.', 5, 0, strftime('%s', 'now') * 1000),
('les-d-safety', 'mod-d-intro', 'Passenger Safety', 'Ensuring passenger safety and comfort', 2, 'text', NULL, 'Always ensure all passengers are seated and wearing seatbelts before moving. Drive smoothly and courteously.', 10, 0, strftime('%s', 'now') * 1000);

-- Insert free sample questions (10 per category)
-- B1 Category Questions
INSERT INTO questions (id, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation, category, license_category, difficulty, image_url, created_at) VALUES
('q-b1-001', 'What is the maximum speed limit in urban areas in Kenya?', '30 km/h', '50 km/h', '60 km/h', '80 km/h', 'B', 'The speed limit in urban areas is 50 km/h unless otherwise indicated.', 'TRAFFIC_RULES', 'B1', 'EASY', NULL, strftime('%s', 'now') * 1000),
('q-b1-002', 'What does a red traffic light mean?', 'Slow down', 'Stop', 'Proceed with caution', 'Give way', 'B', 'A red traffic light means you must stop completely.', 'TRAFFIC_SIGNALS', 'B1', 'EASY', NULL, strftime('%s', 'now') * 1000),
('q-b1-003', 'When should you use your indicators?', 'Only when turning', 'Before changing lanes or turning', 'Only at night', 'Never', 'B', 'Always use indicators before changing lanes or turning to alert other road users.', 'VEHICLE_CONTROLS', 'B1', 'EASY', NULL, strftime('%s', 'now') * 1000),
('q-b1-004', 'What is the legal blood alcohol limit for drivers in Kenya?', '0.00%', '0.05%', '0.08%', '0.10%', 'A', 'Kenya has a zero-tolerance policy for drinking and driving.', 'TRAFFIC_RULES', 'B1', 'MEDIUM', NULL, strftime('%s', 'now') * 1000),
('q-b1-005', 'What should you do at a STOP sign?', 'Slow down', 'Stop completely', 'Honk and proceed', 'Stop only if traffic is coming', 'B', 'You must come to a complete stop at a STOP sign.', 'TRAFFIC_SIGNS', 'B1', 'EASY', NULL, strftime('%s', 'now') * 1000),
('q-b1-006', 'What does a yellow traffic light mean?', 'Speed up', 'Stop if safe to do so', 'Proceed', 'Reverse', 'B', 'Yellow light means stop if it is safe to do so, otherwise proceed with caution.', 'TRAFFIC_SIGNALS', 'B1', 'MEDIUM', NULL, strftime('%s', 'now') * 1000),
('q-b1-007', 'When must you wear a seatbelt?', 'Only on highways', 'Only in front seats', 'At all times', 'Only at night', 'C', 'Seatbelts must be worn at all times by all occupants.', 'SAFETY', 'B1', 'EASY', NULL, strftime('%s', 'now') * 1000),
('q-b1-008', 'What is the minimum following distance in good conditions?', '1 second', '2 seconds', '3 seconds', '5 seconds', 'C', 'Maintain at least a 3-second following distance in good conditions.', 'DEFENSIVE_DRIVING', 'B1', 'MEDIUM', NULL, strftime('%s', 'now') * 1000),
('q-b1-009', 'What should you do when an emergency vehicle approaches with sirens?', 'Speed up', 'Pull over and stop', 'Continue driving', 'Honk back', 'B', 'Pull over to the side and stop to allow emergency vehicles to pass.', 'TRAFFIC_RULES', 'B1', 'EASY', NULL, strftime('%s', 'now') * 1000),
('q-b1-010', 'What does a triangular road sign indicate?', 'Information', 'Warning', 'Prohibition', 'Direction', 'B', 'Triangular signs are warning signs that alert you to potential hazards.', 'TRAFFIC_SIGNS', 'B1', 'EASY', NULL, strftime('%s', 'now') * 1000);

-- A1 Category Questions
INSERT INTO questions (id, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation, category, license_category, difficulty, image_url, created_at) VALUES
('q-a1-001', 'What protective gear is mandatory for motorcycle riders?', 'Helmet only', 'Helmet and gloves', 'Helmet, gloves, and jacket', 'Full protective gear', 'A', 'At minimum, a helmet is mandatory for all motorcycle riders in Kenya.', 'SAFETY', 'A1', 'EASY', NULL, strftime('%s', 'now') * 1000),
('q-a1-002', 'What is the maximum speed for motorcycles in urban areas?', '30 km/h', '50 km/h', '60 km/h', '80 km/h', 'B', 'Motorcycles follow the same 50 km/h speed limit in urban areas.', 'TRAFFIC_RULES', 'A1', 'EASY', NULL, strftime('%s', 'now') * 1000),
('q-a1-003', 'When should you check your mirrors on a motorcycle?', 'Before turning only', 'Frequently', 'Only when changing lanes', 'Never', 'B', 'Check mirrors frequently to maintain awareness of your surroundings.', 'DEFENSIVE_DRIVING', 'A1', 'EASY', NULL, strftime('%s', 'now') * 1000),
('q-a1-004', 'What is lane splitting?', 'Riding between lanes', 'Changing lanes', 'Splitting the road', 'Riding on the shoulder', 'A', 'Lane splitting is riding between lanes of traffic, which should be done cautiously.', 'RIDING_TECHNIQUES', 'A1', 'MEDIUM', NULL, strftime('%s', 'now') * 1000),
('q-a1-005', 'How should you brake on a motorcycle?', 'Front brake only', 'Rear brake only', 'Both brakes together', 'Engine braking only', 'C', 'Use both front and rear brakes together for effective stopping.', 'VEHICLE_CONTROLS', 'A1', 'MEDIUM', NULL, strftime('%s', 'now') * 1000);

-- C Category Questions
INSERT INTO questions (id, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation, category, license_category, difficulty, image_url, created_at) VALUES
('q-c-001', 'What is the maximum speed for goods vehicles on highways?', '80 km/h', '100 km/h', '110 km/h', '120 km/h', 'A', 'Goods vehicles are limited to 80 km/h on highways.', 'TRAFFIC_RULES', 'C', 'EASY', NULL, strftime('%s', 'now') * 1000),
('q-c-002', 'How often should you check your load during a journey?', 'Never', 'At the start only', 'Regularly during stops', 'Only at destination', 'C', 'Check your load regularly during rest stops to ensure it remains secure.', 'LOAD_SAFETY', 'C', 'MEDIUM', NULL, strftime('%s', 'now') * 1000),
('q-c-003', 'What documents must you carry when driving a commercial vehicle?', 'License only', 'License and insurance', 'License, insurance, and logbook', 'All vehicle documents', 'D', 'Carry all required documents including license, insurance, logbook, and permits.', 'REGULATIONS', 'C', 'MEDIUM', NULL, strftime('%s', 'now') * 1000);

-- D Category Questions
INSERT INTO questions (id, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation, category, license_category, difficulty, image_url, created_at) VALUES
('q-d-001', 'What is the maximum speed for passenger vehicles?', '80 km/h', '100 km/h', '110 km/h', '120 km/h', 'A', 'Passenger vehicles are limited to 80 km/h for safety.', 'TRAFFIC_RULES', 'D', 'EASY', NULL, strftime('%s', 'now') * 1000),
('q-d-002', 'How many passengers can you carry?', 'As many as fit', 'According to vehicle capacity', 'Unlimited', 'Driver decides', 'B', 'Only carry passengers according to the vehicle''s licensed capacity.', 'REGULATIONS', 'D', 'EASY', NULL, strftime('%s', 'now') * 1000),
('q-d-003', 'What should you do before starting a journey with passengers?', 'Just drive', 'Check mirrors', 'Safety briefing and checks', 'Collect fares', 'C', 'Conduct safety checks and brief passengers on safety procedures.', 'SAFETY', 'D', 'MEDIUM', NULL, strftime('%s', 'now') * 1000);

-- Insert sample schools (free to view)
INSERT INTO schools (id, name, registration_number, phone_number, email, address, county, town, is_verified, commission_rate, created_at, updated_at) VALUES
('sch-001', 'AA Kenya Driving School', 'DS-001-2020', '254712345678', 'info@aakenya.co.ke', 'Westlands, Nairobi', 'Nairobi', 'Nairobi', 1, 0.15, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
('sch-002', 'Advance Driving School', 'DS-002-2019', '254723456789', 'info@advanceds.co.ke', 'CBD, Nairobi', 'Nairobi', 'Nairobi', 1, 0.15, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
('sch-003', 'Mombasa Driving Academy', 'DS-003-2021', '254734567890', 'info@mombasads.co.ke', 'Nyali, Mombasa', 'Mombasa', 'Mombasa', 1, 0.15, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
('sch-004', 'Kisumu Motor School', 'DS-004-2020', '254745678901', 'info@kisumums.co.ke', 'Town, Kisumu', 'Kisumu', 'Kisumu', 1, 0.15, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
('sch-005', 'Nakuru Driving Institute', 'DS-005-2018', '254756789012', 'info@nakurudi.co.ke', 'Town, Nakuru', 'Nakuru', 'Nakuru', 1, 0.15, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000);

-- Insert school license categories
INSERT INTO school_license_categories (id, school_id, license_category, is_active, created_at) VALUES
('slc-001', 'sch-001', 'A1', 1, strftime('%s', 'now') * 1000),
('slc-002', 'sch-001', 'B1', 1, strftime('%s', 'now') * 1000),
('slc-003', 'sch-001', 'C', 1, strftime('%s', 'now') * 1000),
('slc-004', 'sch-001', 'D', 1, strftime('%s', 'now') * 1000),
('slc-005', 'sch-002', 'B1', 1, strftime('%s', 'now') * 1000),
('slc-006', 'sch-002', 'C', 1, strftime('%s', 'now') * 1000),
('slc-007', 'sch-003', 'A1', 1, strftime('%s', 'now') * 1000),
('slc-008', 'sch-003', 'B1', 1, strftime('%s', 'now') * 1000),
('slc-009', 'sch-003', 'D', 1, strftime('%s', 'now') * 1000),
('slc-010', 'sch-004', 'B1', 1, strftime('%s', 'now') * 1000),
('slc-011', 'sch-004', 'C', 1, strftime('%s', 'now') * 1000),
('slc-012', 'sch-005', 'A1', 1, strftime('%s', 'now') * 1000),
('slc-013', 'sch-005', 'B1', 1, strftime('%s', 'now') * 1000),
('slc-014', 'sch-005', 'C', 1, strftime('%s', 'now') * 1000),
('slc-015', 'sch-005', 'D', 1, strftime('%s', 'now') * 1000);
