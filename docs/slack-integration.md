# Slack Integration

This document describes how to set up and use the Slack integration feature in SprintiQ.

## Overview

The Slack integration allows you to:

- Connect your SprintiQ workspace to a Slack workspace
- Send notifications about task updates, sprint events, and project activities to Slack channels
- Map specific entities (spaces, projects, sprints) to specific Slack channels
- Receive real-time updates in your Slack workspace

## Setup Instructions

### 1. Create a Slack App

1. Go to [https://api.slack.com/apps](https://api.slack.com/apps)
2. Click "Create New App"
3. Choose "From scratch"
4. Enter an app name (e.g., "SprintiQ Integration")
5. Select your workspace

### 2. Configure OAuth Settings

1. In your Slack app settings, go to "OAuth & Permissions"
2. Add the following OAuth scopes:

   - `chat:write` - Send messages to channels
   - `channels:read` - Read public channels
   - `groups:read` - Read private channels
   - `im:read` - Read direct messages
   - `mpim:read` - Read group direct messages
   - `users:read` - Read user information

3. Set the redirect URL to:
   ```
   https://your-domain.com/api/slack/oauth/callback
   ```

### 3. Install the App

1. Go to "Install App" in your Slack app settings
2. Click "Install to Workspace"
3. Authorize the app

### 4. Get Credentials

1. Copy the "Client ID" and "Client Secret" from the "Basic Information" page
2. Add these to your environment variables:
   ```
   SLACK_CLIENT_ID=your_client_id
   SLACK_CLIENT_SECRET=your_client_secret
   ```

### 5. Run Database Migration

Run the Slack integration migration script:

```bash
./scripts/run-slack-migration.sh
```

Or manually run the SQL:

```bash
psql $DATABASE_URL -f scripts/create-slack-integration-tables.sql
```

## Usage

### Connecting Slack

1. Go to your workspace settings
2. Navigate to "Notifications"
3. In the "Integrations" section, click "Connect account" next to Slack
4. Follow the OAuth flow to authorize your Slack workspace

### Mapping Channels

After connecting Slack, you can map specific entities to Slack channels:

1. In your workspace settings, you'll see a "Slack Channel Mapping" section
2. Click "Add Channel Mapping" for the entity you want to connect
3. Select a Slack channel from the dropdown
4. Save the mapping

### Supported Entities

The following entities can be mapped to Slack channels:

- **Workspace** - General workspace notifications
- **Space** - Space-specific notifications
- **Project** - Project-specific notifications
- **Sprint** - Sprint-specific notifications

### Notification Types

The following events will trigger Slack notifications:

- **Task Created** - When a new task is created
- **Task Updated** - When a task is modified
- **Task Completed** - When a task is marked as complete
- **Task Assigned** - When a task is assigned to someone
- **Task Commented** - When a comment is added to a task
- **Sprint Started** - When a sprint begins
- **Sprint Completed** - When a sprint ends
- **Project Created** - When a new project is created
- **Project Updated** - When a project is modified

## API Endpoints

### OAuth Flow

- `GET /api/slack/oauth?workspaceId={id}` - Generate OAuth URL
- `GET /api/slack/oauth/callback` - Handle OAuth callback

### Channel Management

- `GET /api/slack/channels?workspaceId={id}` - Get available channels
- `POST /api/slack/channel-mapping` - Create channel mapping
- `DELETE /api/slack/channel-mapping?mappingId={id}` - Delete channel mapping

## Database Schema

### slack_integrations

Stores workspace Slack connections:

```sql
CREATE TABLE slack_integrations (
    id UUID PRIMARY KEY,
    workspace_id UUID REFERENCES workspaces(id),
    slack_workspace_id VARCHAR(255),
    slack_workspace_name VARCHAR(255),
    slack_workspace_domain VARCHAR(255),
    access_token TEXT,
    bot_user_id VARCHAR(255),
    bot_username VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
);
```

### slack_channel_mappings

Stores channel-to-entity mappings:

```sql
CREATE TABLE slack_channel_mappings (
    id UUID PRIMARY KEY,
    slack_integration_id UUID REFERENCES slack_integrations(id),
    channel_id VARCHAR(255),
    channel_name VARCHAR(255),
    channel_type VARCHAR(50),
    entity_type VARCHAR(50),
    entity_id UUID,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
);
```

### slack_notification_settings

Stores notification preferences:

```sql
CREATE TABLE slack_notification_settings (
    id UUID PRIMARY KEY,
    slack_integration_id UUID REFERENCES slack_integrations(id),
    event_type VARCHAR(100),
    is_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
);
```

## Troubleshooting

### Common Issues

1. **OAuth Error**: Make sure your redirect URL is correctly set in your Slack app settings
2. **Permission Denied**: Ensure your Slack app has the required OAuth scopes
3. **Channel Not Found**: The bot must be a member of the channel to send messages
4. **Token Expired**: Re-authenticate your Slack workspace

### Debugging

Check the browser console and server logs for error messages. Common error patterns:

- `slack_oauth_failed` - OAuth authorization failed
- `oauth_exchange_failed` - Failed to exchange code for token
- `workspace_not_found` - Invalid workspace ID
- `access_denied` - User doesn't have permission to access workspace

### Support

If you encounter issues:

1. Check that all environment variables are set correctly
2. Verify your Slack app configuration
3. Ensure the database migration was run successfully
4. Check the server logs for detailed error messages

## Security Considerations

- Access tokens are stored encrypted in the database
- OAuth state parameter prevents CSRF attacks
- Row-level security policies protect workspace data
- Only workspace owners and admins can manage integrations
