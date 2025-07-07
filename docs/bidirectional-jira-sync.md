# Bidirectional Jira Sync

This document describes the bidirectional synchronization feature between the local database and Jira, including the workflow, conflict resolution, and data conversion.

## Overview

The bidirectional sync ensures that data is synchronized between the local database and Jira in both directions, with proper conflict detection and resolution.

## Sync Workflow

The sync follows this exact workflow:

1. **Pull from Jira** - Get existing data from Jira and update local database
2. **Push to Jira** - Push local changes to Jira (new tasks and updates)
3. **Cleanup** - Remove invalid tasks (type "jira" with null/empty external_id)
4. **Pull from Jira again** - Get updated data from Jira after our changes
5. **Save** - Finalize the sync

## Data Conversion

### HTML to Jira Format Conversion

When pushing task descriptions to Jira, the system automatically converts HTML content to Jira's markup format:

#### Supported HTML Elements:

- **Headers**: `<h1>`, `<h2>`, `<h3>`, `<h4>`, `<h5>`, `<h6>` → `h1.`, `h2.`, etc.
- **Bold**: `<b>`, `<strong>` → `*text*`
- **Italic**: `<i>`, `<em>` → `_text_`
- **Underline**: `<u>` → `+text+`
- **Strikethrough**: `<s>`, `<strike>`, `<del>` → `-text-`
- **Monospace**: `<code>`, `<tt>` → `{{text}}`
- **Paragraphs**: `<p>` → Line breaks
- **Line breaks**: `<br>` → `\n`
- **Lists**: `<ul>`, `<ol>`, `<li>` → `* item` or `1. item`
- **Links**: `<a href="url">text</a>` → `[text|url]`
- **Blockquotes**: `<blockquote>` → `bq. text`
- **Preformatted**: `<pre>` → `{code}...{code}`
- **Tables**: `<table>`, `<tr>`, `<td>`, `<th>` → `||header||` format

#### Example Conversions:

**Example 1:**

```html
<p><b>bbbbbbbbbbbbbbbbbbbbbb</b></p>
```

Converts to:

```
*bbbbbbbbbbbbbbbbbbbbbb*
```

**Example 2:**

```html
## User Story As a **registered user**, I want **to view and manage all active
sessions on my account**, so that **I can monitor account access and revoke
suspicious sessions**. ## Acceptance Criteria - User can view list of active
sessions with device, location, and timestamp - User can revoke individual
sessions or all sessions except current - System logs session activity for last
30 days - User receives email notification for new device logins ## Story
Details - **Story Points**: 5 - **Business Value**: 2/5 - **Priority**: Low ##
AI Generated This task was generated using AI story generation and may require
review and refinement.
```

Converts to:

```
h2. User Story
As a *registered user*, I want *to view and manage all active sessions on my account*, so that *I can monitor account access and revoke suspicious sessions*.

h2. Acceptance Criteria
* User can view list of active sessions with device, location, and timestamp
* User can revoke individual sessions or all sessions except current
* System logs session activity for last 30 days
* User receives email notification for new device logins

h2. Story Details
* *Story Points*: 5
* *Business Value*: 2/5
* *Priority*: Low

h2. AI Generated
This task was generated using AI story generation and may require review and refinement.
```

### Jira to Local Format Conversion

When pulling data from Jira, the system converts Jira's document format to plain text for local storage.

## Task Types and Sync Behavior

### Task Types:

- **"default"**: Local tasks that can be pushed to Jira
- **"jira"**: Tasks that originated from Jira or have been synced to Jira

### Sync Rules:

1. **New tasks** (type "default" or "jira" with null/empty external_id):

   - Pushed to Jira as new issues
   - Converted to type "jira" after successful creation
   - Assigned external_id from Jira response

2. **Existing Jira tasks** (type "jira" with external_id):

   - Only pushed if `pending_sync: true`
   - Updates summary, description, priority, and status
   - Description is converted from HTML to Jira format

3. **Invalid tasks** (type "jira" with null/empty external_id):
   - Automatically deleted during cleanup phase
   - Prevents sync loops and data corruption

## Conflict Detection and Resolution

### Conflict Detection:

The system detects conflicts by comparing timestamps:

- **Local changes**: `updated_at > last_synced_at`
- **Jira changes**: `jira_updated > last_synced_at`
- **Conflict**: Both conditions are true

### Resolution Strategies:

- **"local"**: Keep local changes, mark as synced
- **"remote"**: Override with Jira changes
- **"manual"**: Require manual intervention (default)

## Sync Status Tracking

### Task Sync Status:

- **"pending"**: Changes detected, waiting for sync
- **"synced"**: Successfully synchronized
- **"failed"**: Sync failed, error details in external_data

### Pending Sync Detection:

- Tasks with `pending_sync: true` are included in push operations
- Status changes, priority updates, and content edits trigger pending sync

## API Methods

### Main Sync Method:

```typescript
async performBidirectionalSync(options: SyncOptions): Promise<SyncResult>
```

### Utility Methods:

- `markTaskForSync(taskId: string)`: Mark task for sync
- `getSyncStatus()`: Get pending sync status
- `getDetailedSyncStatus()`: Get comprehensive sync status
- `validateSyncState()`: Check for sync issues
- `cleanupInvalidTasksManually()`: Manual cleanup
- `testHtmlToJiraConversion()`: Test HTML conversion

## Error Handling

### Sync Failures:

- Individual task failures don't stop the entire sync
- Failed tasks are marked with `sync_status: "failed"`
- Error details stored in `external_data.last_sync_error`

### Recovery:

- `resetFailedSyncs()`: Retry failed syncs
- `validateSyncState()`: Identify and fix sync issues

## Best Practices

1. **Regular Syncs**: Run sync regularly to minimize conflicts
2. **Monitor Status**: Check sync status before and after operations
3. **Handle Conflicts**: Review and resolve conflicts promptly
4. **Clean Data**: Use cleanup methods to maintain data integrity
5. **Test Changes**: Use test methods to verify conversions

## Troubleshooting

### Common Issues:

1. **Duplicate tasks**: Use cleanup methods to remove invalid tasks
2. **Sync loops**: Ensure proper external_id assignment
3. **Format issues**: Verify HTML to Jira conversion
4. **API errors**: Check Jira credentials and permissions

### Debug Methods:

- `debugTaskMatching()`: Check task matching between systems
- `testCleanupInvalidTasks()`: Test cleanup functionality
- `testHtmlToJiraConversion()`: Verify format conversion
