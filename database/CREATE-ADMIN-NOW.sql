-- COPY THIS ENTIRE FILE AND RUN IT IN SUPABASE NOW!
-- This will create the admin user that currently doesn't exist

-- Create admin user (this is what's missing!)
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
    '$2a$10$ixLHDspkrU0Z8hZn4ioenuaxMyExXRuYMe1tZHMb7DcT1TTw.vtBy',
    'Admin',
    'User',
    'admin',
    true,
    NOW(),
    NOW()
)
ON CONFLICT (email) 
DO UPDATE SET 
    password_hash = '$2a$10$ixLHDspkrU0Z8hZn4ioenuaxMyExXRuYMe1tZHMb7DcT1TTw.vtBy',
    updated_at = NOW();

-- Show result
SELECT 
    email, 
    first_name,
    last_name,
    role,
    is_active,
    LEFT(password_hash, 30) as hash_preview
FROM users 
WHERE email = 'admin@rosebank.com';
