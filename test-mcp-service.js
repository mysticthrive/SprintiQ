// Test MCP Service functionality
import { mcpService } from "./lib/mcp/service.js";

const testMCPService = async () => {
  try {
    // Set default context
    mcpService.setDefaultContext({
      workspaceId: "test-workspace",
      userId: "test-user",
      permissions: ["read", "write"],
    });

    // Test internal server tools
    console.log("Connected servers:", mcpService.getConnectedServers());

    // Test tool search
    const searchResults = await mcpService.searchTools("generate");
    console.log('Search results for "generate":', searchResults);

    // Test health check
    const healthStatus = await mcpService.healthCheck();
    console.log("Health status:", healthStatus);

    // Test getting all available tools
    const allTools = await mcpService.getAllAvailableTools();
    console.log("All available tools:", allTools);
  } catch (error) {
    console.error("MCP Service test failed:", error);
  }
};

// Run the test
testMCPService();
