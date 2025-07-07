# TAWOS Training Guide

## Overview

This guide explains how to train TAWOS (Team-Aware Work Optimization System) data from JSON files to the Supabase Vector Database. The training process converts Jira issues into user stories with embeddings for AI-powered story generation.

## Prerequisites

### 1. Environment Setup

Ensure you have the following environment variables configured:

```bash
# OpenAI API Key (required for embeddings)
OPENAI_API_KEY=your_openai_api_key

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

**Note:** The system uses OpenAI's `text-embedding-ada-002` model for generating high-quality 1536-dimensional embeddings that are fully compatible with Supabase's pgvector extension.

### 2. Database Setup

Run the vector database migration script first. We provide three options depending on your pgvector environment:

#### Option A: HNSW Index (Recommended - Best Performance)

```sql
-- Execute in Supabase SQL Editor
-- Copy contents from scripts/create-tawos-vector-table.sql
```

#### Option B: IVFFlat Index (Good Performance)

```sql
-- Execute in Supabase SQL Editor
-- Copy contents from scripts/create-tawos-vector-table-fallback.sql
```

#### Option C: No Vector Index (Guaranteed to Work)

```sql
-- Execute in Supabase SQL Editor
-- Copy contents from scripts/create-tawos-vector-table-simple.sql
```

**Note:** If you encounter errors with the first two options, use Option C. It will work in all pgvector environments but similarity searches will be slower.

### 3. Dependencies

Install required dependencies:

```bash
pnpm install
```

## Data Format

### Input JSON Structure

Your TAWOS data should be in the following JSON format:

```json
[
  {
    "ID": 1,
    "Jira_ID": 1001,
    "Issue_Key": "AUTH-001",
    "URL": "https://jira.example.com/rest/api/2/issue/1001",
    "Title": "Implement Google OAuth authentication",
    "Description": "Add Google OAuth 2.0 authentication to allow users to sign in with their Google accounts",
    "Description_Text": "Users should be able to authenticate using their Google accounts. This includes setting up OAuth 2.0 flow, handling callbacks, and storing user information securely.",
    "Description_Code": "",
    "Type": "Feature",
    "Priority": "High",
    "Status": "Done",
    "Resolution": "Fixed",
    "Creation_Date": "2024-01-15 09:00:00",
    "Estimation_Date": "2024-01-15 10:00:00",
    "Resolution_Date": "2024-01-20 16:30:00",
    "Last_Updated": "2024-01-20 16:30:00",
    "Story_Point": 8,
    "Timespent": 32,
    "In_Progress_Minutes": 1920,
    "Total_Effort_Minutes": 1920,
    "Resolution_Time_Minutes": 1920,
    "Title_Changed_After_Estimation": 0,
    "Description_Changed_After_Estimation": 0,
    "Story_Point_Changed_After_Estimation": 0,
    "Pull_Request_URL": "https://github.com/example/repo/pull/123",
    "Creator_ID": 1,
    "Reporter_ID": 1,
    "Assignee_ID": 2,
    "Project_ID": 1,
    "Sprint_ID": 1
  }
]
```

### Required Fields

- **ID**: Unique identifier
- **Issue_Key**: Jira issue key (e.g., "AUTH-001")
- **Title**: Issue title
- **Description_Text**: Detailed description
- **Type**: Issue type (Feature, Bug, Enhancement, Task)
- **Priority**: Priority level (Critical, High, Medium, Low)
- **Status**: Current status (Done, In Progress, To Do)
- **Resolution**: Resolution status (Fixed, Won't Fix, etc.)
- **Story_Point**: Story point estimation
- **Total_Effort_Minutes**: Total effort in minutes

## Training Process

### 1. Using the Shell Script (Recommended)

```bash
# Make the script executable
chmod +x scripts/run-tawos-training.sh

# Run training with your JSON file
./scripts/run-tawos-training.sh path/to/your/tawos-data.json
```

### 2. Using the TypeScript Script Directly

```bash
# Run the training script directly
npx tsx scripts/train-tawos-data.ts path/to/your/tawos-data.json
```

### 3. Example Usage

```bash
# Train with sample data
./scripts/run-tawos-training.sh public/sample-tawos-dataset.json

# Train with your own data
./scripts/run-tawos-training.sh data/my-project-tawos.json
```

## What Happens During Training

### 1. Data Conversion

The training script converts each Jira issue into a user story with:

- **Role**: Extracted from issue type and description
- **Want**: What the user wants to accomplish
- **Benefit**: Why they want it
- **Acceptance Criteria**: Generated based on issue type
- **Business Value**: Calculated from priority and type
- **Tags**: Extracted from content analysis
- **Complexity**: Determined from story points and effort

### 2. Embedding Generation

For each story, the script:

1. Creates a text representation combining title, description, role, want, benefit, and tags
2. Generates a 1536-dimensional embedding using OpenAI API
3. Stores the embedding with metadata in Supabase

**Note:** We use OpenAI's `text-embedding-ada-002` model for generating high-quality 1536-dimensional embeddings that are fully compatible with Supabase's pgvector extension.

### 3. Pattern Analysis

The script analyzes patterns to create:

- **Success Patterns**: Based on completed issues
- **Anti-patterns**: Based on failed or problematic issues
- **Completion Rates**: Calculated from status and resolution
- **Complexity Classification**: Simple, moderate, or complex

## Output Structure

### Vector Database Records

Each trained story is stored with:

```typescript
{
  id: string;
  embedding: number[]; // 1536-dimensional vector (text-embedding-ada-002)
  metadata: {
    title: string;
    description: string;
    role: string;
    want: string;
    benefit: string;
    acceptanceCriteria: string[];
    storyPoints: number;
    businessValue: number;
    priority: string;
    tags: string[];
    estimatedTime: number;
    completionRate: number;
    successPattern: string;
    antiPatterns: string[];
    originalIssueKey: string;
    originalType: string;
    originalStatus: string;
    resolutionTime: number;
    totalEffort: number;
    complexity: "simple" | "moderate" | "complex";
  };
  created_at: string;
  updated_at: string;
}
```

## Training Configuration

### Batch Processing

The training script processes data in batches to:

- Avoid OpenAI API rate limits
- Provide progress feedback
- Handle large datasets efficiently

Default batch size: 50 stories

### Rate Limiting

- 2-second delay between batches
- 30-second timeout for embedding generation
- Automatic retry logic for failed requests

## Monitoring and Verification

### 1. Check Training Progress

The script provides real-time feedback:

```
🚀 TAWOS Vector Database Training Script
========================================

[INFO] Checking environment variables...
[SUCCESS] Environment variables are properly configured
[INFO] Processing batch 1/3 (50 stories)
[SUCCESS] Successfully stored 48 stories from batch 1
[INFO] Processing batch 2/3 (50 stories)
[SUCCESS] Successfully stored 50 stories from batch 2
[INFO] Processing batch 3/3 (25 stories)
[SUCCESS] Successfully stored 25 stories from batch 3

🎉 Training completed!
📊 Total issues processed: 125
✅ Successfully stored: 123 stories
❌ Failed: 2 stories
```

### 2. Verify in Supabase Dashboard

1. Go to your Supabase dashboard
2. Navigate to Table Editor
3. Check the `tawos_user_stories` table
4. Verify that records have been created with embeddings

### 3. Test Vector Search

Use the Supabase SQL editor to test:

```sql
-- Test vector similarity search
SELECT
  metadata->>'title' as title,
  metadata->>'role' as role,
  similarity
FROM match_documents(
  (SELECT embedding FROM tawos_user_stories LIMIT 1),
  0.7,
  5
);
```

## Troubleshooting

### Common Issues

#### 1. API Errors

```
❌ Error generating embedding: OpenAI API error: 429
```

**Solution**:

- Verify your API key (OPENAI_API_KEY)
- Ensure you have sufficient credits
- Wait for rate limits to reset
- Ensure the API key has the correct permissions

#### 2. Supabase Connection Errors

```
❌ Error storing batch: connection error
```

**Solution**:

- Verify Supabase URL and service role key
- Check network connectivity
- Ensure the `tawos_user_stories` table exists

#### 3. Invalid JSON Format

```
❌ Invalid JSON file: data.json
```

**Solution**:

- Validate JSON syntax using a JSON validator
- Ensure the file contains an array of objects
- Check for missing required fields

#### 4. Memory Issues with Large Files

```
❌ JavaScript heap out of memory
```

**Solution**:

- Process data in smaller chunks
- Increase Node.js memory limit: `NODE_OPTIONS="--max-old-space-size=4096"`
- Split large JSON files into smaller files

#### 5. pgvector Dimension Limitations

```
❌ ERROR: column cannot have more than 2000 dimensions for ivfflat index
```

**Solution**:

- We've already configured the system to use `text-embedding-ada-002` (1536 dimensions) instead of `text-embedding-3-large` (3072 dimensions)
- If you encounter this error, use the fallback SQL script: `scripts/create-tawos-vector-table-fallback.sql`
- The ada-002 model provides excellent performance and is fully compatible with pgvector

### Performance Optimization

#### 1. Large Datasets

For datasets with >1000 issues:

```bash
# Increase memory limit
NODE_OPTIONS="--max-old-space-size=8192" ./scripts/run-tawos-training.sh data.json
```

#### 2. Parallel Processing

Modify the script to process embeddings in parallel:

```typescript
// In train-tawos-data.ts, increase concurrency
const embeddings = await Promise.all(
  batch.texts.map((text) => generateEmbedding(text))
);
```

## Best Practices

### 1. Data Quality

- **Clean your data**: Remove duplicates and invalid entries
- **Validate fields**: Ensure required fields are present
- **Normalize text**: Remove special characters and standardize formatting

### 2. Training Strategy

- **Start small**: Test with a subset of data first
- **Monitor costs**: Track OpenAI API usage
- **Validate results**: Check generated stories for quality

### 3. Maintenance

- **Regular updates**: Retrain with new data periodically
- **Version control**: Keep track of training data versions
- **Backup**: Export trained data for backup

## Advanced Usage

### Custom Training Scripts

You can create custom training scripts for specific use cases:

```typescript
// Custom training with specific filters
const filteredIssues = issues.filter(
  (issue) => issue.Type === "Feature" && issue.Status === "Done"
);

// Custom embedding text generation
const customText = `${issue.Title} ${issue.Description_Text} ${issue.Type}`;
```

### Batch Training

Train multiple datasets:

```bash
#!/bin/bash
for file in data/*.json; do
  echo "Training $file..."
  ./scripts/run-tawos-training.sh "$file"
done
```

### Integration with CI/CD

Add training to your deployment pipeline:

```yaml
# .github/workflows/train-tawos.yml
name: Train TAWOS Data
on:
  push:
    paths: ["data/**"]
jobs:
  train:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: pnpm install
      - run: ./scripts/run-tawos-training.sh data/latest.json
```

## Support

For issues with training:

1. Check the troubleshooting section above
2. Verify your environment variables
3. Test with the sample dataset first
4. Check Supabase logs for database errors
5. Monitor OpenAI API usage and limits

## Next Steps

After successful training:

1. **Test AI Story Generation**: Use the trained data to generate new stories
2. **Monitor Performance**: Track vector search performance and accuracy
3. **Iterate**: Refine the training process based on results
4. **Scale**: Train with larger datasets as needed
