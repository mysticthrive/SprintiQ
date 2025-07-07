# Enhanced Team Assignment Logic

## Overview

The enhanced team assignment system addresses three critical cases for optimal story distribution:

1. **Skill Matching** (40% weight)
2. **Level-based Priority Assignment** (30% weight)
3. **Workload Balancing** (30% weight)

## Case 1: Skill Matching (40% weight)

### Direct Skill Matches

- Exact matches between story tags and team member skills
- Example: Story tagged with "React" matches member with "React" skill

### Partial Skill Matches

- Partial matches with 70% weight
- Example: "React Native" story matches member with "React" skill
- Example: "API" story matches member with "REST API" skill

### Role-based Skill Matching

- Automatic skill matching based on team member roles
- Frontend Developer: React, Vue, Angular, JavaScript, TypeScript, CSS, HTML, UI, frontend
- Backend Developer: Java, Spring, Node.js, Python, C#, Database, API, backend, server
- Full Stack Developer: React, Node.js, Java, Spring, Database, API, fullstack
- DevOps Engineer: Docker, Kubernetes, AWS, CI/CD, infrastructure, monitoring, devops
- QA Engineer: Testing, automation, Selenium, Jest, quality, qa
- UI/UX Designer: Figma, design, UI, UX, prototyping, user research
- Product Manager: Product, strategy, agile, stakeholder, user research
- Data Scientist: Python, machine learning, statistics, data analysis, SQL

## Case 2: Level-based Priority Assignment (30% weight)

### Complexity Matching

| Level  | Simple | Moderate | Complex |
| ------ | ------ | -------- | ------- |
| Junior | 0.9    | 0.6      | 0.3     |
| Mid    | 0.8    | 0.9      | 0.7     |
| Senior | 0.7    | 0.8      | 0.9     |
| Lead   | 0.6    | 0.7      | 0.8     |

### Priority Matching

| Level  | Low | Medium | High | Critical |
| ------ | --- | ------ | ---- | -------- |
| Junior | 0.8 | 0.7    | 0.5  | 0.3      |
| Mid    | 0.7 | 0.9    | 0.8  | 0.6      |
| Senior | 0.6 | 0.7    | 0.9  | 0.8      |
| Lead   | 0.5 | 0.6    | 0.8  | 0.9      |

### Key Principles

- **High priority stories** are assigned to **higher level members**
- **Critical stories** are primarily assigned to **Senior/Lead** members
- **Simple stories** can be assigned to **Junior** members for learning
- **Complex stories** require **Senior** expertise

## Case 3: Workload Balancing (30% weight)

### Workload Calculation

- **Current Workload**: Sum of estimated hours from active tasks
- **Max Workload**: 80% of member's availability
- **Workload Score**: Inverted ratio (lower workload = higher score)

### Workload Bonuses

- **Low Workload Bonus**: +0.1 for members with <30% workload
- **Overload Protection**: 0.1 score for members at/above capacity

### Level-based Workload Expectations

- **Junior**: 40% of availability typically assigned
- **Mid**: 50% of availability typically assigned
- **Senior**: 60% of availability typically assigned
- **Lead**: 70% of availability typically assigned (includes meetings, mentoring)

## Scoring Algorithm

```typescript
const totalScore =
  skillMatch * 0.4 +
  levelPriorityMatch * 0.3 +
  workloadScore * 0.3 +
  performanceBonus;
```

### Performance Bonus

- Historical success rate from Supabase performance data
- Up to 10% additional score for high-performing members

## Confidence Calculation

```typescript
const confidence =
  skillMatch * 0.4 + levelPriorityMatch * 0.3 + workloadScore * 0.3;
```

## Assignment Reasons

The system generates human-readable reasons for assignments:

- **Excellent skill match** (>70% skill match)
- **Good skill match** (>50% skill match)
- **Optimal level for priority** (>80% level match)
- **Appropriate level** (>60% level match)
- **Available capacity** (>80% workload score)
- **Reasonable workload** (>60% workload score)
- **High success rate** (if performance data available)

## Warnings and Alerts

The system provides warnings for potential issues:

- **Overload Warning**: When assigned member is at capacity
- **Low Skill Match Warning**: When skill match is below 30%
- **Workload Distribution**: Encourages balanced workload distribution

## Database Integration

### Real Workload Tracking

- Queries active tasks from database
- Calculates actual workload from `estimated_time` and `story_points`
- Filters out completed/closed tasks
- Falls back to estimation if database unavailable

### Performance Data

- Historical success rates from Supabase
- Average velocity per team member
- Completion rates for different story types

## Testing

### Test Endpoint

```
GET /api/test-team-assignment
```

### Sample Test Scenarios

1. **React Dashboard** (High priority, moderate complexity) → Senior Frontend Developer
2. **Database Optimization** (Critical priority, complex) → Senior Backend Developer
3. **Simple Bug Fix** (Low priority, simple) → Junior Developer
4. **Production Deployment** (High priority, complex) → Lead DevOps Engineer

### Team Assignment Stats

```
POST /api/test-team-assignment
{
  "teamMembers": [...]
}
```

Returns:

- Total members
- Average workload
- Overloaded members count
- Available members count
- Skill distribution

## Usage Examples

### Basic Assignment

```typescript
const result = await getOptimalTeamAssignment(story, teamMembers);
console.log(`Assigned to: ${result.assignedMember.name}`);
console.log(`Reason: ${result.reason}`);
console.log(`Confidence: ${result.confidence}`);
```

### Team Statistics

```typescript
const stats = await getTeamAssignmentStats(teamMembers);
console.log(`Overloaded members: ${stats.overloadedMembers}`);
console.log(`Available members: ${stats.availableMembers}`);
```

## Benefits

1. **Prevents Burnout**: Workload balancing prevents overloading team members
2. **Skill Optimization**: Matches stories to team members with relevant skills
3. **Level Appropriateness**: Ensures stories are assigned to appropriate experience levels
4. **Priority Handling**: High-priority stories go to experienced team members
5. **Transparency**: Clear reasoning for each assignment
6. **Flexibility**: Falls back gracefully when data is unavailable

## Future Enhancements

1. **Learning Preferences**: Consider team member learning goals
2. **Pair Programming**: Suggest pair assignments for knowledge transfer
3. **Sprint Velocity**: Factor in historical sprint completion rates
4. **Team Dynamics**: Consider team member collaboration patterns
5. **Project Context**: Factor in project-specific requirements
