# Account Deletion Issue - Root Cause and Solution

## Problem Description

Deleted accounts kept showing back up in the system due to multiple automatic recreation mechanisms:

### Root Causes Identified

1. **Expert Advisor (EA) Auto-Sync**: The EA continues sending account data even after account deletion
2. **Database Trigger Auto-Mapping**: The `map_user_from_mt_accounts` trigger tried to map data to deleted accounts
3. **License Validation Auto-Creation**: The license system automatically added accounts when first encountered
4. **Manual Re-creation**: Users manually re-added accounts when they saw data flowing in

### Technical Details

- **EA Files**: `ea_account_sync.mq4` and `ea_account_sync.mq5` continuously sync account metrics
- **Database Trigger**: `map_user_from_mt_accounts()` function mapped account metrics to user IDs
- **License System**: `validate-license` function automatically authorized first accounts
- **No Deletion Tracking**: No mechanism to prevent re-creation of deleted accounts

## Solution Implemented

### 1. Database Schema Changes

**Migration**: `20250828000000_fix_account_deletion_issue.sql`

- Added `deleted_at` timestamp column to `mt_accounts` table
- Created index for efficient deletion checks
- Updated `map_user_from_mt_accounts` function to exclude deleted accounts
- Created `delete_mt_account_complete()` function for proper cleanup
- Added trigger to prevent re-creation of deleted accounts
- Updated RLS policies to exclude deleted accounts
- Created `active_mt_accounts` view for clean data access

### 2. Application Code Changes

**File**: `src/pages/Accounts.tsx`

- Updated `loadAccounts()` to use `active_mt_accounts` view
- Updated `handleDeleteAccount()` to use `delete_mt_account_complete()` function
- Updated `onSubmit()` to use `active_mt_accounts` view
- Enhanced user messaging about deletion prevention

### 3. License Validation Updates

**File**: `supabase/functions/validate-license/index.ts`

- Added check for previously deleted accounts
- Prevents automatic authorization of deleted accounts
- Returns appropriate error message for deleted accounts

### 4. Cleanup Functions

**File**: `supabase/functions/cleanup-orphaned-accounts/index.ts`

- Created edge function to clean up orphaned account data
- Removes data for accounts that no longer exist
- Can be run periodically to maintain data integrity

## Key Features

### Soft Delete Implementation
- Accounts are marked as deleted with `deleted_at` timestamp
- All related data is properly cleaned up
- Deleted accounts cannot be recreated automatically

### Prevention Mechanisms
- Database trigger prevents re-insertion of deleted accounts
- License validation checks for deleted accounts
- RLS policies exclude deleted accounts from queries

### Data Integrity
- Complete cleanup of related data (snapshots, metrics, trades)
- Removal from license key account arrays
- Orphaned data cleanup function

## Usage

### Deleting an Account
```typescript
// Use the new deletion function
const { data, error } = await supabase.rpc('delete_mt_account_complete', {
  account_id: accountId
});
```

### Loading Active Accounts
```typescript
// Use the active accounts view
const { data, error } = await supabase
  .from("active_mt_accounts")
  .select("id,login,broker,platform,created_at")
  .eq("user_id", user.id);
```

### Cleaning Up Orphaned Data
```bash
# Deploy and run the cleanup function
npx supabase functions deploy cleanup-orphaned-accounts
curl -X POST "https://your-project.supabase.co/functions/v1/cleanup-orphaned-accounts"
```

## Benefits

1. **Permanent Deletion**: Deleted accounts stay deleted
2. **Data Integrity**: Complete cleanup of related data
3. **Prevention**: Multiple layers prevent accidental re-creation
4. **Performance**: Efficient queries using views and indexes
5. **Maintainability**: Clear separation of active and deleted accounts

## Migration Notes

- Existing accounts are unaffected
- Deleted accounts will be properly tracked going forward
- Orphaned data can be cleaned up using the provided function
- All new account operations use the improved system

## Testing

To test the solution:

1. Delete an account through the UI
2. Verify it doesn't appear in the accounts list
3. Try to manually add the same account - should be prevented
4. Check that EA data doesn't cause re-creation
5. Verify license validation rejects deleted accounts

## Troubleshooting

### Common Issues

**Error: "column reference 'user_id' is ambiguous"**
- **Cause**: The delete function had ambiguous column references
- **Solution**: Fixed in migration `20250828020000_improve_delete_function_robustness.sql`
- **Status**: ✅ Resolved

**Error: "Account not found or already deleted"**
- **Cause**: Account was already deleted or doesn't exist
- **Solution**: This is expected behavior - the function properly handles this case
- **Status**: ✅ Working as intended

**Error: "This account was previously deleted and cannot be reauthorized"**
- **Cause**: License validation correctly preventing re-creation of deleted accounts
- **Solution**: This is expected behavior - the prevention mechanism is working
- **Status**: ✅ Working as intended

## Future Considerations

- Consider adding a "restore deleted account" feature if needed
- Implement periodic cleanup of old deleted account records
- Add audit logging for account deletion events
- Consider implementing account archiving instead of deletion for compliance
