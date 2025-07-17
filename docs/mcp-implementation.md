# MCP (Model Context Protocol) Implementation in SprintiQ

This document describes the implementation of Model Context Protocol (MCP) in SprintiQ, enabling seamless integration with external AI tools and services.

## Overview

MCP allows SprintiQ to:

- **Expose its capabilities** to external AI assistants and tools
- **Consume external services** through a standardized protocol
- **Extend AI functionality** beyond the built-in features
- **Integrate with third-party systems** securely

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        SprintiQ Application                    │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │   MCP Server    │  │   MCP Client    │  │   MCP Service   │  │
│  │   (Expose)      │  │   (Consume)     │  │   (Orchestrate) │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │   HTTP/WS       │  │   JSON-RPC      │  │   Transport     │  │
│  │   Transport     │  │   Protocol      │  │   Layer         │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Components

### 1. MCP Server (`lib/mcp/server.ts`)

Exposes SprintiQ's capabilities to external MCP clients.

**Available Tools:**

- `SPRINTIQ_CREATE_TASK` - Create new tasks
- `SPRINTIQ_UPDATE_TASK` - Update existing tasks
- `SPRINTIQ_DELETE_TASK` - Delete tasks
- `SPRINTIQ_GET_TASK` - Retrieve task details
- `SPRINTIQ_LIST_TASKS` - List tasks with filters
- `SPRINTIQ_GENERATE_USER_STORIES` - AI-powered story generation
- `SPRINTIQ_ANALYZE_TASK_PRIORITY` - Priority analysis
- `SPRINTIQ_FIND_SIMILAR_TASKS` - Similar task search
- `SPRINTIQ_GENERATE_SPRINT_GOAL` - Sprint goal generation
- `SPRINTIQ_GET_TEAM_MEMBERS` - Team management
- `SPRINTIQ_GET_PROJECT_ANALYTICS` - Analytics and reporting

**API Endpoint:** `POST /api/mcp/server`

### 2. MCP Client (`lib/mcp/client.ts`)

Connects to external MCP servers to consume their capabilities.

**Features:**

- HTTP and WebSocket transport
- Authentication support (Bearer, API Key)
- Connection management
- Error handling and retries
- Health monitoring

### 3. MCP Service (`lib/mcp/service.ts`)

High-level orchestration layer for MCP operations.

**Key Functions:**

- `connectToServer(name, config)` - Connect to external server
- `callTool(server, tool, params)` - Execute tool on server
- `searchTools(query)` - Search available tools
- `generateStoriesWithMCP(params)` - Enhanced story generation
- `SPRINTIQ_FIND_SIMILAR_TASKS(params)` - Multi-source search
- `healthCheck()` - Monitor server health

### 4. Admin Interface (`components/admin/mcp/mcp-manager.tsx`)

React component for managing MCP connections through the admin panel.

**Features:**

- Add/remove server connections
- Monitor connection health
- Browse available tools
- Test tool execution
- View server information

## Setup Instructions

### 1. Add MCP Dependencies

```bash
# No additional dependencies needed - uses built-in fetch and WebSocket APIs
```

### 2. Environment Configuration

Add to your `.env.local`:

```env
# MCP Server Configuration
MCP_SERVER_PORT=3001
MCP_SERVER_HOST=localhost
MCP_CORS_ORIGINS="http://localhost:3000,https://yourdomain.com"

# External MCP Servers (optional)
EXTERNAL_MCP_SERVERS='[
  {
    "name": "jira-server",
    "url": "https://your-jira-mcp-server.com/mcp",
    "auth": {
      "type": "bearer",
      "token": "your-token-here"
    }
  }
]'
```

### 3. Start the MCP Server

The MCP server is automatically available at `/api/mcp/server` when your Next.js app starts.

### 4. Connect External Servers

Use the admin interface or programmatically:

```typescript
import { mcpService } from "@/lib/mcp/service";

// Connect to an external MCP server
await mcpService.connectToServer("jira-server", {
  serverUrl: "https://your-jira-mcp-server.com/mcp",
  auth: {
    type: "bearer",
    token: "your-token-here",
  },
});
```

## Usage Examples

### 1. Basic Tool Call

```typescript
import { mcpService } from "@/lib/mcp/service";

const result = await mcpService.callTool(
  "internal",
  "SPRINTIQ_CREATE_TASK",
  {
    title: "New Task",
    description: "Task description",
    projectId: "project-123",
  },
  {
    workspaceId: "workspace-456",
    userId: "user-789",
    permissions: ["read", "write"],
  }
);
```

### 2. Enhanced Story Generation

```typescript
const stories = await mcpService.generateStoriesWithMCP({
  featureDescription: "User authentication system",
  numberOfStories: 5,
  complexity: "moderate",
  externalSources: ["jira-server", "confluence-server"],
  context: {
    workspaceId: "workspace-456",
    userId: "user-789",
    projectId: "project-123",
    permissions: ["read", "write"],
  },
});
```

### 3. Multi-Source Task Search

```typescript
const results = await mcpService.SPRINTIQ_FIND_SIMILAR_TASKS({
  query: "authentication bug",
  sources: ["internal", "jira-server"],
  limit: 10,
  context: {
    workspaceId: "workspace-456",
    userId: "user-789",
    permissions: ["read"],
  },
});
```

### 4. Cross-Platform Analytics

```typescript
const analytics = await mcpService.getCrossplatformAnalytics({
  type: "project",
  id: "project-123",
  sources: ["internal", "jira-server", "github-server"],
  context: {
    workspaceId: "workspace-456",
    userId: "user-789",
    permissions: ["read"],
  },
});
```

## Integration with Existing Components

### 1. AI Assistant Integration

Update your AI assistant to use MCP:

```typescript
// In your AI assistant component
import { mcpService } from "@/lib/mcp/service";

const handleAIRequest = async (request: string) => {
  // Use MCP for enhanced capabilities
  const result = await mcpService.generateStoriesWithMCP({
    featureDescription: request,
    context: getCurrentContext(),
  });

  return result;
};
```

### 2. Task Management Enhancement

```typescript
// Enhanced task creation with MCP
const createTaskWithMCP = async (taskData: any) => {
  const result = await mcpService.callTool(
    "internal",
    "SPRINTIQ_CREATE_TASK",
    taskData
  );

  if (result.success) {
    // Optionally sync with external systems
    await mcpService.callTool("jira-server", "createIssue", {
      title: taskData.title,
      description: taskData.description,
      projectKey: "PROJ",
    });
  }

  return result;
};
```

## Security Considerations

### 1. Authentication

All MCP operations require proper authentication:

```typescript
// Context must include valid user and workspace
const context = {
  workspaceId: "validated-workspace-id",
  userId: "authenticated-user-id",
  permissions: ["read", "write"], // Based on user roles
};
```

### 2. Authorization

Tools check permissions before execution:

```typescript
// In MCP server implementation
private validateContext(context: any): SprintiQContext {
  if (!context || !context.workspaceId || !context.userId) {
    throw new Error("Invalid context: workspaceId and userId are required");
  }

  // Additional permission checks here
  return context as SprintiQContext;
}
```

### 3. Input Validation

All tool parameters are validated:

```typescript
// Example tool implementation
private async createTask(params: any, context: SprintiQContext): Promise<MCPToolResult> {
  // Validate required parameters
  if (!params.title || !params.projectId) {
    return { success: false, error: "Title and projectId are required" };
  }

  // Validate user has access to project
  const hasAccess = await this.validateProjectAccess(context.userId, params.projectId);
  if (!hasAccess) {
    return { success: false, error: "Access denied" };
  }

  // Proceed with task creation
  // ...
}
```

## Monitoring and Debugging

### 1. Health Checks

```typescript
// Monitor MCP server health
const healthStatus = await mcpService.healthCheck();
console.log("MCP Server Health:", healthStatus);
```

### 2. Error Handling

```typescript
// Robust error handling
try {
  const result = await mcpService.callTool(
    "external-server",
    "someAction",
    params
  );
  if (!result.success) {
    console.error("Tool execution failed:", result.error);
    // Handle graceful fallback
  }
} catch (error) {
  console.error("MCP call failed:", error);
  // Handle connection errors
}
```

### 3. Logging

```typescript
// Enable detailed logging
mcpService.setDefaultContext({
  workspaceId: "workspace-456",
  userId: "user-789",
  permissions: ["read", "write"],
});

// All subsequent calls will include this context
const result = await mcpService.callTool("server", "tool", params);
```

## Extending MCP

### 1. Adding New Tools

```typescript
// In lib/mcp/server.ts
private initializeTools(): MCPTool[] {
  return [
    // ... existing tools
    {
      name: "customTool",
      description: "Your custom tool description",
      inputSchema: {
        type: "object",
        properties: {
          customParam: { type: "string" }
        },
        required: ["customParam"]
      }
    }
  ];
}

// Add implementation
private async customTool(params: any, context: SprintiQContext): Promise<MCPToolResult> {
  // Your custom tool logic
  return { success: true, data: { result: "custom result" } };
}
```

### 2. Custom Transport

```typescript
// Implement custom transport for your specific needs
class CustomMCPTransport implements MCPTransport {
  async send(message: MCPMessage): Promise<MCPMessage> {
    // Your custom transport logic
  }

  receive(callback: (message: MCPMessage) => void): void {
    // Your custom receive logic
  }

  close(): void {
    // Cleanup
  }
}
```

## Best Practices

1. **Always validate context** - Ensure proper authentication and authorization
2. **Handle errors gracefully** - Provide fallbacks when external services fail
3. **Use connection pooling** - Reuse connections for better performance
4. **Monitor health** - Regular health checks for external services
5. **Cache results** - Cache frequently accessed data to reduce API calls
6. **Rate limiting** - Implement rate limiting for external API calls
7. **Logging** - Comprehensive logging for debugging and monitoring

## Troubleshooting

### Common Issues

1. **Connection Timeout**

   ```typescript
   // Increase timeout in client config
   const config: MCPClientConfig = {
     serverUrl: "https://external-server.com/mcp",
     timeout: 60000, // 60 seconds
   };
   ```

2. **Authentication Failure**

   ```typescript
   // Verify auth configuration
   const config: MCPClientConfig = {
     serverUrl: "https://external-server.com/mcp",
     auth: {
       type: "bearer",
       token: "valid-token", // Ensure token is valid
     },
   };
   ```

3. **Tool Not Found**
   ```typescript
   // List available tools first
   const tools = await mcpService.listToolsFromClient("server-name");
   console.log(
     "Available tools:",
     tools.map((t) => t.name)
   );
   ```

## Performance Optimization

1. **Batch Operations**

   ```typescript
   const operations = [
     { server: "server1", tool: "tool1", params: {} },
     { server: "server2", tool: "tool2", params: {} },
   ];

   const results = await mcpService.executeBatchOperations(operations, context);
   ```

2. **Connection Reuse**

   ```typescript
   // Connections are automatically reused by MCPClientManager
   // No need to reconnect for each request
   ```

3. **Caching**
   ```typescript
   // Implement caching for frequently accessed data
   const cachedResult = await cache.get(`tool:${toolName}:${paramsHash}`);
   if (!cachedResult) {
     const result = await mcpService.callTool(server, tool, params);
     await cache.set(`tool:${toolName}:${paramsHash}`, result, 300); // 5 min cache
   }
   ```

This MCP implementation provides a robust foundation for extending SprintiQ's AI capabilities while maintaining security and performance.
