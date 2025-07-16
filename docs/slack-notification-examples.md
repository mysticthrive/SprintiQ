# Slack Notification Examples - Block Kit Design

## Overview

The Slack notification service has been updated to use Slack's Block Kit for modern, visually appealing notifications. This provides better structure, formatting, and user experience compared to plain text messages.

## New Block Kit Format

### Task Created Notification

```json
{
  "blocks": [
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "*🆕 New task created*\n*<app.sprintiq.ai|📋 Build a Signin Page>*"
      }
    },
    {
      "type": "context",
      "elements": [
        {
          "type": "mrkdwn",
          "text": "*🌐 Space:* E-commerce Platform"
        },
        {
          "type": "mrkdwn",
          "text": "*#️⃣ Project:* Front-end"
        },
        {
          "type": "mrkdwn",
          "text": "*👥 Assigned:* Unassigned"
        }
      ]
    },
    {
      "type": "divider"
    },
    {
      "type": "section",
      "fields": [
        {
          "type": "mrkdwn",
          "text": "*🟡 Priority:* High"
        },
        {
          "type": "mrkdwn",
          "text": "*🎯 Story Point:* 8 (pts)"
        },
        {
          "type": "mrkdwn",
          "text": "*💼 Business Value:* 4 / 5"
        },
        {
          "type": "mrkdwn",
          "text": "*🕒 Estimated Time:* 20 (h)"
        }
      ]
    }
  ]
}
```

### Task Updated Notification

```json
{
  "blocks": [
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "*✏️ Task updated*\n*<app.sprintiq.ai|📋 Implement User Authentication>*"
      }
    },
    {
      "type": "context",
      "elements": [
        {
          "type": "mrkdwn",
          "text": "*🌐 Space:* E-commerce Platform"
        },
        {
          "type": "mrkdwn",
          "text": "*#️⃣ Project:* Back-end"
        },
        {
          "type": "mrkdwn",
          "text": "*👥 Assigned:* John Developer"
        }
      ]
    },
    {
      "type": "divider"
    },
    {
      "type": "section",
      "fields": [
        {
          "type": "mrkdwn",
          "text": "*🔴 Priority:* Critical"
        },
        {
          "type": "mrkdwn",
          "text": "*🎯 Story Point:* 13 (pts)"
        },
        {
          "type": "mrkdwn",
          "text": "*💼 Business Value:* 5 / 5"
        },
        {
          "type": "mrkdwn",
          "text": "*🕒 Estimated Time:* 32 (h)"
        }
      ]
    },
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "*📊 Status*\n• In Progress"
      }
    },
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "*🔄 Change*\n• Status: `To Do` → `In Progress`"
      }
    },
    {
      "type": "context",
      "elements": [
        {
          "type": "mrkdwn",
          "text": "*By John Developer • 12/15/2024, 2:30:45 PM*"
        }
      ]
    }
  ]
}
```

### Task Commented Notification

```json
{
  "blocks": [
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "*💬 New comment*\n*<app.sprintiq.ai|📋 Design User Interface>*"
      }
    },
    {
      "type": "context",
      "elements": [
        {
          "type": "mrkdwn",
          "text": "*🌐 Space:* E-commerce Platform"
        },
        {
          "type": "mrkdwn",
          "text": "*#️⃣ Project:* Front-end"
        },
        {
          "type": "mrkdwn",
          "text": "*👥 Assigned:* Sarah Designer"
        }
      ]
    },
    {
      "type": "divider"
    },
    {
      "type": "section",
      "fields": [
        {
          "type": "mrkdwn",
          "text": "*🟡 Priority:* High"
        },
        {
          "type": "mrkdwn",
          "text": "*🎯 Story Point:* 5 (pts)"
        }
      ]
    },
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "*💬 Comment*\nI've completed the initial mockups for the signin page. Please review the design and let me know if any changes are needed."
      }
    },
    {
      "type": "context",
      "elements": [
        {
          "type": "mrkdwn",
          "text": "*By Sarah Designer • 12/15/2024, 3:15:22 PM*"
        }
      ]
    }
  ]
}
```

### Sprint Started Notification

```json
{
  "blocks": [
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "*🆕 Sprint started*\n*<app.sprintiq.ai|🏃 Sprint 1 - User Authentication>*"
      }
    },
    {
      "type": "context",
      "elements": [
        {
          "type": "mrkdwn",
          "text": "*🌐 Space:* E-commerce Platform"
        },
        {
          "type": "mrkdwn",
          "text": "*#️⃣ Project:* Full-stack"
        }
      ]
    },
    {
      "type": "divider"
    },
    {
      "type": "section",
      "fields": [
        {
          "type": "mrkdwn",
          "text": "*📅 Duration:* 2 weeks"
        },
        {
          "type": "mrkdwn",
          "text": "*🎯 Total Points:* 45"
        },
        {
          "type": "mrkdwn",
          "text": "*👥 Team Size:* 4 members"
        },
        {
          "type": "mrkdwn",
          "text": "*📊 Velocity:* 22.5 pts/week"
        }
      ]
    },
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "*📝 Description*\nThis sprint focuses on implementing user authentication features including signin, signup, password reset, and user profile management."
      }
    }
  ]
}
```

## Block Types Used

### 1. Section Block

Used for main content areas with text or fields.

```json
{
  "type": "section",
  "text": {
    "type": "mrkdwn",
    "text": "*Header text*"
  }
}
```

### 2. Context Block

Used for secondary information like metadata.

```json
{
  "type": "context",
  "elements": [
    {
      "type": "mrkdwn",
      "text": "*Label:* Value"
    }
  ]
}
```

### 3. Divider Block

Creates visual separation between sections.

```json
{
  "type": "divider"
}
```

### 4. Fields in Section Block

Used for displaying multiple key-value pairs in a grid layout.

```json
{
  "type": "section",
  "fields": [
    {
      "type": "mrkdwn",
      "text": "*Field 1:* Value 1"
    },
    {
      "type": "mrkdwn",
      "text": "*Field 2:* Value 2"
    }
  ]
}
```

## Emoji Usage

The notifications use consistent emojis for different types of information:

- **Events**: 🆕 (created), ✏️ (updated), 🗑️ (deleted), 💬 (commented)
- **Entities**: 📋 (task), 📝 (subtask), 📁 (project), 🏃 (sprint), 📂 (space)
- **Priority**: 🔴 (critical), 🟡 (high), 🔵 (medium), 🟢 (low)
- **Metadata**: 🌐 (space), #️⃣ (project), 🏃 (sprint), 👥 (assigned), 🎯 (story points), 💼 (business value), 🕒 (time), 📝 (description), 📊 (status), 💬 (comment), 🔄 (change)

## Benefits of Block Kit

### 1. Better Visual Structure

- Clear hierarchy with headers, context, and fields
- Consistent spacing and alignment
- Professional appearance

### 2. Improved Readability

- Structured information layout
- Easy to scan and understand
- Better use of Slack's formatting capabilities

### 3. Enhanced User Experience

- Clickable links to SprintiQ
- Rich formatting with emojis and markdown
- Responsive design that works across devices

### 4. Consistent Branding

- Unified design language
- Professional appearance
- Better integration with Slack's interface

## Implementation Details

The new format is implemented in the `SlackNotificationService.formatMessage()` method, which:

1. **Builds blocks array** based on notification data
2. **Includes fallback text** for accessibility
3. **Handles all entity types** (tasks, subtasks, projects, sprints, spaces)
4. **Supports all event types** (created, updated, deleted, commented)
5. **Conditionally includes sections** based on available metadata

## Migration Notes

The update is backward compatible:

- Existing integrations continue to work
- Fallback text ensures notifications are always delivered
- No changes required to channel mappings or settings
- Gradual rollout with no downtime
