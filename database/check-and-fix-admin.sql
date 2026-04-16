-- Check and Fix Admin User for Rosebank Dialer
-- Run this in your Supabase SQL Editor

-- Step 1: Check if admin user exists
DO $$
DECLARE
    admin_record RECORD;
BEGIN
    SELECT * INTO admin_record FROM users WHERE email = 'admin@rosebank.com';
    
    IF admin_record.id IS NOT NULL THEN
        RAISE NOTICE '✅ Admin user exists with ID: %', admin_record.id;
        RAISE NOTICE 'Email: %', admin_record.email;
        RAISE NOTICE 'Role: %', admin_record.role;
        RAISE NOTICE 'Is Active: %', admin_record.is_active;
        RAISE NOTICE 'Password Hash: %', LEFT(admin_record.password_hash, 20) || '...';
    ELSE
        RAISE NOTICE '❌ Admin user does NOT exist';
    END IF;
END $$;

-- Step 2: Delete the old admin user (if exists)
DELETE FROM users WHERE email = 'admin@rosebank.com';

-- Step 3: Create new admin user with correct password hash
INSERT INTO users (
    email,
    password_hash,
    first_name,
    last_name,
    role,
    is_active,
    created_at,
    updated_at
) VALUES (
    'admin@rosebank.com',
    '$2a$10$ixLHDspkrU0Z8hZn4ioenuaxMyExXRuYMe1tZHMb7DcT1TTw.vtBy', -- Password: admin123
    'Admin',
    'User',
    'admin',
    true,
    NOW(),
    NOW()
);

-- Step 4: Verify the new admin user was created
DO $$
DECLARE
    admin_record RECORD;
BEGIN
    SELECT * INTO admin_record FROM users WHERE email = 'admin@rosebank.com';
    
    IF admin_record.id IS NOT NULL THEN
        RAISE NOTICE '✅ Admin user successfully created!';
        RAISE NOTICE 'ID: %', admin_record.id;
        RAISE NOTICE 'Email: %', admin_record.email;
        RAISE NOTICE 'Role: %', admin_record.role;
        RAISE NOTICE 'Is Active: %', admin_record.is_active;
        RAISE NOTICE '';
        RAISE NOTICE '🔐 LOGIN CREDENTIALS:';
        RAISE NOTICE 'Email: admin@rosebank.com';
        RAISE NOTICE 'Password: admin123';
    ELSE
        RAISE NOTICE '❌ Failed to create admin user!';
    END IF;
END $$;
