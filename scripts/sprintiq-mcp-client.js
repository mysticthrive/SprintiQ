#!/usr/bin/env node

/**
 * SprintiQ MCP Client - Production Version
 *
 * This script allows international users to connect their AI tools
 * (Claude, Cursor, etc.) to SprintiQ's MCP server.
 *
 * Usage:
 * 1. Download this script
 * 2. Make it executable: chmod +x sprintiq-mcp-client.js
 * 3. Add to your AI tool configuration
 * 4. Set SPRINTIQ_MCP_URL environment variable (optional)
 *
 * Version: 1.0.0
 * Author: SprintiQ Team
 * License: MIT
 */

const http = require("http");
const https = require("https");
const readline = require("readline");
const { URL } = require("url");
const fs = require("fs");
const path = require("path");

// Configuration
const DEFAULT_MCP_URL = "https://app.sprintiq.ai/api/mcp/server";
const MCP_SERVER_URL = process.env.SPRINTIQ_MCP_URL || DEFAULT_MCP_URL;
const CLIENT_VERSION = "1.0.0";
const TIMEOUT_MS = 30000; // 30 seconds
const MAX_RETRIES = 3;

// Logging configuration
const LOG_LEVEL = process.env.LOG_LEVEL || "info"; // error, warn, info, debug
const LOG_FILE = process.env.LOG_FILE || null;

// Initialize logger
const logger = {
  error: (msg, ...args) => log("ERROR", msg, ...args),
  warn: (msg, ...args) => log("WARN", msg, ...args),
  info: (msg, ...args) => log("INFO", msg, ...args),
  debug: (msg, ...args) => log("DEBUG", msg, ...args),
};

function log(level, message, ...args) {
  if (shouldLog(level)) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level}] ${message}`;

    if (LOG_FILE) {
      try {
        fs.appendFileSync(LOG_FILE, logMessage + "\n");
      } catch (error) {
        console.error("Failed to write to log file:", error.message);
      }
    }

    // Only output to stderr for non-JSON-RPC messages
    if (level === "ERROR" || level === "WARN") {
      console.error(logMessage, ...args);
    } else if (LOG_LEVEL === "debug") {
      console.error(logMessage, ...args);
    }
  }
}

function shouldLog(level) {
  const levels = { ERROR: 0, WARN: 1, INFO: 2, DEBUG: 3 };
  const currentLevel = levels[LOG_LEVEL.toUpperCase()] || 2;
  return levels[level] <= currentLevel;
}

// Create readline interface for JSON-RPC communication
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

logger.info(`SprintiQ MCP Client v${CLIENT_VERSION} starting...`);
logger.info(`Connecting to: ${MCP_SERVER_URL}`);

// Validate server URL
try {
  new URL(MCP_SERVER_URL);
} catch (error) {
  logger.error("Invalid MCP server URL:", MCP_SERVER_URL);
  process.exit(1);
}

// Statistics tracking
let stats = {
  requestCount: 0,
  errorCount: 0,
  startTime: Date.now(),
  lastRequestTime: null,
};

// Handle incoming JSON-RPC requests
rl.on("line", async (line) => {
  stats.requestCount++;
  stats.lastRequestTime = Date.now();

  try {
    const request = JSON.parse(line);
    logger.debug("Received request:", request.method, request.id);

    // Forward the request to SprintiQ MCP server
    const response = await makeHttpRequestWithRetry(request);

    // Send response back to the AI tool
    console.log(JSON.stringify(response));

    logger.debug("Sent response for request:", request.id);
  } catch (error) {
    stats.errorCount++;
    logger.error("Request processing error:", error.message);

    // Send error response back
    const errorResponse = {
      jsonrpc: "2.0",
      id: null,
      error: {
        code: -32603,
        message: "Internal error",
        data: error.message,
      },
    };

    console.log(JSON.stringify(errorResponse));
  }
});

async function makeHttpRequestWithRetry(request, retries = 0) {
  try {
    return await makeHttpRequest(request);
  } catch (error) {
    if (retries < MAX_RETRIES) {
      const delay = Math.pow(2, retries) * 1000; // Exponential backoff
      logger.warn(
        `Request failed, retrying in ${delay}ms (attempt ${
          retries + 1
        }/${MAX_RETRIES}):`,
        error.message
      );

      await new Promise((resolve) => setTimeout(resolve, delay));
      return makeHttpRequestWithRetry(request, retries + 1);
    }

    throw error;
  }
}

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
      "User-Agent": `SprintiQ-MCP-Client/${CLIENT_VERSION}`,
      Accept: "application/json",
    },
    timeout: TIMEOUT_MS,
  };

  return new Promise((resolve, reject) => {
    const req = httpModule.request(options, (res) => {
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        try {
          if (res.statusCode !== 200) {
            reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
            return;
          }

          const response = JSON.parse(data);
          resolve(response);
        } catch (error) {
          reject(
            new Error(`Invalid JSON response: ${data.substring(0, 100)}...`)
          );
        }
      });
    });

    req.on("error", (error) => {
      reject(new Error(`Network error: ${error.message}`));
    });

    req.on("timeout", () => {
      req.destroy();
      reject(new Error(`Request timeout after ${TIMEOUT_MS}ms`));
    });

    req.write(postData);
    req.end();
  });
}

// Health check on startup
async function healthCheck() {
  try {
    const healthRequest = {
      jsonrpc: "2.0",
      id: "health-check",
      method: "server/info",
      params: {},
    };

    const response = await makeHttpRequest(healthRequest);

    if (response.result) {
      logger.info("Health check passed - server is healthy");
      logger.info("Server info:", response.result);
      return true;
    } else {
      logger.warn("Health check failed - unexpected response");
      return false;
    }
  } catch (error) {
    logger.error("Health check failed:", error.message);
    return false;
  }
}

// Graceful shutdown
function shutdown() {
  const uptime = Date.now() - stats.startTime;
  logger.info("SprintiQ MCP Client shutting down...");
  logger.info(
    `Session stats: ${stats.requestCount} requests, ${
      stats.errorCount
    } errors, uptime: ${Math.floor(uptime / 1000)}s`
  );

  rl.close();
  process.exit(0);
}

// Handle process termination
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  logger.error("Uncaught exception:", error.message);
  logger.error("Stack trace:", error.stack);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled rejection at:", promise, "reason:", reason);
  process.exit(1);
});

// Periodic stats logging (every 5 minutes)
setInterval(() => {
  const uptime = Date.now() - stats.startTime;
  logger.info(
    `Stats: ${stats.requestCount} requests, ${
      stats.errorCount
    } errors, uptime: ${Math.floor(uptime / 1000)}s`
  );
}, 5 * 60 * 1000);

// Perform health check on startup
(async () => {
  const healthy = await healthCheck();
  if (!healthy) {
    logger.warn("Server health check failed, but continuing anyway...");
  }
})();

logger.info("SprintiQ MCP Client ready - waiting for requests...");
