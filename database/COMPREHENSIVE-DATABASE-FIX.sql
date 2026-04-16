# =============================================
# COMPREHENSIVE DATABASE FIX SCRIPT
# Run this FIRST in Supabase SQL Editor
# =============================================

-- Step 1: Disable RLS on all tables (we use JWT auth at API layer)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE call_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;

-- Disable RLS on other tables if they exist
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'customer_feedback') THEN
        ALTER TABLE customer_feedback DISABLE ROW LEVEL SECURITY;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'campaigns') THEN
        ALTER TABLE campaigns DISABLE ROW LEVEL SECURITY;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_campaign_assignments') THEN
        ALTER TABLE user_campaign_assignments DISABLE ROW LEVEL SECURITY;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_logs') THEN
        ALTER TABLE audit_logs DISABLE ROW LEVEL SECURITY;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'gold_clients') THEN
        ALTER TABLE gold_clients DISABLE ROW LEVEL SECURITY;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vault_clients') THEN
        ALTER TABLE vault_clients DISABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Step 2: Drop ALL existing RLS policies to prevent recursion
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT schemaname, tablename, policyname 
              FROM pg_policies 
              WHERE schemaname = 'public')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
                      r.policyname, r.schemaname, r.tablename);
    END LOOP;
END $$;

-- Step 3: Verify all tables have RLS disabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public'
AND tablename IN ('users', 'clients', 'call_logs', 'notifications', 'customer_feedback', 'campaigns')
ORDER BY tablename;

-- Step 4: Verify no policies exist
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public';

-- Success message
DO $$
BEGIN
    RAISE NOTICE '================================';
    RAISE NOTICE '✅ DATABASE FIX COMPLETED!';
    RAISE NOTICE '================================';
    RAISE NOTICE '✅ RLS disabled on all tables';
    RAISE NOTICE '✅ All policies removed';
    RAISE NOTICE '✅ Database ready for JWT authentication';
    RAISE NOTICE '';
    RAISE NOTICE '📋 Next steps:';
    RAISE NOTICE '1. Refresh your browser';
    RAISE NOTICE '2. Try creating a client again';
    RAISE NOTICE '3. Check if clients list loads properly';
    RAISE NOTICE '================================';
END $$;
