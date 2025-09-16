-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom types
CREATE TYPE user_role AS ENUM ('administrator', 'selector', 'candidate', 'observer');
CREATE TYPE security_level AS ENUM ('public', 'restricted', 'confidential', 'secret');
CREATE TYPE interview_status AS ENUM ('scheduled', 'in_progress', 'completed', 'cancelled', 'technical_issues');
CREATE TYPE participant_role AS ENUM ('interviewer', 'candidate', 'observer', 'moderator');
CREATE TYPE connection_quality AS ENUM ('excellent', 'good', 'fair', 'poor');
CREATE TYPE emotion_type AS ENUM ('confident', 'nervous', 'focused', 'stressed', 'calm', 'excited', 'confused');
CREATE TYPE question_category AS ENUM ('technical', 'behavioral', 'situational', 'domain_specific', 'general');

-- Users table with comprehensive profile information
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    full_name VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'candidate',
    department VARCHAR(100),
    designation VARCHAR(100),
    expertise TEXT[],
    security_clearance security_level NOT NULL DEFAULT 'public',
    phone VARCHAR(20),
    avatar_url TEXT,
    bio TEXT,
    experience_years INTEGER DEFAULT 0,
    education JSONB,
    certifications JSONB,
    skills JSONB,
    languages JSONB,
    preferences JSONB DEFAULT '{}',
    mfa_enabled BOOLEAN DEFAULT false,
    mfa_secret VARCHAR(255),
    last_login TIMESTAMP WITH TIME ZONE,
    login_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User sessions for tracking active sessions
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    refresh_token VARCHAR(255) UNIQUE,
    device_info JSONB,
    ip_address INET,
    user_agent TEXT,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_accessed TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Organizations/Departments structure
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES organizations(id),
    hierarchy_level INTEGER DEFAULT 0,
    contact_info JSONB,
    settings JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Job positions and requirements
CREATE TABLE job_positions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    organization_id UUID REFERENCES organizations(id),
    description TEXT,
    requirements JSONB,
    qualifications JSONB,
    skills_required JSONB,
    experience_required INTEGER DEFAULT 0,
    security_clearance_required security_level DEFAULT 'public',
    salary_range JSONB,
    benefits JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Interview sessions
CREATE TABLE interviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    job_position_id UUID REFERENCES job_positions(id),
    status interview_status NOT NULL DEFAULT 'scheduled',
    scheduled_time TIMESTAMP WITH TIME ZONE NOT NULL,
    actual_start_time TIMESTAMP WITH TIME ZONE,
    actual_end_time TIMESTAMP WITH TIME ZONE,
    duration_minutes INTEGER NOT NULL DEFAULT 60,
    evaluation_criteria JSONB NOT NULL DEFAULT '{}',
    question_categories question_category[] DEFAULT '{}',
    settings JSONB DEFAULT '{}',
    room_config JSONB DEFAULT '{}',
    recording_enabled BOOLEAN DEFAULT true,
    recording_url TEXT,
    transcript TEXT,
    summary TEXT,
    results JSONB,
    final_score DECIMAL(5,2),
    recommendation TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Interview participants
CREATE TABLE interview_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    interview_id UUID REFERENCES interviews(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    role participant_role NOT NULL,
    joined_at TIMESTAMP WITH TIME ZONE,
    left_at TIMESTAMP WITH TIME ZONE,
    connection_quality connection_quality DEFAULT 'good',
    device_info JSONB,
    network_stats JSONB,
    participation_score DECIMAL(3,2),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Questions asked during interviews
CREATE TABLE interview_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    interview_id UUID REFERENCES interviews(id) ON DELETE CASCADE,
    asked_by UUID REFERENCES users(id),
    question_text TEXT NOT NULL,
    category question_category,
    difficulty_level INTEGER CHECK (difficulty_level >= 1 AND difficulty_level <= 10),
    expected_answer TEXT,
    time_allocated INTEGER, -- in seconds
    asked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sequence_number INTEGER,
    is_followup BOOLEAN DEFAULT false,
    parent_question_id UUID REFERENCES interview_questions(id),
    metadata JSONB DEFAULT '{}'
);

-- Answers provided by candidates
CREATE TABLE interview_answers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question_id UUID REFERENCES interview_questions(id) ON DELETE CASCADE,
    answered_by UUID REFERENCES users(id),
    answer_text TEXT,
    audio_url TEXT,
    video_url TEXT,
    duration_seconds INTEGER,
    answered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    confidence_level DECIMAL(3,2),
    metadata JSONB DEFAULT '{}'
);

-- AI evaluations for questions
CREATE TABLE question_evaluations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question_id UUID REFERENCES interview_questions(id) ON DELETE CASCADE,
    relevance_score DECIMAL(3,2) CHECK (relevance_score >= 0 AND relevance_score <= 1),
    difficulty_score DECIMAL(3,2) CHECK (difficulty_score >= 0 AND difficulty_score <= 1),
    clarity_score DECIMAL(3,2) CHECK (clarity_score >= 0 AND clarity_score <= 1),
    bias_score DECIMAL(3,2) CHECK (bias_score >= 0 AND bias_score <= 1),
    overall_score DECIMAL(3,2) CHECK (overall_score >= 0 AND overall_score <= 1),
    feedback TEXT,
    suggestions TEXT[],
    ai_model_version VARCHAR(50),
    processing_time_ms INTEGER,
    evaluated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI evaluations for answers
CREATE TABLE answer_evaluations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    answer_id UUID REFERENCES interview_answers(id) ON DELETE CASCADE,
    semantic_relevance DECIMAL(3,2) CHECK (semantic_relevance >= 0 AND semantic_relevance <= 1),
    technical_accuracy DECIMAL(3,2) CHECK (technical_accuracy >= 0 AND technical_accuracy <= 1),
    communication_quality DECIMAL(3,2) CHECK (communication_quality >= 0 AND communication_quality <= 1),
    depth_of_understanding DECIMAL(3,2) CHECK (depth_of_understanding >= 0 AND depth_of_understanding <= 1),
    overall_score DECIMAL(3,2) CHECK (overall_score >= 0 AND overall_score <= 1),
    strengths TEXT[],
    improvement_areas TEXT[],
    factual_errors JSONB,
    sentiment_analysis JSONB,
    keyword_analysis JSONB,
    ai_model_version VARCHAR(50),
    processing_time_ms INTEGER,
    evaluated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Emotion analysis data
CREATE TABLE emotion_analysis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    interview_id UUID REFERENCES interviews(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    dominant_emotion emotion_type,
    confidence DECIMAL(3,2) CHECK (confidence >= 0 AND confidence <= 1),
    stress_level DECIMAL(3,2) CHECK (stress_level >= 0 AND stress_level <= 1),
    engagement_level DECIMAL(3,2) CHECK (engagement_level >= 0 AND engagement_level <= 1),
    facial_expressions JSONB,
    voice_indicators JSONB,
    body_language JSONB,
    ai_model_version VARCHAR(50)
);

-- Bias detection logs
CREATE TABLE bias_detection_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    interview_id UUID REFERENCES interviews(id) ON DELETE CASCADE,
    detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    bias_type VARCHAR(100),
    severity_level INTEGER CHECK (severity_level >= 1 AND severity_level <= 5),
    description TEXT,
    affected_user_id UUID REFERENCES users(id),
    context_data JSONB,
    mitigation_applied BOOLEAN DEFAULT false,
    mitigation_details TEXT,
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'pending'
);

-- Real-time communication logs
CREATE TABLE communication_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    interview_id UUID REFERENCES interviews(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    event_type VARCHAR(50) NOT NULL,
    event_data JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    session_id VARCHAR(255),
    peer_id VARCHAR(255),
    quality_metrics JSONB
);

-- System audit logs
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    session_id VARCHAR(255)
);

-- Analytics and reporting data
CREATE TABLE analytics_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(10,4),
    dimensions JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    interview_id UUID REFERENCES interviews(id),
    user_id UUID REFERENCES users(id),
    organization_id UUID REFERENCES organizations(id)
);

-- File uploads and attachments
CREATE TABLE file_uploads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT,
    mime_type VARCHAR(100),
    uploaded_by UUID REFERENCES users(id),
    related_to_type VARCHAR(50),
    related_to_id UUID,
    is_public BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications system
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info',
    priority INTEGER DEFAULT 1,
    read BOOLEAN DEFAULT false,
    action_url TEXT,
    metadata JSONB DEFAULT '{}',
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- System settings and configuration
CREATE TABLE system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(100) UNIQUE NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    category VARCHAR(50) DEFAULT 'general',
    is_public BOOLEAN DEFAULT false,
    updated_by UUID REFERENCES users(id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_active ON users(is_active);
CREATE INDEX idx_interviews_status ON interviews(status);
CREATE INDEX idx_interviews_scheduled_time ON interviews(scheduled_time);
CREATE INDEX idx_interview_participants_interview_id ON interview_participants(interview_id);
CREATE INDEX idx_interview_questions_interview_id ON interview_questions(interview_id);
CREATE INDEX idx_interview_answers_question_id ON interview_answers(question_id);
CREATE INDEX idx_emotion_analysis_interview_id ON emotion_analysis(interview_id);
CREATE INDEX idx_bias_detection_interview_id ON bias_detection_logs(interview_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers to relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_job_positions_updated_at BEFORE UPDATE ON job_positions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_interviews_updated_at BEFORE UPDATE ON interviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default system settings
INSERT INTO system_settings (key, value, description, category, is_public) VALUES
('app_name', '"DRDO AI Interview System"', 'Application name', 'general', true),
('app_version', '"1.0.0"', 'Application version', 'general', true),
('max_interview_duration', '180', 'Maximum interview duration in minutes', 'interview', false),
('ai_evaluation_enabled', 'true', 'Enable AI evaluation features', 'ai', false),
('bias_detection_enabled', 'true', 'Enable bias detection', 'ai', false),
('emotion_analysis_enabled', 'true', 'Enable emotion analysis', 'ai', false),
('recording_enabled', 'true', 'Enable interview recording', 'interview', false),
('max_file_upload_size', '10485760', 'Maximum file upload size in bytes', 'general', false);

-- Insert default organization
INSERT INTO organizations (name, code, description) VALUES
('DRDO Headquarters', 'DRDO-HQ', 'Defence Research and Development Organisation Headquarters');

-- Create RLS policies will be added in next migration
-- Enable Row Level Security on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE answer_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE emotion_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE bias_detection_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE communication_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Grant permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Grant permissions to anon users (limited)
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON system_settings TO anon;
GRANT INSERT ON users TO anon;
GRANT SELECT ON organizations TO anon;
GRANT SELECT ON job_positions TO anon;