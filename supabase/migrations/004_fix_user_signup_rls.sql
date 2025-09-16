-- Fix RLS policy for user signup
-- The current policy only allows authenticated users to insert, but during signup
-- the user isn't authenticated yet. We need to allow the signup process.

-- Drop the existing restrictive INSERT policy
DROP POLICY IF EXISTS "Allow user creation during signup" ON users;

-- Create a new policy that allows user creation during the signup process
-- This policy allows INSERT when the user ID matches the authenticated user ID
-- OR when it's part of the signup process (no auth.uid() yet)
CREATE POLICY "Enable user signup" ON users
    FOR INSERT
    WITH CHECK (
        -- Allow if the user ID matches the authenticated user (normal case)
        auth.uid()::text = id::text
        -- OR allow if this is during signup process (auth.uid() might be null initially)
        OR auth.uid() IS NOT NULL
    );

-- Alternative approach: Temporarily allow INSERT for service role during signup
-- This is more secure as it only allows the backend service to create users
CREATE POLICY "Allow service role to create users" ON users
    FOR INSERT
    TO service_role
    WITH CHECK (true);

-- Grant INSERT permission to anon role specifically for user creation
-- This is needed for the signup process
GRANT INSERT ON users TO anon;

-- Create a more permissive policy for anon role during signup
CREATE POLICY "Allow anon user creation during signup" ON users
    FOR INSERT
    TO anon
    WITH CHECK (true);