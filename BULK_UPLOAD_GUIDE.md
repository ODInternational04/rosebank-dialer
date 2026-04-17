# Bulk Upload Feature Documentation

## Overview
The bulk upload feature allows administrators to import multiple clients at once from Excel or CSV files. The system intelligently maps your file columns to database fields and can both insert new clients and update existing ones.

## Access
- **Who**: Administrators only
- **Where**: Clients page → "Bulk Upload" button (top right)

## Features

### 1. Client Type Selection
Choose between:
- **Vault Clients**: Full details (box number, contract info, dates, etc.)
- **Gold Clients**: Simplified (name, email, phone, notes)

### 2. File Upload
Supported formats:
- Excel (.xlsx, .xls)
- CSV (.csv)

### 3. Smart Field Mapping
- **Auto-detection**: System automatically maps columns based on header names
- **Manual mapping**: Adjust mappings as needed
- **Required field validation**: Ensures all mandatory fields are mapped
- **Real-time preview**: See sample data before upload

### 4. Upsert Logic
- **New clients**: Inserted into database
- **Existing clients**: Updated with new data
  - **Custom matching**: You choose which fields to match on (Step 2 of upload wizard)
  - **Match logic**: ALL selected fields must match (AND logic)
  - **Default matching** (if no fields selected):
    - Vault: Matched by `box_number` or `contract_no`
    - Gold: Matched by `email` + `phone` combination

### 5. Custom Match Fields Selection
**New Feature!** Choose exactly which fields to use for identifying existing clients:

**How it works:**
- During Step 2 of upload, select one or more fields to match on
- If ALL selected fields match an existing client, that client will be updated
- If no match is found, a new client is created
- If no fields are selected, all records are treated as new clients

**Available match fields:**
- Box Number (vault only)
- Contract Number (vault only)
- Name/Key Holder
- ID Number
- Email Address
- Cell Phone

**Common matching strategies:**
- **Email + Phone**: Safest option, catches most duplicates
- **Email only**: Good if phone numbers change frequently
- **Box Number** or **Contract Number**: Best for vault clients with unique identifiers
- **ID Number + Email**: Strictest matching for high-confidence updates
- **No selection**: Import all as new (useful for initial bulk loads)

**Example scenarios:**
1. **Updating client contact info**: Select "Email" only - finds clients by email and updates their phone/address
2. **Syncing from external system**: Select "Contract Number" - ensures vault clients with same contract are updated
3. **Merging multiple sources**: Select "Email + Phone" - only updates when both match, reducing false positives
4. **Fresh import**: Don't select any fields - treats everything as new clients

### 6. Results Dashboard
After upload, see:
- Number of new clients inserted
- Number of existing clients updated
- Number of rows skipped (with error details)
- Detailed error messages for failed rows

## Step-by-Step Guide

### Step 1: Prepare Your Data
1. Download template from `templates/` folder:
   - [vault-clients-template.csv](../templates/vault-clients-template.csv) for vault clients
   - [gold-clients-template.csv](../templates/gold-clients-template.csv) for gold clients
2. Fill in your client data
3. Ensure first row contains column headers
4. Use clear, descriptive header names (helps with auto-mapping)

### Step 2: Upload Process
1. Click **"Bulk Upload"** button on Clients page
2. **Select client type** (Vault or Gold)
3. **Choose match fields** - Select which field(s) to use for identifying existing clients:
   - No fields selected = All records treated as new clients
   - One or more fields = System will search for matches using ALL selected fields (AND logic)
   - Common choices:
     - Email + Phone (recommended for most cases)
     - Box Number (for vault clients)
     - Contract Number (for vault clients)
     - ID Number + Email (for strict matching)
4. Click **"Choose File"** and select your file
5. System automatically parses and shows field mapping
6. Review/adjust column mappings
7. Click **"Upload X Clients"**

### Step 3: Review Results
- Green = Successfully inserted
- Blue = Successfully updated
- Red = Errors (with details)

## Required Fields

### Vault Clients
- `box_number` * (unique)
- `contract_no` * (unique)
- `principal_key_holder` * (name)
- `principal_key_holder_email_address` *
- `telephone_cell` *

### Gold Clients
- `principal_key_holder` * (name)
- `principal_key_holder_email_address` *
- `telephone_cell` *

\* = Required field

## Optional Fields

### Vault Clients Only
- `size`
- `principal_key_holder_id_number`
- `telephone_home`
- `contract_start_date` (format: YYYY-MM-DD)
- `contract_end_date` (format: YYYY-MM-DD)
- `occupation`
- `notes`

### All Clients
- `telephone_home`
- `notes`

## Best Practices

### Data Formatting
- **Dates**: Use YYYY-MM-DD format (e.g., 2024-01-15)
- **Phone numbers**: Include area codes (e.g., 0821234567)
- **Email**: Valid email format required
- **Empty cells**: Leave optional fields blank (don't use "N/A" or similar)

### Column Headers
- Use descriptive names that match database fields
- Common variations are auto-detected:
  - "Email" → `principal_key_holder_email_address`
  - "Cell Phone" → `telephone_cell`
  - "Name" → `principal_key_holder`
  - "Box Number" → `box_number`

### File Size
- Recommended: Up to 1,000 rows per upload
- Larger files: Split into multiple uploads
- System processes row-by-row to prevent memory issues

### Updating Existing Clients
The system will update existing clients based on your selected match fields (Step 2 of upload wizard):
- **Custom matching**: Updates when ALL selected fields match
- **Default matching** (if no fields selected):
  - **Vault**: `box_number` OR `contract_no` matches
  - **Gold**: `email` AND `phone` both match

Only fields present in your upload will be updated. Empty cells won't overwrite existing data.

**Tip**: Select match fields carefully:
- More fields = Stricter matching (fewer false positives, may miss some updates)
- Fewer fields = Looser matching (catches more updates, risk of false positives)

## Error Handling

Common errors and solutions:

### "Missing required fields"
- Ensure all required fields are mapped
- Check for empty values in required columns

### "Vault clients require box_number and contract_no"
- These are mandatory for vault clients
- Ensure your file has these columns

### "Insert/Update failed"
- Check for duplicate box_number or contract_no (vault only)
- Verify email format is valid
- Ensure phone number format is correct

### "User must have access to at least one client type"
- Contact admin to grant appropriate access
- Check user permissions in Users tab

## API Endpoint

For developers integrating programmatically:

```
POST /api/clients/bulk-upload
Authorization: Bearer {token}
Content-Type: application/json

{
  "clientType": "vault" | "gold",
  "clients": [
    {
      "principal_key_holder": "John Doe",
      "principal_key_holder_email_address": "john@example.com",
      "telephone_cell": "0821234567",
      // ... other fields
    }
  ]
}
```

Response:
```json
{
  "success": true,
  "inserted": 10,
  "updated": 5,
  "errors": [],
  "details": {
    "total": 15,
    "processed": 15,
    "skipped": 0
  }
}
```

## Security

- Admin access required
- Uses service role key for database operations
- Validates all input data
- Prevents SQL injection through parameterized queries
- Audit trail: `created_by` and `last_updated_by` tracked

## Troubleshooting

### Upload button not visible
- Only admins can see bulk upload
- Check your user role in profile

### File not parsing
- Ensure first row contains headers
- Try saving as CSV instead of Excel
- Check for special characters in file name

### All rows skipped
- Verify required fields are mapped
- Check data format matches requirements
- Review error messages in results screen

### Clients not updating as expected
- Check which match fields you selected in Step 2
- Ensure the match field values in your file exactly match the database
- Remember: ALL selected fields must match (AND logic)
- Try using fewer/different match fields
- If unsure, use "Email + Phone" as a safe default

### Too many duplicates created
- You may not have selected match fields
- Try re-uploading with appropriate match fields selected
- Use "Email + Phone" to catch most duplicates

## Support

For issues or questions:
1. Check error messages in results screen
2. Review this documentation
3. Contact system administrator
4. Check [templates folder](../templates/) for examples
