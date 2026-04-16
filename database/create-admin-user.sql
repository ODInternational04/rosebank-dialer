-- Create Admin User for Rosebank Dialer System
-- Run this in your Supabase SQL editor

-- Insert admin user (only if no admin exists)
DO $$
DECLARE
    admin_count INTEGER;
BEGIN
    -- Check if any admin user exists
    SELECT COUNT(*) INTO admin_count FROM users WHERE role = 'admin';
    
    -- Only insert if no admin exists
    IF admin_count = 0 THEN
        INSERT INTO users (
            email,
            password_hash,
            first_name,
            last_name,
            role,
            is_active
        ) VALUES (
            'admin@rosebank.com',
            '$2a$10$ixLHDspkrU0Z8hZn4ioenuaxMyExXRuYMe1tZHMb7DcT1TTw.vtBy', -- Password: admin123
            'Admin',
            'User',
            'admin',
            true
        );
        
        RAISE NOTICE '✅ Admin user created successfully!';
        RAISE NOTICE 'Email: admin@rosebank.com';
        RAISE NOTICE 'Password: admin123';
        RAISE NOTICE '⚠️  IMPORTANT: Change this password immediately after first login!';
    ELSE
        RAISE NOTICE '⚠️  Admin user already exists, skipping creation.';
    END IF;
END $$;
