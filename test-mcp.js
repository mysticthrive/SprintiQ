// Simple test script for MCP server
const testMCPServer = async () => {
  try {
    const response = await fetch("http://localhost:3000/api/mcp/server", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();
    console.log("MCP Server Info:", JSON.stringify(data, null, 2));

    // Test MCP tool call
    const toolCall = await fetch("http://localhost:3000/api/mcp/server", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "tools/list",
      }),
    });

    const toolData = await toolCall.json();
    console.log("Available Tools:", JSON.stringify(toolData, null, 2));
  } catch (error) {
    console.error("Test failed:", error);
  }
};

// Run the test
testMCPServer();
