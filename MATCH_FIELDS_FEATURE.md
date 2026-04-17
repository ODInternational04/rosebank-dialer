# Custom Match Fields Feature

## Overview
Added custom field matching to bulk upload feature, allowing admins to choose exactly which fields to use for identifying duplicate clients during upload.

## What Changed

### Frontend (BulkUploadModal.tsx)
- **Converted from 4-step to 5-step wizard**
- **New Step 2: Choose Match Fields**
  - Checkbox selection for available match fields
  - Fields shown depend on client type (vault/gold)
  - Info messages show matching behavior
  - Multiple fields can be selected (AND logic)

**Workflow:**
1. Select Client Type (Vault/Gold)
2. **NEW: Choose Match Fields** (box_number, contract_no, name, ID, email, phone)
3. Upload File (Excel/CSV)
4. Map Fields to Database
5. Review Results

### Backend (bulk-upload/route.ts)
- Accepts `matchFields` parameter in request
- Dynamically builds Supabase query based on selected fields
- Uses ALL selected fields (AND logic) to find matches
- Falls back to default matching if no fields provided (backwards compatible)

## Default Matching (No Fields Selected)
- **Vault**: `box_number` OR `contract_no`
- **Gold**: `email` AND `phone`
- **Behavior**: All records treated as new inserts

## Custom Matching Examples

### Example 1: Email Only
```
Selected: [email]
Behavior: Finds clients by email, updates phone/address
Use case: Contact info changes but email stays same
```

### Example 2: Email + Phone
```
Selected: [email, phone]
Behavior: Both must match to update
Use case: Safe default, reduces false positives
```

### Example 3: Contract Number
```
Selected: [contract_no]
Behavior: Matches vault clients by contract
Use case: Syncing from external system with contract IDs
```

### Example 4: ID Number + Email
```
Selected: [principal_key_holder_id_number, email]
Behavior: Strictest matching, high confidence
Use case: Critical updates requiring verification
```

## Available Match Fields

### Vault Clients
- `box_number` - Box/Locker number
- `contract_no` - Contract number
- `principal_key_holder` - Client name
- `principal_key_holder_id_number` - ID/Passport number
- `principal_key_holder_email_address` - Email address
- `telephone_cell` - Cell phone number

### Gold Clients
- `principal_key_holder` - Client name
- `principal_key_holder_email_address` - Email address
- `telephone_cell` - Cell phone number

**Excluded from matching:**
- Notes (free text)
- Size (vault-specific)
- Occupation
- Home telephone
- Contract dates

## UI/UX Details

### No Fields Selected
```
ℹ️ No match fields selected. All records will be treated as new clients.
```

### Fields Selected
```
✓ Will match clients where:
  • Email Address matches, AND
  • Cell Phone matches
```

### Navigation
- Back button returns to previous step
- Next validates selection (can proceed with 0+ fields)
- Upload button shows count: "Upload X Clients"

## Technical Implementation

### State Management
```typescript
const [matchFields, setMatchFields] = useState<string[]>([])
const matchableFields = clientType === 'vault' 
  ? VAULT_FIELDS.filter(...) 
  : GOLD_FIELDS.filter(...)
```

### Toggle Function
```typescript
const toggleMatchField = (field: string) => {
  if (matchFields.includes(field)) {
    setMatchFields(matchFields.filter(f => f !== field))
  } else {
    setMatchFields([...matchFields, field])
  }
}
```

### API Call
```typescript
const response = await fetch('/api/clients/bulk-upload', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    clients: processedData,
    clientType,
    matchFields // New parameter
  })
})
```

### Backend Query Building
```typescript
if (matchFields && matchFields.length > 0) {
  let query = supabase
    .from('clients')
    .select('id')
    .eq('client_type', clientType)
  
  // Build AND query for all match fields
  matchFields.forEach(field => {
    const value = clientData[field] || preparedData[field]
    if (value) {
      query = query.eq(field, value)
    }
  })
  
  const { data: existing } = await query.single()
  existingClient = existing
}
```

## Benefits

1. **Flexibility**: Users control matching logic per upload
2. **Safety**: Select stricter criteria for critical updates
3. **Efficiency**: Looser criteria for bulk synchronization
4. **Transparency**: Clear UI shows exactly what will match
5. **Backwards Compatible**: Works without selection (default behavior)

## Testing Recommendations

1. **No selection**: Verify all as new inserts
2. **Single field**: Email only
3. **Multiple fields**: Email + Phone
4. **Vault-specific**: Box number or Contract number
5. **Edge case**: Non-existent field values
6. **Update validation**: Verify correct records updated

## Documentation Updated
- ✅ [BULK_UPLOAD_GUIDE.md](BULK_UPLOAD_GUIDE.md) - Complete feature documentation
- ✅ Step-by-step guide includes match field selection
- ✅ Common matching strategies explained
- ✅ Troubleshooting section added
- ✅ Example scenarios provided

## Commits
- `de2126d` - Add custom match fields selection for bulk upload
- `8a7bf62` - Update bulk upload documentation with custom match fields feature

## Next Steps (Optional Enhancements)

1. **OR Logic Support**: Allow choosing AND/OR between fields
2. **Match Preview**: Show count of how many will update vs insert before uploading
3. **Saved Presets**: Save common match field combinations
4. **Match Confidence**: Show confidence score for each match
5. **Partial Matching**: Fuzzy matching on names/emails
