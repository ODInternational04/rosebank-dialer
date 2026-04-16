-- ⚡ URGENT FIX: Update admin password hash
-- Copy this ENTIRE file and paste into Supabase SQL Editor, then click RUN

UPDATE users 
SET password_hash = '$2a$10$ixLHDspkrU0Z8hZn4ioenuaxMyExXRuYMe1tZHMb7DcT1TTw.vtBy'
WHERE email = 'admin@rosebank.com';

-- Verify it worked (you should see the new hash starting with $2a$10$ixLH...)
SELECT 
  email, 
  LEFT(password_hash, 35) as hash_start,
  is_active, 
  role 
FROM users 
WHERE email = 'admin@rosebank.com';
