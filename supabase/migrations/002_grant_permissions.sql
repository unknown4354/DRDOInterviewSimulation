-- Grant permissions to anon and authenticated roles for all tables

-- Grant SELECT permissions to anon role for public tables
GRANT SELECT ON system_settings TO anon;
GRANT SELECT ON organizations TO anon;
GRANT SELECT ON job_positions TO anon;

-- Grant full permissions to authenticated role
GRANT ALL PRIVILEGES ON users TO authenticated;
GRANT ALL PRIVILEGES ON user_sessions TO authenticated;
GRANT ALL PRIVILEGES ON organizations TO authenticated;
GRANT ALL PRIVILEGES ON job_positions TO authenticated;
GRANT ALL PRIVILEGES ON interviews TO authenticated;
GRANT ALL PRIVILEGES ON interview_participants TO authenticated;
GRANT ALL PRIVILEGES ON interview_questions TO authenticated;
GRANT ALL PRIVILEGES ON interview_answers TO authenticated;
GRANT ALL PRIVILEGES ON question_evaluations TO authenticated;
GRANT ALL PRIVILEGES ON answer_evaluations TO authenticated;
GRANT ALL PRIVILEGES ON emotion_analysis TO authenticated;
GRANT ALL PRIVILEGES ON bias_detection_logs TO authenticated;
GRANT ALL PRIVILEGES ON communication_logs TO authenticated;
GRANT ALL PRIVILEGES ON audit_logs TO authenticated;
GRANT ALL PRIVILEGES ON analytics_metrics TO authenticated;
GRANT ALL PRIVILEGES ON file_uploads TO authenticated;
GRANT ALL PRIVILEGES ON notifications TO authenticated;
GRANT ALL PRIVILEGES ON system_settings TO authenticated;

-- Grant SELECT on system_settings to anon for public settings
GRANT SELECT ON system_settings TO anon;

-- Create RLS policies for system_settings
CREATE POLICY "Allow anon to read public system settings" ON system_settings
    FOR SELECT TO anon
    USING (is_public = true);

CREATE POLICY "Allow authenticated users to read all system settings" ON system_settings
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated users to update system settings" ON system_settings
    FOR UPDATE TO authenticated
    USING (true);

-- Create RLS policies for organizations
CREATE POLICY "Allow anon to read active organizations" ON organizations
    FOR SELECT TO anon
    USING (is_active = true);

CREATE POLICY "Allow authenticated users full access to organizations" ON organizations
    FOR ALL TO authenticated
    USING (true);

-- Create RLS policies for job_positions
CREATE POLICY "Allow anon to read active job positions" ON job_positions
    FOR SELECT TO anon
    USING (is_active = true);

CREATE POLICY "Allow authenticated users full access to job positions" ON job_positions
    FOR ALL TO authenticated
    USING (true);

-- Create RLS policies for users
CREATE POLICY "Users can view their own profile" ON users
    FOR SELECT TO authenticated
    USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE TO authenticated
    USING (auth.uid()::text = id::text);

CREATE POLICY "Allow user creation during signup" ON users
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid()::text = id::text);

-- Create RLS policies for interviews
CREATE POLICY "Users can view interviews they participate in" ON interviews
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM interview_participants ip 
            WHERE ip.interview_id = interviews.id 
            AND ip.user_id::text = auth.uid()::text
        )
        OR created_by::text = auth.uid()::text
    );

CREATE POLICY "Users can create interviews" ON interviews
    FOR INSERT TO authenticated
    WITH CHECK (created_by::text = auth.uid()::text);

CREATE POLICY "Interview creators can update their interviews" ON interviews
    FOR UPDATE TO authenticated
    USING (created_by::text = auth.uid()::text);

-- Create RLS policies for interview_participants
CREATE POLICY "Users can view participants of their interviews" ON interview_participants
    FOR SELECT TO authenticated
    USING (
        user_id::text = auth.uid()::text
        OR EXISTS (
            SELECT 1 FROM interviews i 
            WHERE i.id = interview_participants.interview_id 
            AND i.created_by::text = auth.uid()::text
        )
    );

CREATE POLICY "Users can join interviews as participants" ON interview_participants
    FOR INSERT TO authenticated
    WITH CHECK (user_id::text = auth.uid()::text);

-- Create basic policies for other tables
CREATE POLICY "Users can access their own sessions" ON user_sessions
    FOR ALL TO authenticated
    USING (user_id::text = auth.uid()::text);

CREATE POLICY "Users can access their interview questions" ON interview_questions
    FOR ALL TO authenticated
    USING (
        asked_by::text = auth.uid()::text
        OR EXISTS (
            SELECT 1 FROM interview_participants ip 
            WHERE ip.interview_id = interview_questions.interview_id 
            AND ip.user_id::text = auth.uid()::text
        )
    );

CREATE POLICY "Users can access their interview answers" ON interview_answers
    FOR ALL TO authenticated
    USING (
        answered_by::text = auth.uid()::text
        OR EXISTS (
            SELECT 1 FROM interview_questions iq
            JOIN interview_participants ip ON ip.interview_id = iq.interview_id
            WHERE iq.id = interview_answers.question_id
            AND ip.user_id::text = auth.uid()::text
        )
    );

-- Allow authenticated users to access evaluations, analytics, etc.
CREATE POLICY "Authenticated users can access question evaluations" ON question_evaluations
    FOR ALL TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can access answer evaluations" ON answer_evaluations
    FOR ALL TO authenticated
    USING (true);

CREATE POLICY "Users can access their emotion analysis" ON emotion_analysis
    FOR ALL TO authenticated
    USING (user_id::text = auth.uid()::text);

CREATE POLICY "Authenticated users can access bias detection logs" ON bias_detection_logs
    FOR ALL TO authenticated
    USING (true);

CREATE POLICY "Users can access their communication logs" ON communication_logs
    FOR ALL TO authenticated
    USING (user_id::text = auth.uid()::text);

CREATE POLICY "Users can access their audit logs" ON audit_logs
    FOR SELECT TO authenticated
    USING (user_id::text = auth.uid()::text);

CREATE POLICY "Users can access their analytics metrics" ON analytics_metrics
    FOR ALL TO authenticated
    USING (user_id::text = auth.uid()::text);

CREATE POLICY "Users can access their file uploads" ON file_uploads
    FOR ALL TO authenticated
    USING (uploaded_by::text = auth.uid()::text);

CREATE POLICY "Users can access their notifications" ON notifications
    FOR ALL TO authenticated
    USING (user_id::text = auth.uid()::text);

-- Grant usage on sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;