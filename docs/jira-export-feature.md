# Jira Export Feature

This document describes the Jira export feature that allows users to export their project data to Jira.

## Overview

The Jira export feature provides a comprehensive way to:

1. Connect to Jira using API credentials
2. Export project tasks to Jira issues
3. Map local statuses to Jira statuses
4. Update project and task types to "jira" after successful export
5. Maintain integration records for future synchronization

## Features

### 1. Step-by-Step Export Process

The export process is guided through a 5-step modal:

- **Step 1**: Enter Jira credentials (domain, email, API token) and test connection
- **Step 2**: Select existing Jira project or create a new one
- **Step 3**: Map local statuses to Jira statuses
- **Step 4**: Export progress with loading animation
- **Step 5**: Export completion summary

### 2. Data Conversion

- Local tasks → Jira issues (with proper field mapping)
- Local statuses → Jira statuses (with user-defined mapping)
- Project type updated to "jira" after successful export
- Task type updated to "jira" with external_id and external_data

### 3. Integration Management

- Creates or updates Jira integration records
- Stores credentials securely in database
- Enables future bidirectional synchronization

## Usage

### 1. Access Export Feature

1. Navigate to any project in the workspace
2. Click the "More" button (three dots) next to the project
3. Select "Export" → "Export to Jira"

### 2. Export Process

1. **Connect to Jira**: Enter your Jira domain, email, and API token
2. **Select Project**: Choose an existing Jira project or create a new one
3. **Map Statuses**: Match your local statuses with Jira statuses
4. **Export**: Watch the progress as tasks are exported
5. **Complete**: Review the export summary

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

### 3. Get Statuses

```
POST /api/workspace/[workspaceId]/jira/statuses
```

Fetches statuses for a specific Jira project.

### 4. Export Data

```
POST /api/workspace/[workspaceId]/jira/export
```

Exports selected project data to Jira.

## Components

### 1. ExportToJiraModal

Multi-step modal component located at:
`components/workspace/modals/export-to-jira-modal.tsx`

Features:

- Step-by-step wizard interface
- Progress indicators
- Status mapping interface
- Loading animations
- Error handling

### 2. Secondary Sidebar Integration

The export feature is integrated into the project dropdown menu in:
`components/workspace/layout/secondary-sidebar.tsx`

## Database Updates

### 1. Task Updates

After successful export, tasks are updated with:

- `type`: Set to "jira"
- `external_id`: Jira issue key
- `external_data`: Jira metadata
- `last_synced_at`: Timestamp
- `sync_status`: Set to "synced"

### 2. Project Updates

Projects are updated with:

- `type`: Set to "jira"
- `external_id`: Jira project key
- `external_data`: Jira project metadata

### 3. Integration Records

Jira integration records are created/updated in `jira_integrations` table.

## Security

### 1. Credential Storage

- API tokens are stored encrypted in the database
- All Jira API calls are made server-side
- Credentials are never exposed in client-side code

### 2. Row Level Security (RLS)

- All integration tables have RLS enabled
- Users can only access integrations for their workspaces

## Error Handling

### 1. Connection Errors

- Invalid credentials
- Network connectivity issues
- Jira API rate limiting

### 2. Export Errors

- Missing status mappings
- Jira project access issues
- Database update failures

### 3. User Feedback

- Toast notifications for success/error states
- Progress indicators during export
- Detailed error messages

## Future Enhancements

### 1. Bidirectional Sync

- Import changes from Jira back to the application
- Real-time synchronization
- Conflict resolution

### 2. Advanced Mapping

- Custom field mapping
- Issue type mapping
- Priority mapping
- Assignee mapping

### 3. Bulk Operations

- Export multiple projects
- Batch status updates
- Bulk issue creation

## Troubleshooting

### 1. Connection Issues

- Verify Jira domain format (your-domain.atlassian.net)
- Check API token permissions
- Ensure email is associated with Jira account

### 2. Export Failures

- Verify project access permissions
- Check status mapping completeness
- Review Jira API rate limits

### 3. Data Issues

- Verify task data integrity
- Check status relationships
- Review project associations
