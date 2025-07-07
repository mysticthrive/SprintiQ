# Jira Integration

This document describes the Jira integration feature that allows users to connect their Jira projects to the workspace and import/sync data.

## Overview

The Jira integration provides a seamless way to:

1. Connect to Jira using API credentials
2. Import Jira projects, issues, and statuses
3. Convert Jira data to the internal data model
4. Maintain synchronization between Jira and the workspace

## Features

### 1. Create Space with Jira Integration

- Users can enable Jira integration when creating a new space
- The integration process is guided through a step-by-step modal

### 2. Step-by-Step Integration Process

- **Step 1**: Enter Jira credentials (domain, email, API token)
- **Step 2**: Test connection and select projects to import
- **Step 3**: Review issues and statuses before import

### 3. Data Conversion

- Jira projects → Internal projects (with type='jira')
- Jira issues → Internal tasks (with type='jira')
- Jira statuses → Internal statuses (with integration_type='jira')
- Maintains parent-child relationships for subtasks

## Database Schema

### New Fields Added

#### Projects Table

- `type`: VARCHAR(50) - Integration type ('default', 'jira', etc.)
- `external_id`: VARCHAR(255) - External system ID
- `external_data`: JSONB - Additional external data

#### Tasks Table

- `type`: VARCHAR(50) - Integration type ('default', 'jira', etc.)
- `external_id`: VARCHAR(255) - External system ID
- `external_data`: JSONB - Additional external data

#### Statuses Table

- `integration_type`: VARCHAR(50) - Integration type
- `external_id`: VARCHAR(255) - External system ID
- `external_data`: JSONB - Additional external data

### New Tables

#### jira_integrations

Stores Jira connection credentials and settings per workspace.

#### jira_projects

Maps Jira projects to internal projects and spaces.

## API Endpoints

### 1. Test Connection

```
POST /api/workspace/[workspaceId]/jira/test-connection
```

Tests Jira API credentials.

### 2. Get Projects

```
POST /api/workspace/[workspaceId]/jira/projects
```

Retrieves available Jira projects.

### 3. Get Issues and Statuses

```
POST /api/workspace/[workspaceId]/jira/issues
```

Fetches issues and statuses for a specific project.

### 4. Import Data

```
POST /api/workspace/[workspaceId]/jira/import
```

Imports selected projects, issues, and statuses into the workspace.

## Components

### 1. CreateSpaceModal

Enhanced to include a Jira integration switch.

### 2. JiraIntegrationModal

Multi-step modal for the integration process:

- Step 1: Credentials input and connection test
- Step 2: Project selection
- Step 3: Data review and import

## Utilities

### 1. JiraAPI (`lib/jira-api.ts`)

Handles all Jira API interactions:

- Connection testing
- Project fetching
- Issue and status retrieval
- Issue creation and updates

### 2. JiraConverter (`lib/jira-converter.ts`)

Converts Jira data to internal format:

- Maps Jira projects to internal projects
- Converts Jira issues to tasks
- Transforms Jira statuses to internal statuses
- Maintains relationships and metadata

## Data Mapping

### Jira Issue Types

- **Story**: Converted to regular task
- **Sub-task**: Converted to task with parent_task_id
- **Bug**: Converted to task with appropriate metadata

### Priority Mapping

- Highest/High → 'high'
- Medium → 'medium'
- Low/Lowest → 'low'

### Status Mapping

- Status colors are mapped to internal color system
- Status categories are preserved in external_data

## Security

### Row Level Security (RLS)

- All Jira integration tables have RLS enabled
- Users can only access integrations for their workspaces
- API tokens are encrypted and stored securely

### API Token Management

- Tokens are stored encrypted in the database
- Tokens are never exposed in client-side code
- All Jira API calls are made server-side

## Usage

### 1. Enable Jira Integration

1. Click "Create Space" in the sidebar
2. Toggle "Enable Jira Integration"
3. Click "Create Space"

### 2. Connect to Jira

1. Enter Jira domain (e.g., your-domain.atlassian.net)
2. Enter email address
3. Enter API token
4. Click "Test Connection"

### 3. Select Projects

1. Choose target space for imported projects
2. Select projects to import
3. Click "Next"

### 4. Review and Import

1. Review issues and statuses for each project
2. Click "Import Data"
3. Wait for import to complete

## Future Enhancements

### 1. Bi-directional Sync

- Sync changes back to Jira
- Real-time synchronization
- Conflict resolution

### 2. Additional Integrations

- Azure DevOps
- Linear
- Asana
- GitHub Issues

### 3. Advanced Features

- Custom field mapping
- Workflow automation
- Bulk operations
- Sync scheduling

## Troubleshooting

### Common Issues

1. **Connection Failed**

   - Verify domain format (should be your-domain.atlassian.net)
   - Check API token permissions
   - Ensure email is correct

2. **No Projects Found**

   - Verify API token has project access
   - Check Jira project permissions
   - Ensure projects are not archived

3. **Import Errors**
   - Check database connection
   - Verify workspace permissions
   - Review error logs

### Error Handling

- All API calls include proper error handling
- User-friendly error messages
- Detailed logging for debugging

## Migration

To apply the database changes:

```sql
-- Run the migration script
\i database/jira-integration-migration.sql
```

This will:

- Add new columns to existing tables
- Create new Jira integration tables
- Set up indexes for performance
- Configure RLS policies
