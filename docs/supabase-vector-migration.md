# Migration from Pinecone to Supabase Vector Database

## Overview

This document outlines the migration from Pinecone to Supabase Vector Database for the TAWOS-enhanced AI story generation system. This migration provides better integration, improved performance, and cost savings.

## What Changed

### 1. Vector Database Service

- **Before**: Used Pinecone external service
- **After**: Uses Supabase pgvector extension

### 2. Service Files

- **Removed**: `lib/pinecone-service.ts`
- **Added**: `lib/supabase-vector-service.ts`

### 3. Dependencies

- **Removed**: `@pinecone-database/pinecone`
- **No new dependencies required** (uses existing Supabase client)

### 4. Environment Variables

- **Removed**: `PINECONE_API_KEY`
- **No changes needed** (uses existing Supabase configuration)

## Migration Steps

### 1. Database Setup

Run the migration script in your Supabase SQL editor:

```sql
-- Copy and paste the contents of scripts/create-tawos-vector-table.sql
```

This script will:

- Enable the pgvector extension
- Create the `tawos_user_stories` table
- Set up vector similarity search functions
- Create proper indexes for performance
- Configure Row Level Security policies

### 2. Code Changes

The migration has been completed automatically. All imports have been updated to use the new Supabase vector service:

```typescript
// Before
import { searchSimilarStories } from "@/lib/pinecone-service";

// After
import { searchSimilarStories } from "@/lib/supabase-vector-service";
```

### 3. Environment Variables

Remove the Pinecone API key from your environment:

```bash
# Remove this line from your .env file
PINECONE_API_KEY=your_pinecone_api_key
```

### 4. Dependencies

Update your dependencies:

```bash
# Remove Pinecone dependency
pnpm remove @pinecone-database/pinecone

# Install updated dependencies
pnpm install
```

## Benefits of Migration

### 1. Better Integration

- **Unified Database**: All data (user stories, vector embeddings, metadata) in one place
- **Consistent Authentication**: Uses existing Supabase auth system
- **Real-time Updates**: Changes are immediately available across the application

### 2. Improved Performance

- **Native Integration**: No network calls to external service
- **Optimized Queries**: Direct database access with proper indexing
- **Reduced Latency**: Faster vector similarity searches

### 3. Cost Savings

- **No External Service**: Eliminates Pinecone subscription costs
- **Included in Supabase**: Vector functionality included in existing Supabase plan
- **Predictable Pricing**: No per-request charges

### 4. Enhanced Features

- **Better Metadata Storage**: JSONB fields for flexible data structure
- **Automatic Timestamps**: Built-in created_at and updated_at tracking
- **Row Level Security**: Fine-grained access control

## Functionality Preserved

All existing functionality has been preserved:

- ✅ Vector similarity search
- ✅ TAWOS success pattern analysis
- ✅ Anti-pattern detection
- ✅ Team member assignment
- ✅ Story template generation
- ✅ Performance data analysis
- ✅ Story storage and retrieval

## API Compatibility

The public API remains unchanged. All function signatures and return types are identical:

```typescript
// These functions work exactly the same
const { results } = await searchSimilarStories(query, topK);
const { patterns, antiPatterns } = await getTAWOSSuccessPatterns(
  description,
  complexity
);
const { assignedMember } = await getOptimalTeamAssignment(story, teamMembers);
```

## Troubleshooting

### 1. Vector Extension Not Available

If you see an error about the vector extension:

```sql
-- Enable the pgvector extension in Supabase
CREATE EXTENSION IF NOT EXISTS vector;
```

### 2. Function Not Found

If the `match_documents` function is not found, run the migration script again:

```sql
-- Re-run the function creation
CREATE OR REPLACE FUNCTION match_documents(...)
```

### 3. Performance Issues

For large datasets, consider adjusting the index:

```sql
-- Recreate index with more lists for better performance
DROP INDEX IF EXISTS tawos_user_stories_embedding_idx;
CREATE INDEX tawos_user_stories_embedding_idx
ON tawos_user_stories
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 200);
```

## Rollback Plan

If you need to rollback to Pinecone:

1. Restore the original `lib/pinecone-service.ts` file
2. Update imports in `app/[workspaceId]/ai-actions.ts`
3. Re-add the Pinecone dependency
4. Restore the `PINECONE_API_KEY` environment variable

## Support

For issues with the migration:

1. Check the Supabase logs for database errors
2. Verify the pgvector extension is enabled
3. Ensure the migration script ran successfully
4. Check that all environment variables are set correctly

## Future Enhancements

With Supabase Vector Database, we can now easily add:

- **Multi-tenant Support**: Workspace-specific vector searches
- **Advanced Filtering**: Metadata-based filtering in vector queries
- **Real-time Analytics**: Live updates on story patterns
- **Custom Embeddings**: Support for different embedding models
- **Hybrid Search**: Combine vector similarity with text search
