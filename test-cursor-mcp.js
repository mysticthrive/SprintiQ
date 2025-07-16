#!/usr/bin/env node

/**
 * Test script to verify MCP integration with Cursor
 * This script tests the MCP client connection and available tools
 */

const { spawn } = require("child_process");
const path = require("path");

const MCP_CLIENT_PATH = path.join(__dirname, "mcp-client.js");

function testMCPClient() {
  console.log("🧪 Testing MCP Client for Cursor Integration...\n");

  const client = spawn("node", [MCP_CLIENT_PATH]);

  let responseCount = 0;
  const expectedResponses = 3;

  client.stdout.on("data", (data) => {
    const responses = data
      .toString()
      .split("\n")
      .filter((line) => line.trim());

    responses.forEach((response) => {
      if (response.trim()) {
        responseCount++;
        console.log(`📥 Response ${responseCount}:`, response);

        try {
          const parsed = JSON.parse(response);
          if (parsed.result && parsed.result.tools) {
            console.log(
              `✅ Found ${parsed.result.tools.length} tools available`
            );
            parsed.result.tools.forEach((tool) => {
              console.log(`   - ${tool.name}: ${tool.description}`);
            });
          }
        } catch (e) {
          // Not all responses are tool lists
        }
      }
    });
  });

  client.stderr.on("data", (data) => {
    console.error("❌ Error:", data.toString());
  });

  client.on("close", (code) => {
    console.log(`\n🔄 MCP Client process exited with code ${code}`);
    if (responseCount >= expectedResponses) {
      console.log("✅ MCP Client test completed successfully!");
      console.log(
        "🎉 Your SprintiQ MCP server is ready for Cursor integration!"
      );
    } else {
      console.log("⚠️  Test completed with fewer responses than expected");
    }
  });

  // Test sequence
  console.log("1️⃣ Testing server initialization...");
  client.stdin.write(
    '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"1.0.0","clientInfo":{"name":"Cursor MCP Client","version":"1.0.0"}}}\n'
  );

  setTimeout(() => {
    console.log("2️⃣ Testing server info...");
    client.stdin.write(
      '{"jsonrpc":"2.0","id":2,"method":"server/info","params":{}}\n'
    );
  }, 1000);

  setTimeout(() => {
    console.log("3️⃣ Testing tools list...");
    client.stdin.write(
      '{"jsonrpc":"2.0","id":3,"method":"tools/list","params":{}}\n'
    );
  }, 2000);

  setTimeout(() => {
    console.log("4️⃣ Closing connection...");
    client.stdin.end();
  }, 3000);
}

// Check if Next.js server is running
const http = require("http");
const checkServer = () => {
  const options = {
    hostname: "localhost",
    port: 3000,
    path: "/api/mcp/server",
    method: "GET",
  };

  const req = http.request(options, (res) => {
    if (res.statusCode === 200) {
      console.log("✅ SprintiQ server is running on http://localhost:3000");
      console.log("🚀 Starting MCP client test...\n");
      testMCPClient();
    } else {
      console.log("❌ Server responded with status:", res.statusCode);
    }
  });

  req.on("error", (error) => {
    console.log(
      "❌ SprintiQ server is not running. Please start it with: npm run dev"
    );
    console.log("   Error:", error.message);
  });

  req.end();
};

console.log("🔍 Checking if SprintiQ server is running...");
checkServer();
