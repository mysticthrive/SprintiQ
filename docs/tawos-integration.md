# TAWOS Integration for Story Generation

This document describes the integration of TAWOS (The Agile Way of Software) data with the AI story generation system.

## Overview

The TAWOS integration enhances the AI story generation by:

### 1. Data Training

- Process TAWOS datasets from Jira exports
- Extract success patterns and anti-patterns
- Generate embeddings for similarity search

### 2. Story Generation

- Generate user stories with TAWOS patterns
- Team member assignment based on skills
- Priority scoring and estimation

## Components

1. **TAWOS Training Interface** (`components/workspace/ai/tawos-training-interface.tsx`)

   - File upload and processing
   - Training progress tracking
   - Data validation and analysis

2. **TAWOS Training Service** (`lib/tawos-training-service.ts`)

   - Data processing and conversion
   - Embedding generation
   - Vector database operations

3. **Story Generator** (Main agents page)
   - Story generation with TAWOS patterns
   - Team member assignment
   - Sprint planning integration

## Usage

### Step 1: Train TAWOS Data

1. Navigate to the AI Agents page
2. Click "Train Data" button
3. Upload your TAWOS dataset (JSON format)
4. Wait for training to complete

### Step 2: Generate Stories

1. Use the main story generation form
2. Configure your story parameters
3. Click "Generate Stories"
4. Stories will be generated using TAWOS patterns

## TAWOS Dataset Format

Your TAWOS dataset should be a JSON array with the following structure:

```json
[
  {
    "ID": 1,
    "Jira_ID": 1001,
    "Issue_Key": "AUTH-001",
    "Title": "Implement Google OAuth authentication",
    "Description": "Add Google OAuth 2.0 authentication",
    "Description_Text": "Users should be able to authenticate using their Google accounts...",
    "Type": "Feature",
    "Priority": "High",
    "Status": "Done",
    "Story_Point": 8,
    "Timespent": 32,
    "In_Progress_Minutes": 1920,
    "Total_Effort_Minutes": 1920,
    "Resolution_Time_Minutes": 1920,
    "Creation_Date": "2024-01-15 09:00:00",
    "Estimation_Date": "2024-01-15 10:00:00",
    "Resolution_Date": "2024-01-20 16:30:00",
    "Creator_ID": 1,
    "Reporter_ID": 1,
    "Assignee_ID": 2,
    "Project_ID": 1,
    "Sprint_ID": 1
  }
]
```

## Enhanced Story Structure

Generated stories include:

```typescript
interface EnhancedUserStory {
  id: string;
  title: string;
  role: string;
  want: string;
  benefit: string;
  acceptanceCriteria: string[];
  storyPoints: number;
  businessValue: number;
  priority: "Low" | "Medium" | "High" | "Critical";
  tags: string[];
  subtasks: Subtask[];
  suggestedTeamMembers: TeamMemberSuggestion[];
  estimatedEffort: {
    totalHours: number;
    breakdown: {
      frontend?: number;
      backend?: number;
      testing?: number;
      design?: number;
      devops?: number;
    };
  };
  dependencies: string[];
  complexity: "simple" | "moderate" | "complex";
  riskLevel: "low" | "medium" | "high";
}
```

## Team Assignment Logic

The system assigns team members based on:

1. **Role Matching**: Matches task requirements to team member roles
2. **Experience Level**: Assigns appropriate complexity to experience levels
   - Junior: 1-3 story points, simple tasks
   - Mid-Level: 3-8 story points, moderate complexity
   - Senior: 5-13 story points, complex tasks
3. **Skill Matching**: Considers team member skills for task assignment
4. **Workload Balancing**: Distributes work evenly across available team members
5. **Availability**: Checks current workload and availability

## Example: Email Authentication Feature

When you input "Email Authentication", the system generates:

### Main Story: Email Authentication System

- **Story Points**: 13
- **Priority**: High
- **Complexity**: Complex
- **Estimated Effort**: 40 hours

### Subtasks:

1. **Google OAuth Integration** (8h, Frontend Developer - Mid-Level)
2. **Facebook OAuth Integration** (6h, Frontend Developer - Mid-Level)
3. **Backend Authentication Service** (12h, Backend Developer - Senior)
4. **Database Schema Design** (4h, Backend Developer - Mid-Level)
5. **Security Implementation** (6h, Backend Developer - Senior)
6. **UI/UX Design** (4h, UI/UX Designer - Mid-Level)

### Team Assignment:

- **Frontend Developer (Mid-Level)**: 14 hours
- **Backend Developer (Senior)**: 18 hours
- **Backend Developer (Mid-Level)**: 4 hours
- **UI/UX Designer (Mid-Level)**: 4 hours

## Benefits

1. **Improved Accuracy**: TAWOS training provides real-world data for better estimation
2. **Automatic Breakdown**: Complex features are automatically broken into manageable subtasks
3. **Optimal Team Assignment**: Work is distributed based on skills and availability
4. **Risk Assessment**: System identifies potential risks and complexity levels
5. **Effort Estimation**: Detailed time estimates for better project planning

## Setup Instructions

### 1. Database Migration

Run the TAWOS table creation script:

```bash
psql -d your_database -f scripts/create-tawos-tables.sql
```

### 2. Environment Variables

Ensure you have the Claude API key configured:

```env
CLAUDE_API_KEY=your_claude_api_key_here
```

### 3. Access the Interface

Navigate to: `/workspace/[workspaceId]/agents`

## Troubleshooting

### Common Issues

1. **Dataset Upload Fails**

   - Ensure your JSON file is valid
   - Check that the dataset contains the required fields
   - Verify file size (should be under 10MB)

2. **No Team Members Found**

   - Add team members to your workspace first
   - Ensure team members have assigned roles and levels
   - Check that team members are active

3. **Story Generation Fails**
   - Verify Claude API key is configured
   - Check that you have training data uploaded
   - Ensure you have team members in your workspace

### Support

For issues or questions about the TAWOS integration, please refer to the main documentation or contact the development team.
