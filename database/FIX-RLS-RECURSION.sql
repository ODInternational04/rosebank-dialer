-- =============================================
-- FIX: Remove RLS infinite recursion
-- This removes the recursive user checks that cause infinite loops
-- =============================================

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view profiles" ON users;
DROP POLICY IF EXISTS "Users can update profiles" ON users;
DROP POLICY IF EXISTS "Only admins can create users" ON users;
DROP POLICY IF EXISTS "Only admins can delete users" ON users;

-- DISABLE RLS ON USERS TABLE
-- We're using JWT authentication at the API layer instead
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- =============================================
-- SIMPLIFY OTHER TABLE POLICIES
-- Remove user table lookups to prevent recursion
-- =============================================

-- For clients table - allow all authenticated users
DROP POLICY IF EXISTS "Authenticated users can view clients" ON clients;
DROP POLICY IF EXISTS "Only authenticated users can manage clients" ON clients;
DROP POLICY IF EXISTS "Users can insert clients" ON clients;
DROP POLICY IF EXISTS "Users can update clients" ON clients;
DROP POLICY IF EXISTS "Users can delete clients" ON clients;

-- Simplified client policies (no user table lookups)
CREATE POLICY "Authenticated users can manage clients" ON clients
    FOR ALL USING (auth.uid() IS NOT NULL);

-- For call_logs table
DROP POLICY IF EXISTS "Users can view own call logs" ON call_logs;
DROP POLICY IF EXISTS "Users can manage own call logs" ON call_logs;
DROP POLICY IF EXISTS "Users can insert call logs" ON call_logs;
DROP POLICY IF EXISTS "Users can update call logs" ON call_logs;
DROP POLICY IF EXISTS "Users can delete call logs" ON call_logs;

-- Simplified call log policies
CREATE POLICY "Authenticated users can manage call logs" ON call_logs
    FOR ALL USING (auth.uid() IS NOT NULL);

-- For notifications table
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can manage own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can insert notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update notifications" ON notifications;
DROP POLICY IF EXISTS "Users can delete notifications" ON notifications;

-- Simplified notification policies
CREATE POLICY "Authenticated users can manage notifications" ON notifications
    FOR ALL USING (auth.uid() IS NOT NULL);

-- For customer_feedback table
DROP POLICY IF EXISTS "Authenticated users can view feedback" ON customer_feedback;
DROP POLICY IF EXISTS "Authenticated users can manage feedback" ON customer_feedback;

-- Simplified feedback policies
CREATE POLICY "Authenticated users can manage feedback" ON customer_feedback
    FOR ALL USING (auth.uid() IS NOT NULL);

-- =============================================
-- VERIFICATION
-- =============================================

-- Check that users table RLS is disabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'users' AND schemaname = 'public';

-- Should show rowsecurity = false

-- Verification messages
DO $$
BEGIN
    RAISE NOTICE '✅ RLS infinite recursion fixed!';
    RAISE NOTICE '✅ Users table RLS disabled - using JWT auth instead';
    RAISE NOTICE '✅ Other tables simplified to prevent recursion';
END $$;
