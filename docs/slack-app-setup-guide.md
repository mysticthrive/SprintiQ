# Slack App Setup Guide

This guide will help you set up your Slack app correctly to avoid the `invalid_team_for_non_distributed_app` error.

## Quick Fix: Make Your App Distributable

### Step 1: Go to Your Slack App Settings

1. Visit [https://api.slack.com/apps](https://api.slack.com/apps)
2. Select your SprintiQ integration app

### Step 2: Enable App Distribution

1. In the left sidebar, click **"Settings"** → **"Basic Information"**
2. Scroll down to the **"App Distribution"** section
3. Click **"Distribute App"**
4. Follow the prompts to make your app distributable

### Step 3: Configure OAuth Settings

1. Go to **"OAuth & Permissions"** in the left sidebar
2. Add these OAuth scopes:

   - `chat:write` - Send messages to channels
   - `channels:read` - Read public channels
   - `groups:read` - Read private channels
   - `im:read` - Read direct messages
   - `mpim:read` - Read group direct messages
   - `users:read` - Read user information

3. Set the **Redirect URL** to:
   ```
   https://your-domain.com/api/slack/oauth/callback
   ```
   (Replace `your-domain.com` with your actual domain)

### Step 4: Install the App

1. Go to **"Install App"** in the left sidebar
2. Click **"Install to Workspace"**
3. Authorize the app

### Step 5: Get Your Credentials

1. Go back to **"Basic Information"**
2. Copy the **"Client ID"** and **"Client Secret"**
3. Add them to your environment variables:
   ```
   SLACK_CLIENT_ID=your_client_id
   SLACK_CLIENT_SECRET=your_client_secret
   ```

## Alternative: Single Workspace Setup

If you don't want to make your app distributable, you can only connect to the workspace where the app was created:

1. Make sure you're connecting to the same Slack workspace where you created the app
2. The app will only work for that specific workspace

## Testing the Connection

1. **Run the database migration**:

   ```bash
   ./scripts/run-slack-migration.sh
   ```

2. **Test the OAuth flow**:
   - Go to your workspace settings → Notifications
   - Click "Connect account" next to Slack
   - You should be redirected to Slack.com
   - Select your workspace and authorize
   - You should be redirected back with a success message

## Common Error Solutions

### Error: `invalid_team_for_non_distributed_app`

**Solution**: Make your app distributable (see Step 2 above)

### Error: `access_denied`

**Solution**: Make sure you click "Allow" when authorizing the app

### Error: `invalid_client`

**Solution**: Check that your Client ID and Client Secret are correct

### Error: `invalid_redirect_uri`

**Solution**: Make sure the redirect URL in your Slack app settings matches exactly:

```
https://your-domain.com/api/slack/oauth/callback
```

## Security Best Practices

1. **Never commit credentials to version control**
2. **Use environment variables for sensitive data**
3. **Regularly rotate your Client Secret**
4. **Monitor your app's usage in Slack**

## Troubleshooting

### App Not Showing in Workspace

1. Make sure the app is installed in the workspace
2. Check that you have admin permissions in the workspace
3. Verify the app is not restricted by workspace settings

### OAuth Flow Not Working

1. Check browser console for errors
2. Verify all environment variables are set
3. Ensure the redirect URL is correct
4. Check that the app has the required scopes

### Database Errors

1. Make sure you've run the migration script
2. Check that your database connection is working
3. Verify the tables were created successfully

## Support

If you continue to have issues:

1. Check the Slack API documentation: https://api.slack.com/
2. Verify your app configuration in the Slack app settings
3. Check the server logs for detailed error messages
4. Ensure all environment variables are correctly set
