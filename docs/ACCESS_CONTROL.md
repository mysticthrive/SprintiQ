# Access Control Feature

This feature allows you to restrict access to SprintiQ to only specific email addresses that are stored in the `allowed_users` table in your Supabase database.

## How It Works

1. **Email Check**: When users try to sign up or sign in, their email is checked against the `allowed_users` table
2. **Access Denied**: If the email is not found in the table, users are redirected to an access denied page
3. **Multiple Checkpoints**: The check happens at:
   - Sign up attempt
   - Sign in attempt
   - OAuth callback (Google sign-in)
   - Middleware (for all protected routes)

## Files Structure

- `lib/auth-utils.ts` - Client-side email authorization check
- `lib/auth-utils-server.ts` - Server-side email authorization check (for middleware and API routes)
- `app/access-denied/page.tsx` - Access denied page
- `database/allowed_users.sql` - Database setup script

## Setup Instructions

### 1. Create the Database Table

Run the SQL script in your Supabase SQL editor:

```sql
-- Copy and paste the contents of database/allowed_users.sql
```

### 2. Add Allowed Emails

You can add allowed emails through the Supabase dashboard or using SQL:

```sql
-- Add individual emails
INSERT INTO allowed_users (email) VALUES ('user@example.com');

-- Add multiple emails
INSERT INTO allowed_users (email) VALUES
  ('admin@yourcompany.com'),
  ('user1@yourcompany.com'),
  ('user2@yourcompany.com');
```

### 3. Manage Allowed Users

#### Through Supabase Dashboard:

1. Go to your Supabase project dashboard
2. Navigate to Table Editor
3. Select the `allowed_users` table
4. Add, edit, or remove email addresses as needed

#### Through SQL:

```sql
-- View all allowed users
SELECT * FROM allowed_users ORDER BY created_at DESC;

-- Remove a user
DELETE FROM allowed_users WHERE email = 'user@example.com';

-- Update an email
UPDATE allowed_users SET email = 'newemail@example.com' WHERE email = 'oldemail@example.com';
```

## Security Features

- **Row Level Security (RLS)**: Enabled on the `allowed_users` table
- **Fail Open**: If there's an error checking the table, access is allowed (prevents blocking legitimate users due to database issues)
- **Case Insensitive**: Email checks are case-insensitive and trimmed
- **Service Role Only**: Only the service role can modify the allowed_users table

## User Experience

### For Allowed Users:

- Normal sign up/sign in flow
- No additional steps required

### For Non-Allowed Users:

- Redirected to `/access-denied` page
- Clear explanation of why access is denied
- Contact information for requesting access

## Troubleshooting

### Common Issues:

1. **Table doesn't exist**: Run the SQL script in `database/allowed_users.sql`
2. **Users can't sign in**: Check if their email is in the `allowed_users` table
3. **Service role errors**: Ensure your Supabase service role key is properly configured

### Testing:

1. Add your email to the `allowed_users` table
2. Try signing up/signing in - should work normally
3. Remove your email from the table
4. Try signing up/signing in - should redirect to access denied page

## API Endpoints

The feature uses these existing endpoints with enhanced security:

- `POST /auth/signup` - Now checks email authorization
- `POST /auth/signin` - Now checks email authorization
- `GET /auth/callback` - Now checks email authorization after OAuth

## Configuration

The feature is enabled by default once the `allowed_users` table exists. If you want to disable it temporarily, you can:

1. Drop the `allowed_users` table, or
2. Modify the `isEmailAllowed` function in `lib/auth-utils.ts` to always return `true`

## Support

If you need help with this feature:

1. Check the Supabase logs for any database errors
2. Verify the `allowed_users` table exists and has the correct structure
3. Ensure your email is properly added to the table
4. Contact support if issues persist
