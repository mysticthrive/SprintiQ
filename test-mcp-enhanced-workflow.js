#!/usr/bin/env node

/**
 * Test script for Enhanced MCP Workflow
 *
 * This tests the full workflow step by step:
 * 1. Check connection
 * 2. Establish connection
 * 3. Select workspace
 * 4. Select team members
 * 5. Execute tool
 * 6. Handle post-execution choice
 */

const baseUrl = "http://localhost:3000";

async function testEnhancedMCPWorkflow() {
  console.log("🚀 Testing Enhanced MCP Workflow...\n");

  // Test user email
  const userEmail = "droberts@beejern.com";

  try {
    // Step 1: Check connection
    console.log("📋 Step 1: Check connection...");
    const checkConnectionResponse = await fetch(`${baseUrl}/api/mcp/enhanced`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "checkConnection",
        userEmail: userEmail,
      }),
    });

    const checkConnectionResult = await checkConnectionResponse.json();
    console.log(
      "✅ Connection Check Response:",
      JSON.stringify(checkConnectionResult, null, 2)
    );

    // Step 2: Establish connection
    console.log("\n📋 Step 2: Establish connection...");
    const establishConnectionResponse = await fetch(
      `${baseUrl}/api/mcp/enhanced`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "establishConnection",
          userEmail: userEmail,
        }),
      }
    );

    const establishConnectionResult = await establishConnectionResponse.json();
    console.log(
      "✅ Establish Connection Response:",
      JSON.stringify(establishConnectionResult, null, 2)
    );

    // Step 3: Select workspace (if needed)
    console.log("\n📋 Step 3: Select workspace...");
    const selectWorkspaceResponse = await fetch(`${baseUrl}/api/mcp/enhanced`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "selectWorkspace",
        userEmail: userEmail,
        workspaceId: "w583466190559", // Use the actual workspace ID
      }),
    });

    const selectWorkspaceResult = await selectWorkspaceResponse.json();
    console.log(
      "✅ Select Workspace Response:",
      JSON.stringify(selectWorkspaceResult, null, 2)
    );

    // Step 4: Select team members
    console.log("\n📋 Step 4: Select team members...");
    const selectTeamMembersResponse = await fetch(
      `${baseUrl}/api/mcp/enhanced`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "selectTeamMembers",
          userEmail: userEmail,
          selectedTeamMemberIds: ["6bf7f796-88ce-4523-b9ed-1fe18b71f923"],
        }),
      }
    );

    const selectTeamMembersResult = await selectTeamMembersResponse.json();
    console.log(
      "✅ Select Team Members Response:",
      JSON.stringify(selectTeamMembersResult, null, 2)
    );

    // Step 5: Execute tool
    console.log("\n📋 Step 5: Execute tool...");
    const executeToolResponse = await fetch(`${baseUrl}/api/mcp/enhanced`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "executeTool",
        userEmail: userEmail,
        toolName: "generateUserStories",
        params: {
          featureDescription:
            "As a product manager, I want to manage booking system, so that I can quickly manage booking system",
          numberOfStories: 3,
          complexity: "moderate",
        },
        workspaceId: "w583466190559",
        selectedTeamMemberIds: ["6bf7f796-88ce-4523-b9ed-1fe18b71f923"],
      }),
    });

    const executeToolResult = await executeToolResponse.json();
    console.log(
      "✅ Execute Tool Response:",
      JSON.stringify(executeToolResult, null, 2)
    );

    // Step 6: Handle post-execution choice (if needed)
    if (executeToolResult.requiresPostExecutionChoice) {
      console.log("\n📋 Step 6: Handle post-execution choice...");
      const postExecutionResponse = await fetch(`${baseUrl}/api/mcp/enhanced`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "postExecutionChoice",
          userEmail: userEmail,
          postExecutionChoice: "saveAsStoriesOnly",
          storyData: executeToolResult.toolResult,
        }),
      });

      const postExecutionResult = await postExecutionResponse.json();
      console.log(
        "✅ Post-execution Response:",
        JSON.stringify(postExecutionResult, null, 2)
      );
    }

    console.log("\n🎉 Enhanced MCP Workflow Test Complete!");
  } catch (error) {
    console.error("❌ Error testing enhanced MCP workflow:", error);
  }
}

// Run the test
testEnhancedMCPWorkflow();
