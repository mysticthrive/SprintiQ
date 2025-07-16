/**
 * Test script for MCP Email-Based User Validation
 *
 * This script demonstrates how to use the new email-based MCP validation
 * functionality to authenticate users and execute MCP tools.
 *
 * Usage:
 * node test-mcp-email-validation.js
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

/**
 * Test the email validation API endpoint
 */
async function testEmailValidation() {
  console.log("🔍 Testing MCP Email Validation...\n");

  // Test cases
  const testCases = [
    {
      name: "Valid User",
      email: "droberts@beejern.com",
      expectedValid: true,
    },
    {
      name: "Non-existent User",
      email: "nonexistent@example.com",
      expectedValid: false,
    },
    {
      name: "Invalid Email Format",
      email: "invalid-email",
      expectedValid: false,
    },
  ];

  for (const testCase of testCases) {
    console.log(`📧 Testing: ${testCase.name}`);
    console.log(`   Email: ${testCase.email}`);

    try {
      // Test GET endpoint (quick validation)
      const response = await fetch(
        `${API_BASE_URL}/api/mcp/validate-user?email=${encodeURIComponent(
          testCase.email
        )}`
      );
      const data = await response.json();

      console.log(`   Status: ${response.status}`);
      console.log(`   Valid: ${data.isValid}`);

      if (data.isValid) {
        console.log(`   User: ${data.userName}`);
        console.log(`   Workspaces: ${data.hasWorkspaces}`);
      } else {
        console.log(`   Error: ${data.error}`);
      }

      // Test POST endpoint (full validation with context)
      if (data.isValid) {
        console.log(`   📋 Creating context...`);

        const contextResponse = await fetch(
          `${API_BASE_URL}/api/mcp/validate-user`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email: testCase.email,
              workspaceId: null, // Will use first workspace
              projectId: null,
              sprintId: null,
              teamId: null,
            }),
          }
        );

        const contextData = await contextResponse.json();

        if (contextData.isValid) {
          console.log(`   ✅ Context created successfully`);
          console.log(
            `   Workspace: ${contextData.context.workspaceData?.name}`
          );
          console.log(
            `   Permissions: ${contextData.context.permissions.join(", ")}`
          );
          console.log(
            `   Available workspaces: ${contextData.user.workspaces.length}`
          );

          // Show workspace details
          contextData.user.workspaces.forEach((workspace, index) => {
            console.log(
              `     ${index + 1}. ${workspace.name} (${workspace.role})`
            );
            console.log(`        - Spaces: ${workspace.spacesCount}`);
            console.log(`        - Projects: ${workspace.projectsCount}`);
            console.log(`        - Teams: ${workspace.teamsCount}`);
            console.log(`        - Sprints: ${workspace.sprintsCount}`);
          });
        } else {
          console.log(`   ❌ Context creation failed: ${contextData.error}`);
        }
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }

    console.log("");
  }
}

/**
 * Test MCP tool execution with email validation
 */
async function testMCPToolExecution() {
  console.log("🛠️ Testing MCP Tool Execution with Email Validation...\n");

  const testEmail = "droberts@beejern.com";

  // This is a conceptual example - you would need to implement actual MCP tool endpoints
  const toolTests = [
    {
      name: "Generate User Stories",
      endpoint: "/api/mcp/tools/generate-stories",
      params: {
        userEmail: testEmail,
        featureDescription: "User authentication system",
        numberOfStories: 3,
        complexity: "moderate",
      },
    },
    {
      name: "Analyze Task Priority",
      endpoint: "/api/mcp/tools/analyze-priority",
      params: {
        userEmail: testEmail,
        taskIds: ["task1", "task2", "task3"],
      },
    },
    {
      name: "Find Similar Tasks",
      endpoint: "/api/mcp/tools/find-similar",
      params: {
        userEmail: testEmail,
        query: "authentication implementation",
        limit: 5,
      },
    },
  ];

  console.log("📝 Note: Tool execution endpoints would need to be implemented");
  console.log(
    "   These are conceptual examples showing how to structure requests\n"
  );

  toolTests.forEach((test, index) => {
    console.log(`${index + 1}. ${test.name}`);
    console.log(`   Endpoint: ${test.endpoint}`);
    console.log(`   Parameters:`);
    Object.entries(test.params).forEach(([key, value]) => {
      console.log(`     ${key}: ${JSON.stringify(value)}`);
    });
    console.log("");
  });
}

/**
 * Test error handling scenarios
 */
async function testErrorHandling() {
  console.log("⚠️ Testing Error Handling Scenarios...\n");

  const errorTests = [
    {
      name: "Missing Email",
      request: {
        method: "POST",
        body: {},
      },
      expectedStatus: 400,
      expectedError: "Email is required",
    },
    {
      name: "Unapproved User",
      request: {
        method: "POST",
        body: { email: "unapproved@example.com" },
      },
      expectedStatus: 403,
      expectedError: "Account not yet approved",
    },
    {
      name: "Invalid Workspace ID",
      request: {
        method: "POST",
        body: {
          email: "droberts@beejern.com",
          workspaceId: "invalid-workspace-id",
        },
      },
      expectedStatus: 400,
      expectedError: "No accessible workspace found",
    },
  ];

  for (const test of errorTests) {
    console.log(`🔍 Testing: ${test.name}`);

    try {
      const response = await fetch(`${API_BASE_URL}/api/mcp/validate-user`, {
        method: test.request.method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(test.request.body),
      });

      const data = await response.json();

      console.log(
        `   Status: ${response.status} (expected: ${test.expectedStatus})`
      );
      console.log(`   Error: ${data.error}`);

      if (response.status === test.expectedStatus) {
        console.log(`   ✅ Correct error handling`);
      } else {
        console.log(`   ❌ Unexpected response status`);
      }
    } catch (error) {
      console.log(`   ❌ Request failed: ${error.message}`);
    }

    console.log("");
  }
}

/**
 * Main test function
 */
async function runTests() {
  console.log("🧪 MCP Email Validation Test Suite\n");
  console.log("=".repeat(50) + "\n");

  try {
    await testEmailValidation();
    await testMCPToolExecution();
    await testErrorHandling();

    console.log("✅ Test suite completed");
    console.log("\n📋 Next Steps:");
    console.log(
      "1. Ensure your database has test users with proper permissions"
    );
    console.log("2. Implement MCP tool endpoints for your specific use cases");
    console.log("3. Add authentication middleware for production use");
    console.log("4. Set up monitoring and logging for MCP operations");
  } catch (error) {
    console.error("❌ Test suite failed:", error);
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests();
}

module.exports = {
  testEmailValidation,
  testMCPToolExecution,
  testErrorHandling,
  runTests,
};
