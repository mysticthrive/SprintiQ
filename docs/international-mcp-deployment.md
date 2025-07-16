# International MCP Deployment Summary

## 🌍 Overview

After deploying your SprintiQ project to Vercel, international users can access your MCP (Model Context Protocol) server globally. This document provides a complete overview of the setup process.

## 📁 Files Created

### 1. **Production Setup Guide** (`docs/mcp-production-setup.md`)

- Comprehensive guide for setting up MCP for international users
- Vercel environment variables configuration
- MCP endpoint URLs and health checks
- User authentication flow
- Available tools and security practices

### 2. **Production MCP Client** (`scripts/sprintiq-mcp-client.js`)

- Production-ready MCP client with robust error handling
- Rate limiting and retry mechanisms
- Comprehensive logging and monitoring
- Health checks and graceful shutdown
- Support for multiple international users

### 3. **Installation Script** (`scripts/install-mcp-client.sh`)

- One-command installation for international users
- Automatic configuration for Claude Desktop and Cursor
- Connection testing and troubleshooting
- Cross-platform support (macOS, Linux, Windows)

### 4. **Enhanced MCP Server** (`app/api/mcp/server/route.ts`)

- Added CORS support for international access
- Rate limiting (100 requests/minute by default)
- Proper error handling with CORS headers
- Support for multiple AI platforms

## 🚀 Deployment Steps

### 1. **Deploy to Vercel**

```bash
# Deploy your project to Vercel
vercel deploy --prod

# Set environment variables in Vercel dashboard
NEXT_PUBLIC_APP_URL=https://app.sprintiq.ai
MCP_CORS_ORIGINS=*
MCP_RATE_LIMIT=100
```

### 2. **Configure Environment Variables**

Required in Vercel dashboard:

- `NEXT_PUBLIC_APP_URL`: Your Vercel deployment URL
- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anon key
- `CLAUDE_API_KEY`: Your Claude API key
- `OPENAI_API_KEY`: Your OpenAI API key
- `MCP_CORS_ORIGINS`: Allowed origins (use `*` for all)
- `MCP_RATE_LIMIT`: Requests per minute (default: 100)

### 3. **Test MCP Endpoints**

After deployment, test your MCP endpoints:

```bash
# Health check
curl https://app.sprintiq.ai/api/mcp/server

# Should return server info with status "healthy"
```

## 🌐 International User Access

### **Step 1: User Registration**

International users must:

1. Visit `https://app.sprintiq.ai/signup`
2. Register with valid email and password
3. Wait for admin approval

### **Step 2: Install MCP Client**

Users can install the MCP client using:

```bash
# One-command installation
curl -fsSL https://app.sprintiq.ai/install-mcp.sh | bash
```

Or manually:

1. Download `sprintiq-mcp-client.js`
2. Configure their AI tool (Claude/Cursor)
3. Test connection

### **Step 3: Configuration**

**Claude Desktop:**

```json
{
  "mcpServers": {
    "sprintiq": {
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

**Cursor IDE:**

```json
{
  "mcp": {
    "enabled": true,
    "servers": {
      "sprintiq": {
        "command": "node",
        "args": ["/path/to/sprintiq-mcp-client.js"],
        "env": {
          "SPRINTIQ_MCP_URL": "https://app.sprintiq.ai/api/mcp/server",
          "NODE_ENV": "production"
        },
        "description": "SprintiQ MCP Server"
      }
    }
  }
}
```

## 🔧 Available MCP Tools

International users can access these tools:

### **Core Tools**

- `generateUserStories` - Generate user stories with AI
- `createTask` - Create new tasks
- `updateTask` - Update existing tasks
- `listTasks` - List and filter tasks
- `findSimilarTasks` - Find similar tasks
- `assignTask` - Assign tasks to team members
- `generateSprintGoal` - Generate sprint goals

### **Analytics Tools**

- `getProjectAnalytics` - Get project metrics
- `getTeamPerformance` - Team performance data
- `getWorkspaceInsights` - Workspace analytics

## 🔐 Security Features

### **Authentication**

- Email-based user validation
- Password verification against Supabase
- User approval system (admin must approve)
- Session management

### **Rate Limiting**

- 100 requests/minute per IP (configurable)
- Exponential backoff for failed requests
- Rate limit headers in responses

### **CORS Security**

- Configurable allowed origins
- Support for multiple AI platforms
- Proper preflight handling

## 📊 Monitoring & Logging

### **Server-Side Monitoring**

- Health check endpoint: `/api/mcp/server`
- Request/response logging
- Error tracking and reporting
- Performance metrics

### **Client-Side Monitoring**

- Connection health checks
- Request/error statistics
- Automatic retry mechanisms
- Detailed logging with levels

## 🌍 International Considerations

### **Time Zones**

- All timestamps in UTC
- Client-side timezone conversion
- Proper date handling in API responses

### **Localization**

- English-first approach
- Error messages in English
- Future: Multi-language support

### **Performance**

- CDN distribution via Vercel
- Optimized API responses
- Efficient data serialization

## 🛠 Troubleshooting

### **Common Issues**

1. **Connection Failed**: Check internet, firewall, server URL
2. **Authentication Failed**: Verify user registration and approval
3. **Rate Limit Exceeded**: Wait or contact admin for higher limits
4. **CORS Issues**: Verify origin is allowed in configuration

### **Support Channels**

- Documentation: `https://app.sprintiq.ai/docs/mcp`
- GitHub Issues: Repository issues page
- Email Support: Setup support email
- Health Check: `https://app.sprintiq.ai/api/mcp/server`

## 🎯 Usage Example

Once set up, international users can interact with your MCP like this:

```javascript
// In Claude or Cursor
// User provides email and password when prompted
// Then can use MCP tools:

const stories = await generateUserStories({
  featureDescription: "International user management system",
  numberOfStories: 4,
  complexity: "moderate",
});

// Result: 4 user stories generated and saved to SprintiQ
```

## 📈 Scaling Considerations

### **Performance**

- Vercel automatically scales based on demand
- Database connections managed by Supabase
- CDN distribution for global users

### **Costs**

- Monitor Vercel function invocations
- Track API usage per user
- Consider implementing usage tiers

### **Security**

- Regular security audits
- Monitor for unusual activity
- Implement additional rate limiting if needed

## ✅ Success Metrics

Your international MCP deployment is successful when:

- ✅ Health endpoint returns "healthy" status
- ✅ International users can register and get approved
- ✅ MCP client connects successfully
- ✅ AI tools can use SprintiQ features
- ✅ User stories are generated and saved
- ✅ No CORS or authentication errors
- ✅ Rate limiting works properly

## 🚀 Next Steps

1. **Deploy to Production**: Push to Vercel with proper env vars
2. **Test Thoroughly**: Verify all endpoints work internationally
3. **Create Documentation**: Set up user guides and support
4. **Monitor Usage**: Track usage patterns and performance
5. **Collect Feedback**: Get input from international users
6. **Iterate**: Improve based on real-world usage

Your SprintiQ MCP is now ready for international users! 🌍✨

---

**Quick Links:**

- [Production Setup Guide](./mcp-production-setup.md)
- [MCP Client Script](../scripts/sprintiq-mcp-client.js)
- [Installation Script](../scripts/install-mcp-client.sh)
- [Health Check](https://app.sprintiq.ai/api/mcp/server)
