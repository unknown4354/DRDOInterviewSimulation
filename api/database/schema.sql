-- DRDO AI-Powered Interview & Assessment System Database Schema
-- PostgreSQL schema with comprehensive tables for enterprise functionality

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom types
CREATE TYPE user_role AS ENUM ('administrator', 'selector', 'candidate', 'observer');
CREATE TYPE security_level AS ENUM ('public', 'restricted', 'confidential', 'secret');
CREATE TYPE interview_status AS ENUM ('scheduled', 'in_progress', 'completed', 'cancelled', 'technical_issues', 'postponed');
CREATE TYPE participant_role AS ENUM ('interviewer', 'candidate', 'observer', 'technical_support');
CREATE TYPE interview_type AS ENUM ('technical', 'behavioral', 'panel', 'one_on_one', 'group', 'assessment');
CREATE TYPE connection_status AS ENUM ('connecting', 'connected', 'disconnected', 'reconnecting', 'failed');
CREATE TYPE mfa_method AS ENUM ('sms', 'email', 'totp', 'biometric');
CREATE TYPE bias_type AS ENUM ('gender', 'age', 'ethnicity', 'educational_background', 'socioeconomic', 'linguistic', 'cultural', 'appearance', 'disability', 'unconscious');
CREATE TYPE emotion AS ENUM ('happy', 'sad', 'angry', 'fearful', 'surprised', 'disgusted', 'neutral', 'confident', 'nervous', 'excited', 'confused', 'focused');
CREATE TYPE threat_level AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE security_event_type AS ENUM ('login_success', 'login_failure', 'logout', 'password_change', 'mfa_setup', 'mfa_verification', 'permission_change', 'data_access', 'data_modification', 'data_deletion', 'suspicious_activity', 'security_violation', 'system_breach', 'compliance_violation');

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role user_role NOT NULL,
    department VARCHAR(100),
    expertise TEXT[],
    security_clearance security_level NOT NULL,
    is_active BOOLEAN DEFAULT true,
    mfa_enabled BOOLEAN DEFAULT false,
    mfa_methods mfa_method[],
    mfa_secret VARCHAR(255),
    phone_number VARCHAR(20),
    profile_picture VARCHAR(500),
    preferences JSONB DEFAULT '{}',
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User sessions table
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_id VARCHAR(255) UNIQUE NOT NULL,
    device_id VARCHAR(255) NOT NULL,
    device_info JSONB,
    ip_address INET,
    user_agent TEXT,
    location JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Departments table
CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    parent_department UUID REFERENCES departments(id),
    head_user_id UUID REFERENCES users(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Expertise areas table
CREATE TABLE expertise_areas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    description TEXT,
    level VARCHAR(50) CHECK (level IN ('beginner', 'intermediate', 'advanced', 'expert')),
    prerequisites TEXT[],
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Interviews table
CREATE TABLE interviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    type interview_type NOT NULL,
    status interview_status NOT NULL DEFAULT 'scheduled',
    scheduled_time TIMESTAMP WITH TIME ZONE NOT NULL,
    actual_start_time TIMESTAMP WITH TIME ZONE,
    actual_end_time TIMESTAMP WITH TIME ZONE,
    duration INTEGER NOT NULL, -- in minutes
    evaluation_criteria JSONB NOT NULL,
    question_categories TEXT[],
    settings JSONB NOT NULL,
    results JSONB,
    room_id VARCHAR(255) UNIQUE,
    recording_enabled BOOLEAN DEFAULT false,
    recording_url VARCHAR(500),
    metadata JSONB DEFAULT '{}',
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Interview participants table
CREATE TABLE interview_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    interview_id UUID REFERENCES interviews(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    role participant_role NOT NULL,
    permissions JSONB DEFAULT '{}',
    joined_at TIMESTAMP WITH TIME ZONE,
    left_at TIMESTAMP WITH TIME ZONE,
    connection_quality JSONB,
    device_info JSONB,
    status VARCHAR(50) DEFAULT 'invited',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Question evaluations table
CREATE TABLE question_evaluations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    interview_id UUID REFERENCES interviews(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    relevance_score DECIMAL(3,2) CHECK (relevance_score >= 0 AND relevance_score <= 1),
    difficulty_score DECIMAL(3,2) CHECK (difficulty_score >= 0 AND difficulty_score <= 1),
    clarity_score DECIMAL(3,2) CHECK (clarity_score >= 0 AND clarity_score <= 1),
    bias_score DECIMAL(3,2) CHECK (bias_score >= 0 AND bias_score <= 1),
    overall_score DECIMAL(3,2) CHECK (overall_score >= 0 AND overall_score <= 1),
    feedback TEXT,
    suggestions TEXT[],
    model_version VARCHAR(50),
    confidence DECIMAL(3,2),
    processing_time INTEGER, -- milliseconds
    evaluated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Answer evaluations table
CREATE TABLE answer_evaluations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    interview_id UUID REFERENCES interviews(id) ON DELETE CASCADE,
    question_id UUID REFERENCES question_evaluations(id),
    answer_text TEXT NOT NULL,
    semantic_relevance DECIMAL(3,2) CHECK (semantic_relevance >= 0 AND semantic_relevance <= 1),
    technical_accuracy DECIMAL(3,2) CHECK (technical_accuracy >= 0 AND technical_accuracy <= 1),
    communication_quality DECIMAL(3,2) CHECK (communication_quality >= 0 AND communication_quality <= 1),
    depth_of_understanding DECIMAL(3,2) CHECK (depth_of_understanding >= 0 AND depth_of_understanding <= 1),
    overall_score DECIMAL(3,2) CHECK (overall_score >= 0 AND overall_score <= 1),
    strengths TEXT[],
    improvement_areas TEXT[],
    factual_errors JSONB,
    model_version VARCHAR(50),
    confidence DECIMAL(3,2),
    processing_time INTEGER,
    evaluated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Emotion analysis table
CREATE TABLE emotion_analysis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    interview_id UUID REFERENCES interviews(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    confidence DECIMAL(3,2) CHECK (confidence >= 0 AND confidence <= 1),
    stress_level DECIMAL(3,2) CHECK (stress_level >= 0 AND stress_level <= 1),
    engagement DECIMAL(3,2) CHECK (engagement >= 0 AND engagement <= 1),
    dominant_emotion emotion,
    facial_expressions JSONB,
    voice_indicators JSONB,
    body_language JSONB,
    analysis_method VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bias reports table
CREATE TABLE bias_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    interview_id UUID REFERENCES interviews(id) ON DELETE CASCADE,
    bias_type bias_type NOT NULL,
    severity_score DECIMAL(3,2) CHECK (severity_score >= 0 AND severity_score <= 1),
    description TEXT,
    affected_demographics JSONB,
    recommendations TEXT[],
    evidence_points JSONB,
    confidence DECIMAL(3,2),
    detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID REFERENCES users(id)
);

-- Translation logs table
CREATE TABLE translation_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    interview_id UUID REFERENCES interviews(id) ON DELETE CASCADE,
    source_language VARCHAR(10),
    target_language VARCHAR(10),
    original_text TEXT,
    translated_text TEXT,
    confidence_score DECIMAL(3,2),
    processing_time INTEGER,
    method VARCHAR(50),
    domain_specific BOOLEAN DEFAULT false,
    translated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chat messages table
CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    interview_id UUID REFERENCES interviews(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES users(id),
    sender_name VARCHAR(255),
    message_type VARCHAR(50) DEFAULT 'text',
    content TEXT NOT NULL,
    metadata JSONB,
    reply_to UUID REFERENCES chat_messages(id),
    edited BOOLEAN DEFAULT false,
    edited_at TIMESTAMP WITH TIME ZONE,
    reactions JSONB DEFAULT '[]',
    read_by JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- File uploads table
CREATE TABLE file_uploads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    interview_id UUID REFERENCES interviews(id) ON DELETE CASCADE,
    uploaded_by UUID REFERENCES users(id),
    file_name VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100),
    file_path VARCHAR(500),
    download_url VARCHAR(500),
    thumbnail_url VARCHAR(500),
    description TEXT,
    tags TEXT[],
    download_count INTEGER DEFAULT 0,
    scan_status VARCHAR(50) DEFAULT 'pending',
    scan_results JSONB,
    expires_at TIMESTAMP WITH TIME ZONE,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Recording sessions table
CREATE TABLE recording_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    interview_id UUID REFERENCES interviews(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    duration INTEGER, -- seconds
    file_size BIGINT,
    format VARCHAR(10),
    quality VARCHAR(20),
    file_url VARCHAR(500),
    download_url VARCHAR(500),
    thumbnail_url VARCHAR(500),
    started_by UUID REFERENCES users(id),
    started_at TIMESTAMP WITH TIME ZONE,
    ended_at TIMESTAMP WITH TIME ZONE,
    participants UUID[],
    status VARCHAR(50) DEFAULT 'recording',
    processing_progress INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Security events table
CREATE TABLE security_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type security_event_type NOT NULL,
    severity threat_level NOT NULL,
    user_id UUID REFERENCES users(id),
    session_id VARCHAR(255),
    ip_address INET,
    user_agent TEXT,
    location JSONB,
    description TEXT NOT NULL,
    details JSONB DEFAULT '{}',
    resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID REFERENCES users(id),
    resolution TEXT,
    false_positive BOOLEAN DEFAULT false,
    related_events UUID[],
    risk_score DECIMAL(3,2),
    impact TEXT[],
    mitigation TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit trail table
CREATE TABLE audit_trail (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(255) NOT NULL,
    resource VARCHAR(255) NOT NULL,
    resource_id VARCHAR(255),
    resource_type VARCHAR(100),
    old_value JSONB,
    new_value JSONB,
    ip_address INET,
    user_agent TEXT,
    session_id VARCHAR(255),
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    metadata JSONB DEFAULT '{}',
    blockchain_hash VARCHAR(255),
    blockchain_tx_id VARCHAR(255),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- System metrics table
CREATE TABLE system_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    metric_name VARCHAR(255) NOT NULL,
    metric_value DECIMAL(10,4),
    metric_unit VARCHAR(50),
    category VARCHAR(100),
    tags JSONB DEFAULT '{}',
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User permissions table
CREATE TABLE user_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    permission VARCHAR(255) NOT NULL,
    resource VARCHAR(255),
    conditions JSONB,
    granted_by UUID REFERENCES users(id),
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true
);

-- Interview templates table
CREATE TABLE interview_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type interview_type NOT NULL,
    duration INTEGER NOT NULL,
    evaluation_criteria JSONB NOT NULL,
    question_categories TEXT[],
    settings JSONB NOT NULL,
    is_public BOOLEAN DEFAULT false,
    created_by UUID REFERENCES users(id),
    usage_count INTEGER DEFAULT 0,
    rating DECIMAL(2,1),
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_department ON users(department);
CREATE INDEX idx_users_security_clearance ON users(security_clearance);
CREATE INDEX idx_users_is_active ON users(is_active);

CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_session_id ON user_sessions(session_id);
CREATE INDEX idx_user_sessions_device_id ON user_sessions(device_id);
CREATE INDEX idx_user_sessions_is_active ON user_sessions(is_active);
CREATE INDEX idx_user_sessions_expires_at ON user_sessions(expires_at);

CREATE INDEX idx_interviews_status ON interviews(status);
CREATE INDEX idx_interviews_type ON interviews(type);
CREATE INDEX idx_interviews_scheduled_time ON interviews(scheduled_time);
CREATE INDEX idx_interviews_created_by ON interviews(created_by);
CREATE INDEX idx_interviews_room_id ON interviews(room_id);

CREATE INDEX idx_interview_participants_interview_id ON interview_participants(interview_id);
CREATE INDEX idx_interview_participants_user_id ON interview_participants(user_id);
CREATE INDEX idx_interview_participants_role ON interview_participants(role);

CREATE INDEX idx_question_evaluations_interview_id ON question_evaluations(interview_id);
CREATE INDEX idx_question_evaluations_overall_score ON question_evaluations(overall_score);
CREATE INDEX idx_question_evaluations_evaluated_at ON question_evaluations(evaluated_at);

CREATE INDEX idx_answer_evaluations_interview_id ON answer_evaluations(interview_id);
CREATE INDEX idx_answer_evaluations_question_id ON answer_evaluations(question_id);
CREATE INDEX idx_answer_evaluations_overall_score ON answer_evaluations(overall_score);

CREATE INDEX idx_emotion_analysis_interview_id ON emotion_analysis(interview_id);
CREATE INDEX idx_emotion_analysis_user_id ON emotion_analysis(user_id);
CREATE INDEX idx_emotion_analysis_timestamp ON emotion_analysis(timestamp);

CREATE INDEX idx_bias_reports_interview_id ON bias_reports(interview_id);
CREATE INDEX idx_bias_reports_bias_type ON bias_reports(bias_type);
CREATE INDEX idx_bias_reports_severity_score ON bias_reports(severity_score);

CREATE INDEX idx_security_events_event_type ON security_events(event_type);
CREATE INDEX idx_security_events_severity ON security_events(severity);
CREATE INDEX idx_security_events_user_id ON security_events(user_id);
CREATE INDEX idx_security_events_created_at ON security_events(created_at);

CREATE INDEX idx_audit_trail_user_id ON audit_trail(user_id);
CREATE INDEX idx_audit_trail_action ON audit_trail(action);
CREATE INDEX idx_audit_trail_resource ON audit_trail(resource);
CREATE INDEX idx_audit_trail_timestamp ON audit_trail(timestamp);

CREATE INDEX idx_chat_messages_interview_id ON chat_messages(interview_id);
CREATE INDEX idx_chat_messages_sender_id ON chat_messages(sender_id);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at);

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON departments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_interviews_updated_at BEFORE UPDATE ON interviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_interview_templates_updated_at BEFORE UPDATE ON interview_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert initial data
INSERT INTO departments (name, code, description) VALUES
('Information Technology', 'IT', 'Information Technology and Systems'),
('Aeronautics', 'AERO', 'Aeronautical Development and Research'),
('Electronics', 'ELEC', 'Electronics and Communication Systems'),
('Materials Science', 'MATS', 'Advanced Materials and Metallurgy'),
('Cybersecurity', 'CYBER', 'Cybersecurity and Information Warfare'),
('Artificial Intelligence', 'AI', 'AI and Machine Learning Research'),
('Human Resources', 'HR', 'Human Resources and Administration');

INSERT INTO expertise_areas (name, category, description, level) VALUES
('System Administration', 'IT', 'Server and network administration', 'advanced'),
('Cybersecurity', 'Security', 'Information security and threat analysis', 'expert'),
('Aerodynamics', 'Aerospace', 'Fluid dynamics and aeronautical engineering', 'expert'),
('Propulsion Systems', 'Aerospace', 'Jet engines and propulsion technology', 'advanced'),
('Machine Learning', 'AI', 'ML algorithms and model development', 'advanced'),
('Natural Language Processing', 'AI', 'Text processing and language understanding', 'intermediate'),
('Materials Engineering', 'Engineering', 'Advanced materials and composites', 'expert'),
('Signal Processing', 'Electronics', 'Digital signal processing and analysis', 'advanced'),
('Network Security', 'Security', 'Network protocols and security', 'advanced'),
('Database Management', 'IT', 'Database design and optimization', 'intermediate');

-- Insert initial admin user (password: 'admin123')
INSERT INTO users (username, email, password_hash, full_name, role, department, expertise, security_clearance, mfa_enabled, mfa_methods, phone_number) VALUES
('admin.drdo', 'admin@drdo.gov.in', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/A5/jF3kkS', 'System Administrator', 'administrator', 'Information Technology', ARRAY['System Administration', 'Cybersecurity', 'Network Security'], 'secret', true, ARRAY['totp', 'sms'], '+91-9876543210'),
('selector.aero', 'selector.aero@drdo.gov.in', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/A5/jF3kkS', 'Aeronautics Selector', 'selector', 'Aeronautics', ARRAY['Aerodynamics', 'Propulsion Systems'], 'confidential', false, ARRAY[]::mfa_method[], '+91-9876543211'),
('candidate.001', 'candidate001@example.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/A5/jF3kkS', 'Test Candidate', 'candidate', 'External', ARRAY['Machine Learning', 'Database Management'], 'public', false, ARRAY[]::mfa_method[], '+91-9876543212');

-- Insert user permissions
INSERT INTO user_permissions (user_id, permission, resource) 
SELECT id, '*', '*' FROM users WHERE username = 'admin.drdo';

INSERT INTO user_permissions (user_id, permission, resource) 
SELECT id, permission, resource FROM users, 
(VALUES 
    ('interview:create', 'interviews'),
    ('interview:manage', 'interviews'),
    ('candidate:evaluate', 'users'),
    ('reports:view', 'reports')
) AS perms(permission, resource)
WHERE username = 'selector.aero';

INSERT INTO user_permissions (user_id, permission, resource) 
SELECT id, permission, resource FROM users, 
(VALUES 
    ('interview:join', 'interviews'),
    ('profile:view', 'users'),
    ('profile:update', 'users')
) AS perms(permission, resource)
WHERE username = 'candidate.001';

-- Create views for common queries
CREATE VIEW user_details AS
SELECT 
    u.id,
    u.username,
    u.email,
    u.full_name,
    u.role,
    u.department,
    u.expertise,
    u.security_clearance,
    u.is_active,
    u.mfa_enabled,
    u.last_login,
    u.created_at,
    COALESCE(array_agg(DISTINCT up.permission) FILTER (WHERE up.permission IS NOT NULL), ARRAY[]::VARCHAR[]) as permissions
FROM users u
LEFT JOIN user_permissions up ON u.id = up.user_id AND up.is_active = true
GROUP BY u.id, u.username, u.email, u.full_name, u.role, u.department, u.expertise, u.security_clearance, u.is_active, u.mfa_enabled, u.last_login, u.created_at;

CREATE VIEW interview_summary AS
SELECT 
    i.id,
    i.title,
    i.type,
    i.status,
    i.scheduled_time,
    i.actual_start_time,
    i.actual_end_time,
    i.duration,
    i.created_by,
    u.full_name as created_by_name,
    COUNT(ip.id) as participant_count,
    AVG(qe.overall_score) as avg_question_score,
    AVG(ae.overall_score) as avg_answer_score
FROM interviews i
LEFT JOIN users u ON i.created_by = u.id
LEFT JOIN interview_participants ip ON i.id = ip.interview_id
LEFT JOIN question_evaluations qe ON i.id = qe.interview_id
LEFT JOIN answer_evaluations ae ON i.id = ae.interview_id
GROUP BY i.id, i.title, i.type, i.status, i.scheduled_time, i.actual_start_time, i.actual_end_time, i.duration, i.created_by, u.full_name;

-- Grant permissions (adjust as needed for your environment)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO drdo_app_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO drdo_app_user;
-- GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO drdo_app_user;

COMMIT;