# MCP Production Setup Guide for International Users

## Overview

This guide explains how to set up SprintiQ MCP for international users after deploying to Vercel. Your MCP server will be accessible globally through your Vercel deployment.

## 1. Vercel Environment Variables

Configure these environment variables in your Vercel deployment:

### Required Variables

```bash
# Your Vercel deployment URL
NEXT_PUBLIC_APP_URL=https://app.sprintiq.ai

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# AI API Keys
CLAUDE_API_KEY=your_claude_api_key
OPENAI_API_KEY=your_openai_api_key

# Email Service
RESEND_API_KEY=your_resend_api_key

# MCP Configuration
MCP_CORS_ORIGINS=*
MCP_RATE_LIMIT=100
```

### Optional Variables for Enhanced Security

```bash
# Allowed domains for MCP access (comma-separated)
MCP_ALLOWED_DOMAINS=claude.ai,cursor.com,openai.com

# API Rate limiting (requests per minute)
MCP_RATE_LIMIT=100

# Enable MCP authentication
MCP_AUTH_REQUIRED=true
```

## 2. MCP Endpoint URLs

After deployment, your MCP will be available at:

### Primary Endpoints

- **MCP Server**: `https://app.sprintiq.ai/api/mcp/server`
- **Enhanced MCP**: `https://app.sprintiq.ai/api/mcp/enhanced`
- **User Validation**: `https://app.sprintiq.ai/api/mcp/validate-user`
- **Auth Callback**: `https://app.sprintiq.ai/api/mcp/auth/callback`

### Health Check

```bash
curl https://app.sprintiq.ai/api/mcp/server
```

## 3. International User Configuration

### A. Claude Desktop Configuration

International users need to add this to their Claude Desktop config:

**macOS**: `~/Library/Application\ Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
**Linux**: `~/.config/claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "sprintiq-production": {
      "command": "node",
      "args": ["/path/to/sprintiq-mcp-client.js"],
      "env": {
        "SPRINTIQ_MCP_URL": "https://app.sprintiq.ai/api/mcp/server",
        "NODE_ENV": "production"
      }
    }
  }
}
```

### B. Cursor Configuration

For Cursor IDE users:

**cursor_settings.json**:

```json
{
  "mcp": {
    "enabled": true,
    "servers": {
      "sprintiq-production": {
        "command": "node",
        "args": ["/path/to/sprintiq-mcp-client.js"],
        "env": {
          "SPRINTIQ_MCP_URL": "https://app.sprintiq.ai/api/mcp/server",
          "NODE_ENV": "production"
        },
        "description": "SprintiQ Production MCP Server"
      }
    }
  }
}
```

## 4. MCP Client Script for International Users

Create a distributable MCP client script:

### sprintiq-mcp-client.js

```javascript
#!/usr/bin/env node

const http = require("http");
const https = require("https");
const readline = require("readline");
const { URL } = require("url");

// Get MCP server URL from environment or default to production
const MCP_SERVER_URL =
  process.env.SPRINTIQ_MCP_URL || "https://app.sprintiq.ai/api/mcp/server";

// Create readline interface for JSON-RPC communication
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

console.error(`SprintiQ MCP Client connecting to: ${MCP_SERVER_URL}`);

// Handle incoming JSON-RPC requests
rl.on("line", async (line) => {
  try {
    const request = JSON.parse(line);

    // Forward the request to SprintiQ MCP server
    const response = await makeHttpRequest(request);

    // Send response back to the AI tool
    console.log(JSON.stringify(response));
  } catch (error) {
    console.error("MCP Client Error:", error.message);

    // Send error response back
    console.log(
      JSON.stringify({
        jsonrpc: "2.0",
        id: null,
        error: {
          code: -32603,
          message: "Internal error",
          data: error.message,
        },
      })
    );
  }
});

async function makeHttpRequest(request) {
  const url = new URL(MCP_SERVER_URL);
  const isHttps = url.protocol === "https:";
  const httpModule = isHttps ? https : http;

  const postData = JSON.stringify(request);

  const options = {
    hostname: url.hostname,
    port: url.port || (isHttps ? 443 : 80),
    path: url.pathname,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(postData),
      "User-Agent": "SprintiQ-MCP-Client/1.0",
    },
  };

  return new Promise((resolve, reject) => {
    const req = httpModule.request(options, (res) => {
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        try {
          const response = JSON.parse(data);
          resolve(response);
        } catch (error) {
          reject(new Error(`Invalid JSON response: ${data}`));
        }
      });
    });

    req.on("error", (error) => {
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

// Handle process termination
process.on("SIGINT", () => {
  console.error("SprintiQ MCP Client shutting down...");
  process.exit(0);
});
```

## 5. User Authentication Flow

### Step 1: User Registration

International users must first register at your SprintiQ app:

```
https://app.sprintiq.ai/signup
```

### Step 2: Account Approval

Users need admin approval before using MCP features.

### Step 3: MCP Authentication

The MCP uses email-based authentication. Users provide their SprintiQ email and password when using MCP tools.

### Example Authentication Flow

```javascript
// In Claude or Cursor
// User will be prompted for email and password
// System validates credentials against SprintiQ database
// Creates authenticated session for MCP operations
```

## 6. Available MCP Tools

International users can access these tools:

### Core Tools

- `SPRINTIQ_GENERATE_USER_STORIES` - Generate user stories with AI
- `SPRINTIQ_CREATE_TASK` - Create new tasks
- `SPRINTIQ_UPDATE_TASK` - Update existing tasks
- `SPRINTIQ_LIST_TASKS` - List and filter tasks
- `SPRINTIQ_FIND_SIMILAR_TASKS` - Find similar tasks
- `SPRINTIQ_ASSIGN_TASK` - Assign tasks to team members
- `SPRINTIQ_GENERATE_SPRINT_GOAL` - Generate sprint goals

### Analytics Tools

- `SPRINTIQ_GET_PROJECT_ANALYTICS` - Get project metrics
- `SPRINTIQ_GET_TEAM_PERFORMANCE` - Team performance data
- `SPRINTIQ_GET_WORKSPACE_INSIGHTS` - Workspace analytics

## 7. Rate Limiting and CORS

### Rate Limiting

- **Default**: 100 requests per minute per IP
- **Authenticated Users**: 200 requests per minute
- **Premium Users**: 500 requests per minute

### CORS Configuration

The MCP server allows cross-origin requests from:

- `https://claude.ai`
- `https://cursor.com`
- `https://openai.com`
- Custom domains (configurable)

## 8. Monitoring and Logging

### Health Check Endpoint

```bash
curl https://app.sprintiq.ai/api/mcp/server
```

### Response:

```json
{
  "server": {
    "name": "SprintiQ MCP Server",
    "version": "1.0.0"
  },
  "endpoints": {
    "mcp": "/api/mcp/server",
    "enhanced": "/api/mcp/enhanced"
  },
  "status": "healthy"
}
```

## 9. Security Best Practices

### For International Users:

1. **Use HTTPS Only**: Always connect via HTTPS
2. **Secure Credentials**: Never share your SprintiQ credentials
3. **Regular Updates**: Keep MCP client updated
4. **Network Security**: Use secure networks for MCP operations

### For Administrators:

1. **User Approval**: Manually approve international users
2. **Rate Limiting**: Monitor and adjust rate limits
3. **Access Logs**: Monitor MCP access logs
4. **Security Updates**: Keep dependencies updated

## 10. Troubleshooting

### Common Issues:

**Connection Failed**

```bash
# Check if server is accessible
curl -I https://app.sprintiq.ai/api/mcp/server
```

**Authentication Failed**

- Verify user is registered and approved
- Check email/password credentials
- Ensure user has proper permissions

**Rate Limit Exceeded**

- Wait for rate limit reset
- Consider upgrading user to premium tier

**CORS Issues**

- Verify client domain is allowed
- Check CORS configuration in Vercel

## 11. Support and Documentation

### For International Users:

- **Documentation**: `https://app.sprintiq.ai/docs/mcp`
- **Support**: `support@your-domain.com`
- **Status Page**: `https://app.sprintiq.ai/status`

### Getting Help:

1. Check the health endpoint
2. Review error logs
3. Contact support with:
   - User email
   - Error message
   - Timestamp
   - Geographic location

## 12. Example Usage

### Basic Story Generation

```javascript
// This is what international users will experience
const result = await mcpTool.SPRINTIQ_GENERATE_USER_STORIES({
  featureDescription: "User management system",
  numberOfStories: 3,
  complexity: "moderate",
});
```

### Advanced Team Assignment

```javascript
const assignment = await mcpTool.assignTask({
  taskId: "task-123",
  skills: ["React", "Node.js"],
  workload: "balanced",
});
```

---

## Quick Start for International Users

1. **Register**: Sign up at `https://app.sprintiq.ai/signup`
2. **Wait for Approval**: Admin will approve your account
3. **Download Client**: Get the MCP client script
4. **Configure**: Add to your AI tool configuration
5. **Start Using**: Begin using MCP tools with your credentials

Your SprintiQ MCP is now ready for international users! 🌍✨
