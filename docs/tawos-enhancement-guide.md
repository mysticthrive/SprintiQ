# TAWOS AI Story Generator

The TAWOS AI Story Generator is a sophisticated system that combines Supabase Vector Database with Claude API to generate high-quality user stories based on successful project patterns. The system includes:

## Features

### 1. TAWOS Data Training

- Upload and process TAWOS datasets
- Extract success patterns and anti-patterns
- Generate embeddings for similarity search

### 2. Story Generation

- Generate user stories with TAWOS patterns
- Team member assignment based on skills
- Priority scoring and estimation

## Key Features

### 1. Supabase Vector Database Integration

- **Vector Search**: Searches for similar successful stories in the TAWOS dataset using pgvector
- **Success Pattern Analysis**: Identifies patterns that lead to high completion rates
- **Anti-pattern Detection**: Flags common failure patterns to avoid
- **Real-time Updates**: Stores and retrieves story patterns in real-time

### 2. Enhanced Story Generation

- **Claude API Integration**: Uses Claude Opus 4 for intelligent story generation
- **TAWOS Context**: Incorporates successful patterns and anti-patterns into prompts
- **Structured Output**: Generates stories in the exact "As a... I want... So that..." format
- **Priority Scoring**: Calculates business value and priority based on configurable weights

### 3. Team Member Management

- **Skill-Based Assignment**: Automatically assigns stories to team members based on skills
- **Level Matching**: Considers complexity and priority when matching team member levels
- **Role Alignment**: Aligns stories with appropriate team roles
- **Workload Balancing**: Considers availability and current workload

### 4. Sprint Assistant

- **Velocity Calculation**: Estimates team velocity based on member levels and availability
- **Capacity Planning**: Calculates sprint capacity and story distribution
- **FBI Sentinel Detection**: Identifies anti-patterns in sprint planning
- **Recommendations**: Provides actionable recommendations for sprint optimization

### 5. FBI Sentinel Anti-pattern Detection

- **Requirements Confusion**: Detects vague or unclear requirements
- **Scope Overload**: Identifies stories with too many features
- **Missing Dependencies**: Flags potential dependency issues
- **Unrealistic Estimates**: Detects overly optimistic time estimates

## Configuration

### Environment Variables

```bash
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
CLAUDE_API_KEY=your_claude_api_key
```

### Database Setup

1. Enable the pgvector extension in your Supabase project
2. Run the migration script: `scripts/create-tawos-vector-table.sql`
3. The script will create:
   - `tawos_user_stories` table with vector support
   - Vector similarity search function
   - Proper indexes for performance
   - Row Level Security policies

### Priority Weights

The system uses configurable weights for priority calculation:

- **Business Value** (30%): Impact on business goals and revenue
- **User Impact** (25%): Effect on user experience and satisfaction
- **Complexity** (20%): Technical difficulty and implementation effort
- **Risk** (15%): Potential issues and uncertainties
- **Dependencies** (10%): Reliance on other components or systems

## Usage

### 1. Story Generation

```typescript
const params = {
  featureDescription:
    "As a Product Manager, I want to generate user stories using AI, so that I can quickly create high-quality backlogs",
  numberOfStories: 5,
  complexity: "moderate",
  workspaceId: "workspace-id",
  priorityWeights: DEFAULT_WEIGHTS,
  teamMembers: teamMembers,
  useTAWOS: true,
};

const { stories, error } = await generateTAWOSStories(params);
```

### 2. Team Member Assignment

```typescript
const assignment = getOptimalTeamAssignment(story, teamMembers);
// Returns: { assignedMember, reason, confidence }
```

### 3. Sprint Planning

```typescript
const { sprint, error } = await createSprintFromStories(
  stories,
  teamMembers,
  2
);
```

## Story Structure

Generated stories include the following fields:

- **title**: Concise story title
- **role**: Specific user role
- **want**: Specific capability or feature
- **benefit**: Clear business or user benefit
- **acceptanceCriteria**: Array of specific, measurable criteria
- **storyPoints**: Fibonacci sequence estimate (1, 2, 3, 5, 8, 13)
- **businessValue**: Score from 1-5
- **priority**: Critical/High/Medium/Low
- **tags**: Technical skills required
- **requirements**: Specific implementation requirements
- **estimatedTime**: Time estimate in hours
- **description**: Detailed description
- **antiPatternWarnings**: Array of potential issues to avoid
- **successPattern**: Recommended approach for success
- **completionRate**: Historical completion rate (0-1)
- **velocity**: Estimated velocity for this story type

## Migration from Pinecone

This system has been migrated from Pinecone to Supabase Vector Database for better integration and cost efficiency. The migration includes:

1. **Replaced Pinecone client** with Supabase pgvector functions
2. **Updated all vector operations** to use Supabase's vector similarity search
3. **Maintained all existing functionality** including team assignment and pattern analysis
4. **Improved performance** with native database integration
5. **Reduced costs** by eliminating external vector database service

## Database Schema

The `tawos_user_stories` table structure:

```sql
CREATE TABLE tawos_user_stories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    embedding vector(3072), -- OpenAI text-embedding-3-large vectors
    metadata JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

The metadata JSONB field stores all story information including:

- title, description, role, want, benefit
- acceptanceCriteria, storyPoints, businessValue
- priority, tags, requirements, estimatedTime
- completionRate, successPattern, antiPatterns
- assignedTeamMember, and other TAWOS-specific fields

## Anti-pattern Detection

### FBI Sentinel Anti-patterns

1. **Requirements Confusion**

   - Vague words: "maybe", "possibly", "might", "could", "should"
   - Insufficient acceptance criteria (< 3 criteria)
   - Non-specific, non-measurable criteria

2. **Scope Overload**

   - Multiple features in single story
   - Excessive use of "and", "also", "additionally"
   - Too many acceptance criteria (> 5)

3. **Missing Dependencies**

   - Implied dependencies without explicit declaration
   - Sequential requirements without dependency mapping

4. **Unrealistic Estimates**
   - Words like "quick", "fast", "simple", "easy", "just", "only"
   - Story points not following Fibonacci sequence
   - Time estimates not aligned with complexity

## Team Assignment Algorithm

### Scoring Factors

1. **Skill Matching** (60% weight)

   - Direct skill matches
   - Partial skill matches
   - Role-aligned skills

2. **Level Matching** (30% weight)

   - Complexity requirements
   - Priority requirements
   - Team member experience level

3. **Role Alignment** (10% weight)
   - Role-specific skill requirements
   - Functional area alignment

### Confidence Calculation

- **Skill Match Percentage**: 60% of confidence
- **Level Match**: 30% of confidence
- **Role Match**: 10% of confidence

## Sprint Planning Features

### Velocity Calculation

- Base velocity per team member: 8 story points/sprint
- Level multipliers: Junior (0.6), Mid (1.0), Senior (1.4), Lead (1.2)
- Availability factor: hours available / 40 hours

### Capacity Planning

- Sprint capacity = Team velocity × Sprint duration
- Story distribution by priority and complexity
- Overload detection (>120% capacity)

### Warnings and Recommendations

- **Overload Risk**: When total story points exceed capacity
- **Velocity Variation**: When team velocity varies significantly
- **Critical Story Overload**: Too many critical stories
- **Large Story Detection**: Stories > 8 points
- **Skill Overload**: Heavy use of specific skills
- **Dependency Issues**: Stories with dependencies

## Best Practices

### Story Writing

1. Use specific, measurable acceptance criteria
2. Follow the exact "As a... I want... So that..." format
3. Keep stories focused on single features
4. Use realistic story point estimates
5. Include relevant technical tags

### Team Management

1. Maintain accurate skill profiles
2. Update availability regularly
3. Track velocity over time
4. Balance workload across team members
5. Consider pairing for knowledge transfer

### Sprint Planning

1. Limit critical stories to 1-2 per sprint
2. Break large stories (>8 points) into smaller pieces
3. Consider dependencies when sequencing stories
4. Monitor skill distribution across stories
5. Review anti-pattern warnings before committing

## Troubleshooting

### Common Issues

1. **No TAWOS patterns found**: Check Pinecone API key and index
2. **Poor team assignments**: Verify team member skills and levels
3. **Sprint overload**: Reduce story count or extend sprint duration
4. **Anti-pattern warnings**: Review and refine story descriptions

### Performance Optimization

1. Cache TAWOS patterns for similar features
2. Batch team assignments for multiple stories
3. Pre-calculate team velocity
4. Use incremental updates for sprint planning

## API Reference

### generateTAWOSStories(params)

Generates user stories with TAWOS enhancement.

**Parameters:**

- `featureDescription`: String describing the feature
- `numberOfStories`: Number of stories to generate (default: 3)
- `complexity`: "simple" | "moderate" | "complex" (default: "moderate")
- `priorityWeights`: PriorityWeights object
- `teamMembers`: Array of TeamMember objects
- `workspaceId`: Workspace identifier
- `useTAWOS`: Boolean to enable TAWOS features (default: true)

**Returns:**

- `stories`: Array of UserStory objects
- `error`: Error message if generation fails

### getOptimalTeamAssignment(story, teamMembers)

Assigns a story to the optimal team member.

**Parameters:**

- `story`: Story object with title, description, tags, complexity, priority
- `teamMembers`: Array of TeamMember objects

**Returns:**

- `assignedMember`: Best matching team member or null
- `reason`: Explanation of the assignment
- `confidence`: Confidence score (0-1)

### createSprintFromStories(stories, teamMembers, duration)

Creates a sprint plan from stories.

**Parameters:**

- `stories`: Array of UserStory objects
- `teamMembers`: Array of TeamMember objects
- `duration`: Sprint duration in weeks (default: 2)

**Returns:**

- `sprint`: Sprint object with stories and metrics
- `error`: Error message if creation fails
