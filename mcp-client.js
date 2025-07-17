#!/usr/bin/env node

const https = require("https");
const readline = require("readline");

const MCP_SERVER_URL = "https://app.sprintiq.ai/api/mcp/server";

// Create readline interface for JSON-RPC communication
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Handle incoming JSON-RPC requests from Claude
rl.on("line", async (line) => {
  try {
    const request = JSON.parse(line);

    // Forward the request to our SprintiQ MCP server
    const response = await makeHttpRequest(request);

    // Send response back to Claude
    console.log(JSON.stringify(response));
  } catch (error) {
    // Send error response back to Claude
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

function makeHttpRequest(data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);

    const options = {
      hostname: "app.sprintiq.ai",
      port: 443,
      path: "/api/mcp/server",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(postData),
      },
    };

    const req = https.request(options, (res) => {
      let body = "";

      res.on("data", (chunk) => {
        body += chunk;
      });

      res.on("end", () => {
        try {
          const response = JSON.parse(body);
          resolve(response);
        } catch (error) {
          reject(new Error(`Invalid JSON response: ${body}`));
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

// Handle graceful shutdown
process.on("SIGINT", () => {
  rl.close();
  process.exit(0);
});

process.on("SIGTERM", () => {
  rl.close();
  process.exit(0);
});
