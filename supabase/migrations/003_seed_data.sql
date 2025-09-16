-- Seed initial data for the DRDO Interview System

-- Insert additional organizations
INSERT INTO organizations (name, code, description, hierarchy_level, contact_info, is_active) VALUES
('Defence Research and Development Laboratory', 'DRDL', 'Missile and strategic systems development', 1, '{"email": "contact@drdl.drdo.in", "phone": "+91-40-24581234"}', true),
('Aeronautical Development Establishment', 'ADE', 'Aeronautical systems and UAV development', 1, '{"email": "contact@ade.drdo.in", "phone": "+91-80-25086001"}', true),
('Centre for Artificial Intelligence & Robotics', 'CAIR', 'AI, robotics and cybersecurity research', 1, '{"email": "contact@cair.drdo.in", "phone": "+91-80-25205001"}', true),
('Electronics and Radar Development Establishment', 'LRDE', 'Radar and electronic warfare systems', 1, '{"email": "contact@lrde.drdo.in", "phone": "+91-80-25086001"}', true),
('Terminal Ballistics Research Laboratory', 'TBRL', 'Ammunition and explosive systems', 1, '{"email": "contact@tbrl.drdo.in", "phone": "+91-1332-273801"}', true)
ON CONFLICT (code) DO NOTHING;

-- Insert job positions for different DRDO labs
INSERT INTO job_positions (title, code, organization_id, description, requirements, qualifications, skills_required, experience_required, security_clearance_required, salary_range, is_active) VALUES
-- DRDL Positions
('Senior Scientist - Missile Systems', 'DRDL-SS-MS-001', 
 (SELECT id FROM organizations WHERE code = 'DRDL'), 
 'Lead missile guidance and control systems development',
 '{"education": "PhD in Aerospace/Mechanical Engineering", "experience": "8+ years in missile systems"}',
 '{"degree": "PhD", "specialization": "Aerospace Engineering"}',
 '{"technical": ["MATLAB/Simulink", "Control Systems", "Guidance Systems"], "soft": ["Leadership", "Project Management"]}',
 8, 'secret',
 '{"min": 1200000, "max": 1800000, "currency": "INR"}',
 true),

('Scientist B - Propulsion', 'DRDL-SB-PROP-001',
 (SELECT id FROM organizations WHERE code = 'DRDL'),
 'Research and development of rocket propulsion systems',
 '{"education": "M.Tech in Aerospace/Mechanical Engineering", "experience": "2-5 years"}',
 '{"degree": "M.Tech", "specialization": "Propulsion Engineering"}',
 '{"technical": ["CFD", "Thermodynamics", "Combustion"], "soft": ["Analytical Thinking", "Problem Solving"]}',
 3, 'confidential',
 '{"min": 800000, "max": 1200000, "currency": "INR"}',
 true),

-- CAIR Positions
('Principal Scientist - AI/ML', 'CAIR-PS-AI-001',
 (SELECT id FROM organizations WHERE code = 'CAIR'),
 'Lead AI/ML research for defense applications',
 '{"education": "PhD in Computer Science/AI", "experience": "10+ years in AI/ML"}',
 '{"degree": "PhD", "specialization": "Artificial Intelligence"}',
 '{"technical": ["Python", "TensorFlow", "PyTorch", "Computer Vision", "NLP"], "soft": ["Research", "Innovation"]}',
 10, 'secret',
 '{"min": 1500000, "max": 2200000, "currency": "INR"}',
 true),

('Scientist C - Cybersecurity', 'CAIR-SC-CYBER-001',
 (SELECT id FROM organizations WHERE code = 'CAIR'),
 'Develop cybersecurity solutions for defense systems',
 '{"education": "M.Tech in Computer Science/Cybersecurity", "experience": "5-8 years"}',
 '{"degree": "M.Tech", "specialization": "Cybersecurity"}',
 '{"technical": ["Network Security", "Cryptography", "Penetration Testing", "SIEM"], "soft": ["Attention to Detail", "Critical Thinking"]}',
 6, 'secret',
 '{"min": 1000000, "max": 1500000, "currency": "INR"}',
 true),

-- ADE Positions
('Senior Scientist - UAV Systems', 'ADE-SS-UAV-001',
 (SELECT id FROM organizations WHERE code = 'ADE'),
 'Design and development of unmanned aerial vehicles',
 '{"education": "PhD in Aerospace Engineering", "experience": "8+ years in UAV systems"}',
 '{"degree": "PhD", "specialization": "Aerospace Engineering"}',
 '{"technical": ["Flight Dynamics", "Autopilot Systems", "Aerodynamics", "CATIA"], "soft": ["Innovation", "Team Leadership"]}',
 8, 'confidential',
 '{"min": 1200000, "max": 1800000, "currency": "INR"}',
 true),

-- LRDE Positions
('Scientist D - Radar Systems', 'LRDE-SD-RADAR-001',
 (SELECT id FROM organizations WHERE code = 'LRDE'),
 'Advanced radar signal processing and algorithm development',
 '{"education": "M.Tech in Electronics/Signal Processing", "experience": "3-6 years"}',
 '{"degree": "M.Tech", "specialization": "Signal Processing"}',
 '{"technical": ["DSP", "MATLAB", "Radar Systems", "FPGA"], "soft": ["Problem Solving", "Analytical Skills"]}',
 4, 'confidential',
 '{"min": 900000, "max": 1300000, "currency": "INR"}',
 true)
ON CONFLICT (code) DO NOTHING;

-- Update system settings with more comprehensive configuration
INSERT INTO system_settings (key, value, description, category, is_public) VALUES
('interview_duration_default', '60', 'Default interview duration in minutes', 'interview', true),
('max_participants_per_interview', '8', 'Maximum number of participants allowed in an interview', 'interview', true),
('recording_enabled_default', 'true', 'Whether interview recording is enabled by default', 'interview', false),
('ai_evaluation_enabled', 'true', 'Enable AI-powered evaluation of interviews', 'ai', false),
('bias_detection_threshold', '0.7', 'Threshold for bias detection alerts (0-1)', 'ai', false),
('emotion_analysis_enabled', 'true', 'Enable real-time emotion analysis during interviews', 'ai', false),
('max_file_upload_size', '10485760', 'Maximum file upload size in bytes (10MB)', 'system', false),
('session_timeout_minutes', '480', 'User session timeout in minutes (8 hours)', 'security', false),
('password_min_length', '8', 'Minimum password length requirement', 'security', true),
('mfa_required_for_admin', 'true', 'Require MFA for administrator accounts', 'security', false),
('notification_retention_days', '30', 'Number of days to retain notifications', 'system', false),
('audit_log_retention_days', '365', 'Number of days to retain audit logs', 'system', false),
('analytics_data_retention_days', '90', 'Number of days to retain analytics data', 'analytics', false),
('webrtc_stun_servers', '["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"]', 'STUN servers for WebRTC connections', 'webrtc', true),
('supported_video_formats', '["mp4", "webm", "avi"]', 'Supported video formats for uploads', 'media', true),
('supported_audio_formats', '["mp3", "wav", "ogg"]', 'Supported audio formats for uploads', 'media', true),
('interview_reminder_hours', '24', 'Hours before interview to send reminder notifications', 'notification', true),
('system_maintenance_mode', 'false', 'Enable system maintenance mode', 'system', false),
('api_rate_limit_per_minute', '100', 'API rate limit per minute per user', 'api', false),
('backup_retention_days', '30', 'Number of days to retain database backups', 'backup', false)
ON CONFLICT (key) DO UPDATE SET 
  value = EXCLUDED.value,
  description = EXCLUDED.description,
  updated_at = now();

-- Create some sample interview templates (only if admin user exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM users WHERE email = 'admin@drdo.gov.in') THEN
    INSERT INTO interviews (title, description, job_position_id, status, scheduled_time, duration_minutes, evaluation_criteria, question_categories, settings, created_by) VALUES
    ('Technical Interview - AI/ML Scientist', 
     'Comprehensive technical assessment for AI/ML scientist position',
     (SELECT id FROM job_positions WHERE code = 'CAIR-PS-AI-001'),
     'scheduled',
     now() + interval '7 days',
     90,
     '{"technical_knowledge": 0.4, "problem_solving": 0.3, "communication": 0.2, "innovation": 0.1}',
     ARRAY['technical'::question_category, 'situational'::question_category],
     '{"recording_enabled": true, "ai_evaluation": true, "bias_detection": true}',
     (SELECT id FROM users WHERE email = 'admin@drdo.gov.in' LIMIT 1)),

    ('Behavioral Interview - Cybersecurity Specialist',
     'Behavioral assessment focusing on security mindset and ethics',
     (SELECT id FROM job_positions WHERE code = 'CAIR-SC-CYBER-001'),
     'scheduled', 
     now() + interval '5 days',
     60,
     '{"behavioral_traits": 0.5, "ethical_reasoning": 0.3, "communication": 0.2}',
     ARRAY['behavioral'::question_category, 'situational'::question_category],
     '{"recording_enabled": true, "emotion_analysis": true}',
     (SELECT id FROM users WHERE email = 'admin@drdo.gov.in' LIMIT 1));
  END IF;
END $$;

-- Create notification templates
INSERT INTO notifications (user_id, title, message, type, priority, action_url, metadata) 
SELECT 
  u.id,
  'Welcome to DRDO Interview System',
  'Your account has been successfully created. Please complete your profile and verify your email address.',
  'info',
  1,
  '/dashboard/profile',
  '{"category": "welcome", "auto_generated": true}'
FROM users u 
WHERE u.email = 'admin@drdo.gov.in'
AND NOT EXISTS (SELECT 1 FROM notifications WHERE user_id = u.id AND title = 'Welcome to DRDO Interview System');

-- Insert sample analytics metrics
INSERT INTO analytics_metrics (metric_name, metric_value, dimensions, organization_id) VALUES
('total_interviews_conducted', 0, '{"period": "all_time"}', (SELECT id FROM organizations WHERE code = 'DRDO')),
('average_interview_duration', 65.5, '{"period": "last_30_days", "unit": "minutes"}', (SELECT id FROM organizations WHERE code = 'DRDO')),
('candidate_satisfaction_score', 4.2, '{"period": "last_30_days", "scale": "1-5"}', (SELECT id FROM organizations WHERE code = 'DRDO')),
('system_uptime_percentage', 99.8, '{"period": "last_30_days", "unit": "percentage"}', (SELECT id FROM organizations WHERE code = 'DRDO')),
('ai_evaluation_accuracy', 87.3, '{"period": "last_30_days", "unit": "percentage"}', (SELECT id FROM organizations WHERE code = 'DRDO'));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_interviews_scheduled_time ON interviews(scheduled_time);
CREATE INDEX IF NOT EXISTS idx_interviews_status ON interviews(status);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_analytics_metrics_name_timestamp ON analytics_metrics(metric_name, timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);

-- Update the default organization with more details
UPDATE organizations 
SET 
  description = 'Defence Research and Development Organisation - Premier defense research institution of India',
  contact_info = '{"email": "info@drdo.gov.in", "phone": "+91-11-23006538", "website": "https://www.drdo.gov.in"}',
  settings = '{"interview_approval_required": true, "security_clearance_verification": true, "background_check_mandatory": true}'
WHERE code = 'DRDO';

COMMIT;