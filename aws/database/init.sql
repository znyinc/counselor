-- Initialize PostgreSQL database for AI Career Counseling Tool
-- This script creates the necessary tables and indexes for production deployment

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create application user with limited privileges
CREATE USER app_user WITH PASSWORD 'secure_app_password';

-- Create schemas
CREATE SCHEMA IF NOT EXISTS career_data;
CREATE SCHEMA IF NOT EXISTS user_data;
CREATE SCHEMA IF NOT EXISTS analytics;

-- Grant schema usage
GRANT USAGE ON SCHEMA career_data TO app_user;
GRANT USAGE ON SCHEMA user_data TO app_user;
GRANT USAGE ON SCHEMA analytics TO app_user;

-- Career data tables
CREATE TABLE career_data.colleges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255) NOT NULL,
    state VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL, -- government, private, deemed
    established_year INTEGER,
    nirf_ranking INTEGER,
    courses JSONB,
    fees JSONB,
    admission_process TEXT,
    contact_info JSONB,
    facilities TEXT[],
    accreditation VARCHAR(100),
    website VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE career_data.careers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL UNIQUE,
    category VARCHAR(100) NOT NULL,
    description TEXT,
    required_skills TEXT[],
    educational_requirements JSONB,
    salary_range JSONB,
    growth_prospects TEXT,
    job_market_demand VARCHAR(50),
    work_environment TEXT,
    related_careers TEXT[],
    entrance_exams TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE career_data.scholarships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL,
    eligibility_criteria JSONB,
    amount JSONB,
    application_process TEXT,
    deadline DATE,
    provider VARCHAR(255),
    target_groups TEXT[],
    applicable_courses TEXT[],
    website VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User data tables (encrypted sensitive data)
CREATE TABLE user_data.student_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id VARCHAR(255) UNIQUE NOT NULL,
    profile_data JSONB NOT NULL, -- Encrypted profile data
    recommendations JSONB, -- AI recommendations
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (CURRENT_TIMESTAMP + INTERVAL '24 hours'),
    INDEX (expires_at)
);

-- Analytics tables (anonymized data)
CREATE TABLE analytics.career_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    state VARCHAR(100),
    board VARCHAR(100),
    stream VARCHAR(100),
    interest_areas TEXT[],
    preferred_careers TEXT[],
    financial_background VARCHAR(50), -- anonymized ranges
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_month DATE GENERATED ALWAYS AS (DATE_TRUNC('month', created_at)) STORED
);

CREATE TABLE analytics.recommendation_effectiveness (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recommendation_type VARCHAR(100),
    user_feedback_score INTEGER CHECK (user_feedback_score BETWEEN 1 AND 5),
    recommendation_accuracy DECIMAL(3,2),
    response_time_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE analytics.system_performance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    endpoint VARCHAR(255),
    response_time_ms INTEGER,
    status_code INTEGER,
    error_message TEXT,
    user_agent TEXT,
    ip_address INET,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_colleges_state ON career_data.colleges(state);
CREATE INDEX idx_colleges_type ON career_data.colleges(type);
CREATE INDEX idx_colleges_ranking ON career_data.colleges(nirf_ranking) WHERE nirf_ranking IS NOT NULL;

CREATE INDEX idx_careers_category ON career_data.careers(category);
CREATE INDEX idx_careers_demand ON career_data.careers(job_market_demand);

CREATE INDEX idx_scholarships_type ON career_data.scholarships(type);
CREATE INDEX idx_scholarships_deadline ON career_data.scholarships(deadline) WHERE deadline IS NOT NULL;

CREATE INDEX idx_student_profiles_session ON user_data.student_profiles(session_id);
CREATE INDEX idx_student_profiles_expires ON user_data.student_profiles(expires_at);

CREATE INDEX idx_career_preferences_state ON analytics.career_preferences(state);
CREATE INDEX idx_career_preferences_month ON analytics.career_preferences(created_month);

CREATE INDEX idx_system_performance_endpoint ON analytics.system_performance(endpoint);
CREATE INDEX idx_system_performance_created ON analytics.system_performance(created_at);

-- Grant table permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA career_data TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA user_data TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA analytics TO app_user;

-- Grant sequence permissions
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA career_data TO app_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA user_data TO app_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA analytics TO app_user;

-- Create function to clean up expired profiles
CREATE OR REPLACE FUNCTION user_data.cleanup_expired_profiles()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM user_data.student_profiles 
    WHERE expires_at < CURRENT_TIMESTAMP;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for auto-updating timestamps
CREATE TRIGGER update_colleges_updated_at 
    BEFORE UPDATE ON career_data.colleges 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_careers_updated_at 
    BEFORE UPDATE ON career_data.careers 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scholarships_updated_at 
    BEFORE UPDATE ON career_data.scholarships 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data for testing
INSERT INTO career_data.careers (title, category, description, required_skills, educational_requirements, salary_range, job_market_demand) VALUES
('Software Engineer', 'Technology', 'Design and develop software applications', ARRAY['Programming', 'Problem Solving', 'Algorithms'], '{"degree": "B.Tech/B.E in Computer Science", "certifications": ["AWS", "Google Cloud"]}', '{"entry": 500000, "mid": 1200000, "senior": 2500000}', 'High'),
('Data Scientist', 'Technology', 'Analyze complex data to help organizations make decisions', ARRAY['Python', 'Statistics', 'Machine Learning'], '{"degree": "B.Tech/M.Tech/Ph.D in relevant field", "skills": ["Python", "R", "SQL"]}', '{"entry": 600000, "mid": 1500000, "senior": 3000000}', 'Very High'),
('Doctor', 'Healthcare', 'Diagnose and treat illnesses and injuries', ARRAY['Medical Knowledge', 'Communication', 'Empathy'], '{"degree": "MBBS", "entrance_exams": ["NEET"]}', '{"entry": 800000, "mid": 2000000, "senior": 5000000}', 'High');

INSERT INTO career_data.colleges (name, location, state, type, nirf_ranking) VALUES
('Indian Institute of Technology Delhi', 'New Delhi', 'Delhi', 'government', 2),
('Indian Institute of Technology Bombay', 'Mumbai', 'Maharashtra', 'government', 1),
('All India Institute of Medical Sciences', 'New Delhi', 'Delhi', 'government', 1);

INSERT INTO career_data.scholarships (name, type, eligibility_criteria, amount) VALUES
('Merit cum Means Scholarship', 'Government', '{"income_limit": 200000, "merit_requirement": "Top 20%"}', '{"amount": 12000, "duration": "Annual"}'),
('Post Matric Scholarship for SC/ST', 'Government', '{"category": ["SC", "ST"], "income_limit": 250000}', '{"amount": 10000, "duration": "Annual"}'),
('National Scholarship Portal', 'Government', '{"merit_based": true, "income_limit": 600000}', '{"amount": 20000, "duration": "Annual"}');

-- Create a cleanup job (to be scheduled externally)
-- Schedule: 0 2 * * * (daily at 2 AM)
COMMENT ON FUNCTION user_data.cleanup_expired_profiles() IS 'Cleanup function to remove expired student profiles. Should be scheduled to run daily.';

-- Performance monitoring views
CREATE VIEW analytics.daily_stats AS
SELECT 
    DATE(created_at) as date,
    COUNT(*) as total_profiles,
    COUNT(DISTINCT state) as unique_states,
    array_agg(DISTINCT preferred_careers[1]) as popular_careers
FROM analytics.career_preferences 
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;

CREATE VIEW analytics.performance_summary AS
SELECT 
    endpoint,
    AVG(response_time_ms) as avg_response_time,
    MAX(response_time_ms) as max_response_time,
    COUNT(*) as request_count,
    COUNT(CASE WHEN status_code >= 400 THEN 1 END) as error_count
FROM analytics.system_performance 
WHERE created_at >= CURRENT_DATE - INTERVAL '24 hours'
GROUP BY endpoint
ORDER BY avg_response_time DESC;

GRANT SELECT ON analytics.daily_stats TO app_user;
GRANT SELECT ON analytics.performance_summary TO app_user;