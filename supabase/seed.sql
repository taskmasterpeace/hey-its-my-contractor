-- Sample data for development and testing
-- Run this after the schema.sql

-- Insert sample tenants
INSERT INTO tenants (id, name, plan, settings) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Johnson Contracting LLC', 'pro', '{"timezone": "America/New_York", "retention_days": 90, "recording_consent_required": true, "weather_integration": true}'),
('550e8400-e29b-41d4-a716-446655440002', 'Miller Construction Co', 'basic', '{"timezone": "America/New_York", "retention_days": 30, "recording_consent_required": false, "weather_integration": false}');

-- Insert sample users
INSERT INTO users (id, tenant_id, role, profile, auth_id) VALUES
-- Johnson Contracting users
('650e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'contractor', '{"first_name": "Mike", "last_name": "Johnson", "email": "mike@johnsoncontracting.com", "phone": "555-0101", "company": "Johnson Contracting LLC", "license_number": "VA-12345"}', NULL),
('650e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', 'staff', '{"first_name": "Sarah", "last_name": "Davis", "email": "sarah@johnsoncontracting.com", "phone": "555-0102", "company": "Johnson Contracting LLC"}', NULL),
('650e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440001', 'homeowner', '{"first_name": "John", "last_name": "Smith", "email": "john.smith@email.com", "phone": "555-0201"}', NULL),
('650e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440001', 'homeowner', '{"first_name": "Emily", "last_name": "Wilson", "email": "emily.wilson@email.com", "phone": "555-0202"}', NULL),
('650e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440001', 'sub', '{"first_name": "Tom", "last_name": "Rodriguez", "email": "tom@electricpro.com", "phone": "555-0301", "company": "Electric Pro LLC", "license_number": "EL-67890"}', NULL),

-- Miller Construction users
('650e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440002', 'contractor', '{"first_name": "Bob", "last_name": "Miller", "email": "bob@millerconstruction.com", "phone": "555-0103", "company": "Miller Construction Co", "license_number": "VA-54321"}', NULL);

-- Insert sample projects
INSERT INTO projects (id, tenant_id, name, address, status, client_user_id, budget, start_date, end_date, progress_percentage) VALUES
('750e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'Smith Kitchen Remodel', '123 Main Street, Richmond, VA 23220', 'active', '650e8400-e29b-41d4-a716-446655440003', 45000.00, '2025-01-15', '2025-03-15', 65),
('750e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', 'Wilson Bathroom Renovation', '456 Oak Avenue, Midlothian, VA 23113', 'active', '650e8400-e29b-41d4-a716-446655440004', 25000.00, '2025-02-01', '2025-04-01', 30),
('750e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440001', 'Davis Deck Construction', '789 Pine Road, Glen Allen, VA 23060', 'planning', '650e8400-e29b-41d4-a716-446655440004', 18000.00, '2025-04-15', '2025-05-20', 10);

-- Insert sample meetings
INSERT INTO meetings (id, project_id, title, starts_at, ends_at, type, participants, consent_given, status) VALUES
('850e8400-e29b-41d4-a716-446655440001', '750e8400-e29b-41d4-a716-446655440001', 'Initial Kitchen Consultation', '2025-01-10 09:00:00-05:00', '2025-01-10 10:30:00-05:00', 'consultation', '{"650e8400-e29b-41d4-a716-446655440001", "650e8400-e29b-41d4-a716-446655440003"}', true, 'completed'),
('850e8400-e29b-41d4-a716-446655440002', '750e8400-e29b-41d4-a716-446655440001', 'Progress Review - Week 4', '2025-02-12 14:00:00-05:00', '2025-02-12 15:00:00-05:00', 'progress_review', '{"650e8400-e29b-41d4-a716-446655440001", "650e8400-e29b-41d4-a716-446655440002", "650e8400-e29b-41d4-a716-446655440003"}', true, 'completed'),
('850e8400-e29b-41d4-a716-446655440003', '750e8400-e29b-41d4-a716-446655440001', 'Change Order Discussion', '2025-02-20 10:00:00-05:00', NULL, 'change_order', '{"650e8400-e29b-41d4-a716-446655440001", "650e8400-e29b-41d4-a716-446655440003"}', true, 'scheduled');

-- Insert sample transcripts
INSERT INTO transcripts (id, meeting_id, provider, text, segments, summary, action_items) VALUES
('950e8400-e29b-41d4-a716-446655440001', '850e8400-e29b-41d4-a716-446655440001', 'assemblyai', 
'Mike: Good morning John, thanks for meeting with me today. John: Good morning Mike, I''m excited to discuss the kitchen remodel project. Mike: Great! Let''s start by going over your vision for the space...', 
'[{"start_time": 0, "end_time": 5, "speaker": "Mike", "text": "Good morning John, thanks for meeting with me today."}, {"start_time": 5, "end_time": 10, "speaker": "John", "text": "Good morning Mike, I''m excited to discuss the kitchen remodel project."}, {"start_time": 10, "end_time": 20, "speaker": "Mike", "text": "Great! Let''s start by going over your vision for the space..."}]',
'Initial consultation for kitchen remodel. Discussed project scope, timeline, and budget. Client confirmed budget of $45,000 and 6-week timeline.',
'{"Send detailed timeline by Friday", "Order materials by January 20th", "Schedule permit inspection", "Provide material samples"}');

-- Insert sample tasks
INSERT INTO tasks (id, project_id, title, description, due_date, assignees, source_meeting_id, ack_contractor, ack_client, status, priority) VALUES
('a50e8400-e29b-41d4-a716-446655440001', '750e8400-e29b-41d4-a716-446655440001', 'Order kitchen cabinets', 'Order custom cabinets from supplier based on approved design', '2025-02-25 17:00:00-05:00', '{"650e8400-e29b-41d4-a716-446655440001"}', '850e8400-e29b-41d4-a716-446655440002', true, true, 'completed', 'high'),
('a50e8400-e29b-41d4-a716-446655440002', '750e8400-e29b-41d4-a716-446655440001', 'Schedule electrical inspection', 'Coordinate with city inspector for electrical rough-in', '2025-02-28 12:00:00-05:00', '{"650e8400-e29b-41d4-a716-446655440005"}', '850e8400-e29b-41d4-a716-446655440002', true, false, 'in_progress', 'medium'),
('a50e8400-e29b-41d4-a716-446655440003', '750e8400-e29b-41d4-a716-446655440001', 'Install backsplash tile', 'Install subway tile backsplash per design specifications', '2025-03-05 17:00:00-05:00', '{"650e8400-e29b-41d4-a716-446655440001"}', NULL, false, false, 'pending', 'medium');

-- Insert sample daily logs
INSERT INTO daily_logs (id, project_id, user_id, date, notes, weather_data, location) VALUES
('b50e8400-e29b-41d4-a716-446655440001', '750e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440001', '2025-02-18', 'Completed drywall installation in kitchen. All electrical rough-in passed inspection. Ready for cabinet installation next week.', 
'{"temperature": 45, "humidity": 60, "conditions": "Clear", "wind_speed": 8, "timestamp": "2025-02-18T15:00:00Z"}',
'{"latitude": 37.5407, "longitude": -77.4360, "accuracy": 5}');

-- Insert sample documents
INSERT INTO documents (id, project_id, name, type, storage_key, file_size, mime_type, created_by) VALUES
('c50e8400-e29b-41d4-a716-446655440001', '750e8400-e29b-41d4-a716-446655440001', 'Kitchen Plans v3.pdf', 'plan', 'projects/kitchen-plans-v3.pdf', 2457600, 'application/pdf', '650e8400-e29b-41d4-a716-446655440001'),
('c50e8400-e29b-41d4-a716-446655440002', '750e8400-e29b-41d4-a716-446655440001', 'Electrical Permit', 'permit', 'permits/electrical-permit-2025.pdf', 890000, 'application/pdf', '650e8400-e29b-41d4-a716-446655440002'),
('c50e8400-e29b-41d4-a716-446655440003', '750e8400-e29b-41d4-a716-446655440001', 'Progress Photo - Drywall Complete', 'photo', 'photos/drywall-complete-20250218.jpg', 1800000, 'image/jpeg', '650e8400-e29b-41d4-a716-446655440001');

-- Insert sample change orders
INSERT INTO change_orders (id, project_id, title, description, amount, status, approved_by_contractor) VALUES
('d50e8400-e29b-41d4-a716-446655440001', '750e8400-e29b-41d4-a716-446655440001', 'Add Under-Cabinet Lighting', 'Client requested LED under-cabinet lighting strips throughout kitchen', 850.00, 'pending', '650e8400-e29b-41d4-a716-446655440001');

-- Insert sample chat channels
INSERT INTO chat_channels (id, project_id, name, type, participants) VALUES
('e50e8400-e29b-41d4-a716-446655440001', '750e8400-e29b-41d4-a716-446655440001', 'Smith Kitchen Project', 'project', '{"650e8400-e29b-41d4-a716-446655440001", "650e8400-e29b-41d4-a716-446655440002", "650e8400-e29b-41d4-a716-446655440003"}'),
('e50e8400-e29b-41d4-a716-446655440002', '750e8400-e29b-41d4-a716-446655440001', 'Electrical Team', 'team', '{"650e8400-e29b-41d4-a716-446655440001", "650e8400-e29b-41d4-a716-446655440005"}');

-- Insert sample chat messages
INSERT INTO chat_messages (id, channel_id, user_id, content, type) VALUES
('f50e8400-e29b-41d4-a716-446655440001', 'e50e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440001', 'Good morning! Drywall is complete and looking great. Photos uploaded to the project folder.', 'text'),
('f50e8400-e29b-41d4-a716-446655440002', 'e50e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440003', 'Excellent! When do you expect the cabinets to arrive?', 'text'),
('f50e8400-e29b-41d4-a716-446655440003', 'e50e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440001', 'They should be delivered Monday morning. Installation will start Tuesday.', 'text');

-- Insert sample notifications
INSERT INTO notifications (id, user_id, type, title, message, data) VALUES
('1150e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440003', 'message_received', 'New message from Mike', 'Drywall is complete and looking great. Photos uploaded to the project folder.', '{"channel_id": "e50e8400-e29b-41d4-a716-446655440001", "message_id": "f50e8400-e29b-41d4-a716-446655440001"}'),
('1150e8400-e29b-41d4-a716-446655440002', '650e8400-e29b-41d4-a716-446655440005', 'task_due', 'Task due soon', 'Schedule electrical inspection is due in 2 days', '{"task_id": "a50e8400-e29b-41d4-a716-446655440002"}'),
('1150e8400-e29b-41d4-a716-446655440003', '650e8400-e29b-41d4-a716-446655440003', 'change_order_approval', 'Change order needs approval', 'Under-cabinet lighting change order awaiting your approval', '{"change_order_id": "d50e8400-e29b-41d4-a716-446655440001"}');