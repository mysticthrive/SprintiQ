# Access Control Feature

This feature restricts access to SprintiQ based on the `allowed` field in the `users` table in your Supabase database.

## How It Works

1. **User Signup**: When a user signs up, their information is added to the `users` table with `allowed` set to `false` by default.
2. **Access Denied**: If a user's `allowed` field is `false`, they are denied access and redirected to the access denied page.
3. **Admin Approval**: An admin can set `allowed` to `true` in the `users` table to grant access.
4. **Multiple Checkpoints**: The check happens at:
   - Sign up attempt
   - Sign in attempt
   - OAuth callback (Google sign-in)
   - Middleware (for all protected routes)

## Database Table

- `users` table fields:
  - `id`: Primary key
  - `name`: User's full name
  - `email`: User's email (unique)
  - `allowed`: Boolean (default `false`)
  - `company`: Company name
  - `createdAt`, `updatedAt`: Timestamps

## Setup Instructions

### 1. Create the Database Table

Run the SQL script in your Supabase SQL editor:

```sql
-- See scripts/create-users-table.sql
```

### 2. Grant Access

To allow a user access, set their `allowed` field to `true` in the `users` table:

```sql
UPDATE users SET allowed = true WHERE email = 'user@example.com';
```

### 3. Remove Access

To deny access, set `allowed` to `false`:

```sql
UPDATE users SET allowed = false WHERE email = 'user@example.com';
```

## User Experience

### For Allowed Users:

- Normal sign up/sign in flow
- Full access to the app

### For Non-Allowed Users:

- Redirected to `/access-denied` page
- Clear explanation of why access is denied

## Troubleshooting

1. Make sure the `users` table exists and is up to date
2. Ensure the user's `allowed` field is set correctly
3. Check Supabase logs for any database errors

## API Endpoints

The feature uses these existing endpoints with enhanced security:

- Sign up and sign in endpoints now check the `allowed` field in the `users` table

## Support

If you need help with this feature:

1. Check the Supabase logs for any database errors
2. Verify the `users` table exists and has the correct structure
3. Ensure the user's `allowed` field is set as needed
4. Contact support if issues persist
