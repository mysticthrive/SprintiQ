# Team Management Feature

## Overview

The Team Management feature allows workspace administrators to create and manage teams, assign members with specific roles and levels, and track team progress. This feature provides both a dashboard view for overview and a detailed list view for management.

## Features

### 1. Dashboard View

- **Statistics Cards**: Shows total teams, users, projects, and tasks
- **Task Assignment Chart**: Visual representation of assigned vs unassigned tasks
- **Task Completion Chart**: Shows completed vs in-progress tasks
- **Team Progress**: Progress bars for each team based on task completion

### 2. Team List View

- **Team Overview**: Shows all teams with member counts
- **Member Cards**: Displays team members with avatars, names, roles, and levels
- **Member Details**: Click on member cards to view detailed information
- **Add Members**: Add new members to teams with role and level assignments

### 3. Member Management

- **Registered Users**: Select from existing workspace users
- **Unregistered Users**: Add users by email (they can be invited later)
- **Role Assignment**: Assign specific roles (Front-end Developer, Back-end Developer, etc.)
- **Level Assignment**: Assign experience levels (Junior, Mid-Level, Senior, etc.)

### 4. AI Assistant

- **Project-Based Suggestions**: Describe your project idea and get AI-generated team member suggestions
- **Automatic Role Assignment**: AI suggests appropriate roles based on project requirements
- **Default Level**: All AI-generated members are set to Mid-Level by default
- **Customizable**: Admins can modify names, emails, and levels before adding

## Database Schema

### Tables

#### `teams`

- `id`: Primary key
- `name`: Team name
- `description`: Team description (optional)
- `workspace_id`: Foreign key to workspace
- `created_at`, `updated_at`: Timestamps

#### `team_members`

- `id`: Primary key
- `team_id`: Foreign key to team
- `user_id`: Foreign key to user profile (null for unregistered users)
- `email`: Email address (for unregistered users)
- `role_id`: Foreign key to role
- `level_id`: Foreign key to level
- `description`: Member description (optional)
- `is_registered`: Boolean indicating if user is registered
- `created_at`: Timestamp

#### `roles`

- `id`: Primary key
- `name`: Role name (e.g., "Front-end Developer")
- `description`: Role description
- `created_at`, `updated_at`: Timestamps

#### `levels`

- `id`: Primary key
- `name`: Level name (e.g., "Mid-Level")
- `description`: Level description
- `created_at`, `updated_at`: Timestamps

## Usage

### Creating a Team

1. Navigate to the Teams page
2. Click the "+" button in the sidebar
3. Enter team name and optional description
4. Click "Create Team"

### Adding Members

1. In the Team List view, click "Add Member" on any team
2. Choose between registered or unregistered user
3. For registered users: Select from existing users
4. For unregistered users: Enter email address
5. Select role and level
6. Add optional description
7. Click "Add Member"

### Using AI Assistant

1. Click "AI Assistant" button on any team
2. Describe your project idea in detail
3. Click "Generate Team Members"
4. Review suggested members
5. Select desired members
6. Modify names, emails, or levels if needed
7. Click "Add Members"

### Viewing Member Details

1. Click on any member card in the Team List view
2. View detailed information including:
   - Avatar and basic info
   - Role and level details
   - Description
   - Member since date

## Default Data

The system comes with pre-seeded roles and levels:

### Roles

- Front-end Developer
- Back-end Developer
- Full-stack Developer
- UI/UX Designer
- Product Manager
- Project Manager
- DevOps Engineer
- QA Engineer
- Data Scientist
- Business Analyst
- Marketing Specialist
- Sales Representative
- Content Writer
- Graphic Designer
- System Administrator

### Levels

- Junior (0-2 years)
- Mid-Level (2-5 years)
- Senior (5+ years)
- Lead
- Principal
- Architect
- Manager
- Director
- VP
- C-Level

## Navigation

The Teams feature is accessible via the "Team" link in the main sidebar, which navigates to `/[workspaceId]/teams`.

## Permissions

Currently, all workspace members can view teams, but only workspace administrators can create teams and add members. This can be extended with more granular permissions in the future.
