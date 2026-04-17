# Bulk Upload Templates

This folder contains sample templates for bulk uploading clients.

## Vault Clients Template

Required fields:
- box_number (unique)
- contract_no (unique)
- principal_key_holder (name)
- principal_key_holder_email_address
- telephone_cell

Optional fields:
- size
- principal_key_holder_id_number
- telephone_home
- contract_start_date (YYYY-MM-DD format)
- contract_end_date (YYYY-MM-DD format)
- occupation
- notes

## Gold Clients Template

Required fields:
- principal_key_holder (name)
- principal_key_holder_email_address
- telephone_cell

Optional fields:
- telephone_home
- notes

## Usage

1. Download the appropriate template (vault or gold)
2. Fill in your client data
3. Save as Excel (.xlsx) or CSV (.csv)
4. Go to Clients page and click "Bulk Upload" (Admin only)
5. Select client type
6. Upload your file
7. Map columns to database fields
8. Review and upload

## Notes

- First row must contain column headers
- Existing clients (matched by box_number/contract_no for vault, or email+phone for gold) will be updated
- New clients will be inserted
- Errors will be reported at the end of the upload process
