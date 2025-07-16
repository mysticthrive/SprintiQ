import { NextRequest, NextResponse } from "next/server";
import { SprintiQMCPServer } from "@/lib/mcp/server";
import { enhancedMCPService } from "@/lib/mcp/enhanced-service";
import { MCPMessage } from "@/lib/mcp/types";

// Initialize the MCP server
const mcpServer = new SprintiQMCPServer();

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = parseInt(process.env.MCP_RATE_LIMIT || "100");
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// CORS configuration
const CORS_ORIGINS = process.env.MCP_CORS_ORIGINS?.split(",") || [
  "https://claude.ai",
  "https://cursor.com",
  "https://openai.com",
  "http://localhost:3000",
  "https://app.sprintiq.ai",
];

function handleCors(request: NextRequest) {
  const origin = request.headers.get("origin");
  const isAllowed =
    CORS_ORIGINS.includes("*") || (origin && CORS_ORIGINS.includes(origin));

  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-API-Key",
    "Access-Control-Max-Age": "86400",
  };

  if (isAllowed) {
    headers["Access-Control-Allow-Origin"] = origin || "*";
  }

  return headers;
}

function checkRateLimit(clientId: string): boolean {
  const now = Date.now();
  const client = rateLimitStore.get(clientId);

  if (!client || now > client.resetTime) {
    rateLimitStore.set(clientId, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW,
    });
    return true;
  }

  if (client.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }

  client.count++;
  return true;
}

export async function OPTIONS(request: NextRequest) {
  const corsHeaders = handleCors(request);
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}

export async function POST(request: NextRequest) {
  const corsHeaders = handleCors(request);

  try {
    // Get client identifier for rate limiting
    const clientId =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "anonymous";

    // Check rate limit
    if (!checkRateLimit(clientId)) {
      return NextResponse.json(
        {
          jsonrpc: "2.0",
          error: {
            code: -32000,
            message: "Rate limit exceeded. Please try again later.",
          },
        },
        {
          status: 429,
          headers: {
            ...corsHeaders,
            "Retry-After": "60",
          },
        }
      );
    }

    const message: MCPMessage = await request.json();

    // Handle different MCP methods
    switch (message.method) {
      case "initialize":
        return handleInitialize(message, corsHeaders);

      case "initialized":
        return handleInitialized(message, corsHeaders);

      case "server/info":
        return handleServerInfo(message, corsHeaders);

      case "tools/list":
        return handleListTools(message, corsHeaders);

      case "tools/call":
        return handleCallTool(message, corsHeaders);

      case "resources/list":
        return handleListResources(message, corsHeaders);

      case "resources/read":
        return handleReadResource(message, corsHeaders);

      case "prompts/list":
        return handleListPrompts(message, corsHeaders);

      case "prompts/get":
        return handleGetPrompt(message, corsHeaders);

      default:
        return NextResponse.json(
          {
            jsonrpc: "2.0",
            id: message.id,
            error: {
              code: -32601,
              message: `Method not found: ${message.method}`,
            },
          },
          { status: 400, headers: corsHeaders }
        );
    }
  } catch (error) {
    return NextResponse.json(
      {
        jsonrpc: "2.0",
        error: {
          code: -32700,
          message: "Parse error",
          data: error instanceof Error ? error.message : "Unknown error",
        },
      },
      { status: 400, headers: corsHeaders }
    );
  }
}

async function handleInitialize(
  message: MCPMessage,
  corsHeaders: Record<string, string>
): Promise<NextResponse> {
  return NextResponse.json(
    {
      jsonrpc: "2.0",
      id: message.id,
      result: {
        protocolVersion: "2024-11-05",
        capabilities: {
          tools: {},
          resources: {},
          prompts: {},
        },
        serverInfo: {
          name: "SprintiQ MCP Server",
          version: "1.0.0",
        },
      },
    },
    { headers: corsHeaders }
  );
}

async function handleInitialized(
  message: MCPMessage,
  corsHeaders: Record<string, string>
): Promise<NextResponse> {
  // The initialized notification doesn't require a response
  return NextResponse.json({}, { status: 200, headers: corsHeaders });
}

async function handleServerInfo(
  message: MCPMessage,
  corsHeaders: Record<string, string>
): Promise<NextResponse> {
  return NextResponse.json(
    {
      jsonrpc: "2.0",
      id: message.id,
      result: mcpServer.info(),
    },
    { headers: corsHeaders }
  );
}

async function handleListTools(
  message: MCPMessage,
  corsHeaders: Record<string, string>
): Promise<NextResponse> {
  return NextResponse.json(
    {
      jsonrpc: "2.0",
      id: message.id,
      result: {
        tools: mcpServer.listTools(),
      },
    },
    { headers: corsHeaders }
  );
}

async function handleCallTool(
  message: MCPMessage,
  corsHeaders: Record<string, string>
): Promise<NextResponse> {
  try {
    const { name, arguments: args } = message.params;

    // Check if user email is provided for enhanced workflow
    if (args.userEmail) {
      // Use enhanced workflow with proper user validation
      const result = await enhancedMCPService.executeToolWithWorkflow(
        args.userEmail,
        name,
        args,
        args.workspaceId,
        args.selectedTeamMemberIds
      );

      // Include authorization URL in metadata if needed
      if (!result.success && result.metadata?.requiresAuthorization) {
        const authInfo = await enhancedMCPService.getAuthorizationInfo(
          args.userEmail
        );
        result.metadata.authorizationUrl = authInfo.authorizationUrl;
      }

      return NextResponse.json(
        {
          jsonrpc: "2.0",
          id: message.id,
          result: result,
        },
        { headers: corsHeaders }
      );
    }

    // Fallback to basic server call (requires proper context)
    if (!args.context || !args.context.workspaceId || !args.context.userId) {
      return NextResponse.json(
        {
          jsonrpc: "2.0",
          id: message.id,
          error: {
            code: -32602,
            message:
              "Invalid params: Either userEmail or complete context (workspaceId, userId) is required",
            data: "For enhanced workflow, provide userEmail. For direct calls, provide context with workspaceId and userId.",
          },
        },
        { status: 400, headers: corsHeaders }
      );
    }

    const result = await mcpServer.callTool(name, args);

    return NextResponse.json(
      {
        jsonrpc: "2.0",
        id: message.id,
        result: result,
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    return NextResponse.json(
      {
        jsonrpc: "2.0",
        id: message.id,
        error: {
          code: -32603,
          message: "Internal error",
          data: error instanceof Error ? error.message : "Unknown error",
        },
      },
      { status: 500, headers: corsHeaders }
    );
  }
}

async function handleListResources(
  message: MCPMessage,
  corsHeaders: Record<string, string>
): Promise<NextResponse> {
  return NextResponse.json(
    {
      jsonrpc: "2.0",
      id: message.id,
      result: {
        resources: mcpServer.listResources(),
      },
    },
    { headers: corsHeaders }
  );
}

async function handleReadResource(
  message: MCPMessage,
  corsHeaders: Record<string, string>
): Promise<NextResponse> {
  try {
    const { uri } = message.params;
    const result = await mcpServer.readResource(uri);

    return NextResponse.json(
      {
        jsonrpc: "2.0",
        id: message.id,
        result: result,
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    return NextResponse.json(
      {
        jsonrpc: "2.0",
        id: message.id,
        error: {
          code: -32603,
          message: "Internal error",
          data: error instanceof Error ? error.message : "Unknown error",
        },
      },
      { status: 500, headers: corsHeaders }
    );
  }
}

async function handleListPrompts(
  message: MCPMessage,
  corsHeaders: Record<string, string>
): Promise<NextResponse> {
  return NextResponse.json(
    {
      jsonrpc: "2.0",
      id: message.id,
      result: {
        prompts: mcpServer.listPrompts(),
      },
    },
    { headers: corsHeaders }
  );
}

async function handleGetPrompt(
  message: MCPMessage,
  corsHeaders: Record<string, string>
): Promise<NextResponse> {
  try {
    const { name, arguments: args } = message.params;
    const result = await mcpServer.getPrompt(name, args);

    return NextResponse.json(
      {
        jsonrpc: "2.0",
        id: message.id,
        result: result,
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    return NextResponse.json(
      {
        jsonrpc: "2.0",
        id: message.id,
        error: {
          code: -32603,
          message: "Internal error",
          data: error instanceof Error ? error.message : "Unknown error",
        },
      },
      { status: 500, headers: corsHeaders }
    );
  }
}

// Handle GET requests to return server info
export async function GET(request: NextRequest) {
  const corsHeaders = handleCors(request);

  return NextResponse.json(
    {
      server: mcpServer.info(),
      endpoints: {
        mcp: "/api/mcp/server",
        enhanced: "/api/mcp/enhanced",
      },
      workflows: {
        enhanced: {
          description:
            "Enhanced workflow with user validation and workspace selection",
          usage:
            "Include userEmail in tool call arguments to use enhanced workflow",
          example: {
            method: "tools/call",
            params: {
              name: "generateUserStories",
              arguments: {
                userEmail: "user@example.com",
                featureDescription: "Shopping system management",
                numberOfStories: 3,
                workspaceId: "optional-workspace-id",
                selectedTeamMemberIds: ["optional-team-member-ids"],
              },
            },
          },
        },
        basic: {
          description: "Direct tool calls with explicit context",
          usage: "Provide complete context object with workspaceId and userId",
          example: {
            method: "tools/call",
            params: {
              name: "generateUserStories",
              arguments: {
                featureDescription: "Shopping system management",
                numberOfStories: 3,
                context: {
                  workspaceId: "workspace-id",
                  userId: "user-id",
                  email: "user@example.com",
                },
              },
            },
          },
        },
      },
      documentation: "https://github.com/your-org/sprint-iq/docs/mcp.md",
      status: "healthy",
      timestamp: new Date().toISOString(),
    },
    { headers: corsHeaders }
  );
}
