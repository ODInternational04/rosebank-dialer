-- Add client access columns to users table
-- Run this in your Supabase SQL editor

-- Add columns for client type access control
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS can_access_vault_clients BOOLEAN DEFAULT true NOT NULL,
ADD COLUMN IF NOT EXISTS can_access_gold_clients BOOLEAN DEFAULT false NOT NULL;

-- Grant admins access to both client types by default
UPDATE users 
SET can_access_vault_clients = true, 
    can_access_gold_clients = true 
WHERE role = 'admin';

-- Add comments for documentation
COMMENT ON COLUMN users.can_access_vault_clients IS 'Whether user can view/edit vault clients';
COMMENT ON COLUMN users.can_access_gold_clients IS 'Whether user can view/edit gold clients';

-- Display success message
DO $$
BEGIN
    RAISE NOTICE '✓ Client access columns added to users table';
    RAISE NOTICE '✓ Admin users granted full access to both client types';
    RAISE NOTICE 'You can now control user access to vault and gold clients!';
END $$;
