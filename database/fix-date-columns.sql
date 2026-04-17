-- Make contract dates nullable for vault clients
-- This allows bulk upload to work when dates are not provided

ALTER TABLE clients 
ALTER COLUMN contract_start_date DROP NOT NULL;

ALTER TABLE clients 
ALTER COLUMN contract_end_date DROP NOT NULL;

-- Also make occupation nullable since it's optional
ALTER TABLE clients 
ALTER COLUMN occupation DROP NOT NULL;

-- Make ID number nullable since not all clients may have it
ALTER TABLE clients 
ALTER COLUMN principal_key_holder_id_number DROP NOT NULL;

-- Verify changes
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'clients'
    AND column_name IN (
        'contract_start_date',
        'contract_end_date',
        'occupation',
        'principal_key_holder_id_number'
    )
ORDER BY column_name;
