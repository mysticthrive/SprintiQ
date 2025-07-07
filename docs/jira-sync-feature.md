# Jira Sync Feature

## Overview

The Jira Sync feature allows users to keep their local project data synchronized with the latest information from Jira. When you update story descriptions, statuses, or other details in Jira, you can use the sync feature to update the corresponding data in your local database.

## How It Works

### Automatic Detection

- Projects imported from Jira are automatically marked with `type: "jira"` and have an `external_id` that links them to the original Jira project
- The system can identify Jira projects and show the sync button only for these projects

### Sync Process

1. **Fetch Latest Data**: The sync process fetches the latest issues and statuses from Jira using the stored API credentials
2. **Compare and Update**: It compares the fetched data with existing local data and updates any changes
3. **Create New Items**: Any new issues or statuses that don't exist locally are created
4. **Refresh UI**: After sync, the project view automatically refreshes to show the updated data

## Features

### Visual Indicators

- **Jira Icon**: Jira projects display a GitBranch icon instead of the default Hash icon
- **Jira Badge**: A "Jira" badge appears next to the project name
- **Sync Button**: A sync button appears in the project header for Jira projects

### Sync Button States

- **Default**: Shows GitBranch icon with "Sync" text
- **Loading**: Shows spinning RefreshCw icon with "Syncing..." text
- **Disabled**: Button is disabled during sync to prevent multiple simultaneous syncs

### Sync Results

After a successful sync, you'll see a toast notification with details about what was updated:

- Number of tasks updated
- Number of new tasks created
- Number of statuses updated
- Number of new statuses created

## API Endpoint

### POST `/api/workspace/[workspaceId]/jira/sync`

**Request Body:**

```json
{
  "projectId": "project-uuid"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Jira data synced successfully",
  "data": {
    "tasksUpdated": 5,
    "tasksCreated": 2,
    "statusesUpdated": 1,
    "statusesCreated": 0
  }
}
```

## Error Handling

The sync feature includes comprehensive error handling:

- **Project Not Found**: Returns 404 if the project doesn't exist
- **Not a Jira Project**: Returns 400 if the project isn't a Jira project
- **Integration Not Found**: Returns 404 if Jira integration is missing
- **API Errors**: Returns 500 with detailed error messages for Jira API issues
- **Database Errors**: Returns 500 with database error details

## Logging

The sync process includes detailed logging for debugging:

- Sync start with project ID
- Project validation
- Jira API calls
- Data comparison results
- Success/failure status

## Usage

### Manual Sync

1. Navigate to a Jira project
2. Look for the "Sync" button in the project header (next to "Share" button)
3. Click the sync button
4. Wait for the sync to complete
5. Review the results in the toast notification

### When to Sync

- After updating story descriptions in Jira
- After changing issue statuses in Jira
- After adding new issues to the Jira project
- When you want to ensure your local data is up-to-date

## Technical Details

### Data Mapping

- **Tasks**: Updates name, description, status, priority, due date, and external data
- **Statuses**: Updates name, color, and external data
- **Projects**: Updates the `updated_at` timestamp

### Performance

- Syncs only the specific project, not all projects
- Uses efficient database queries with proper indexing
- Handles large datasets with pagination support
- Includes proper error handling and rollback mechanisms

### Security

- Validates workspace access before sync
- Uses stored API credentials securely
- Implements proper authentication checks
- Follows existing security patterns

## Future Enhancements

### Planned Features

- **Auto-sync**: Automatic background sync at regular intervals
- **Selective Sync**: Choose which data to sync (tasks, statuses, or both)
- **Conflict Resolution**: Handle conflicts when local and Jira data differ
- **Bi-directional Sync**: Push local changes back to Jira
- **Sync History**: Track sync operations and their results
- **Webhook Integration**: Real-time sync triggered by Jira webhooks

### Integration Support

- **Azure DevOps**: Similar sync functionality for Azure DevOps projects
- **Linear**: Sync support for Linear projects
- **Asana**: Sync support for Asana projects
- **GitHub Issues**: Sync support for GitHub Issues

## Troubleshooting

### Common Issues

1. **Sync Button Not Visible**

   - Ensure the project was imported from Jira
   - Check that the project has `type: "jira"` and a valid `external_id`

2. **Sync Fails with "Jira integration not found"**

   - Verify that Jira integration is set up for the workspace
   - Check that the integration is active (`is_active: true`)

3. **Sync Fails with API Errors**

   - Verify Jira API credentials are correct
   - Check that the API token has necessary permissions
   - Ensure the Jira domain is accessible

4. **No Data Updated**
   - Check if there are actual changes in Jira
   - Verify the Jira project key matches the local project
   - Review the sync logs for detailed information

### Debug Information

- Check browser console for client-side errors
- Review server logs for API endpoint errors
- Verify database connectivity and permissions
- Test Jira API credentials manually
