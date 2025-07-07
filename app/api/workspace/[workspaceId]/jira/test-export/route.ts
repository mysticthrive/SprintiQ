import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import JiraAPI from "@/lib/jira-api";

export async function POST(
  request: NextRequest,
  { params }: { params: { workspaceId: string } }
) {
  try {
    console.log("Test export API called for workspace:", params.workspaceId);

    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    console.log("Test export request body:", body);

    const { jiraCredentials, projectKey, selectedProjectId } = body;

    // Validate required fields
    if (!jiraCredentials || !projectKey) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Initialize Jira API
    const jiraApi = new JiraAPI({
      domain: jiraCredentials.jira_domain,
      email: jiraCredentials.jira_email,
      apiToken: jiraCredentials.jira_api_token,
    });

    // Test 1: Test connection
    console.log("Testing Jira connection...");
    const connectionTest = await jiraApi.testConnection();
    console.log("Connection test result:", connectionTest);

    // Test 2: Get project info
    console.log("Getting project info...");
    let projectInfo;
    try {
      // Use the projects endpoint to get project info
      const projects = await jiraApi.getProjects();
      projectInfo = projects.find((p) => p.key === projectKey);
      if (!projectInfo) {
        throw new Error(`Project ${projectKey} not found`);
      }
      console.log("Project info:", projectInfo);
    } catch (error: any) {
      console.error("Failed to get project info:", error);
      return NextResponse.json(
        {
          error: "Failed to get project info",
          details: error.message,
        },
        { status: 500 }
      );
    }

    // Test 3: Get issue types
    console.log("Getting issue types...");
    let issueTypes;
    try {
      issueTypes = await jiraApi.getProjectIssueTypes(projectKey);
      console.log("Issue types:", issueTypes);
    } catch (error: any) {
      console.error("Failed to get issue types:", error);
      return NextResponse.json(
        {
          error: "Failed to get issue types",
          details: error.message,
        },
        { status: 500 }
      );
    }

    // Test 4: Get priorities
    console.log("Getting priorities...");
    let priorities;
    try {
      priorities = await jiraApi.getPriorities();
      console.log("Priorities:", priorities);
    } catch (error: any) {
      console.error("Failed to get priorities:", error);
      return NextResponse.json(
        {
          error: "Failed to get priorities",
          details: error.message,
        },
        { status: 500 }
      );
    }

    // Test 5: Create a test issue
    console.log("Creating test issue...");
    let testIssue;
    try {
      const issueType =
        issueTypes.find(
          (it) =>
            it.name.toLowerCase() === "task" ||
            it.name.toLowerCase() === "story" ||
            it.name.toLowerCase() === "issue"
        ) || issueTypes[0];

      const priority =
        priorities.find(
          (p) =>
            p.name.toLowerCase() === "medium" ||
            p.name.toLowerCase() === "normal"
        ) || priorities[0];

      testIssue = await jiraApi.createIssue(projectKey, {
        summary: "Test Issue from SprintIQ Export",
        description: "This is a test issue created during the export process.",
        issueType: issueType.name,
        priority: priority.name,
      });
      console.log("Test issue created:", testIssue);
    } catch (error: any) {
      console.error("Failed to create test issue:", error);
      return NextResponse.json(
        {
          error: "Failed to create test issue",
          details: error.message,
        },
        { status: 500 }
      );
    }

    // Test 6: Get tasks from database
    console.log("Getting tasks from database...");
    const { data: workspace } = await supabase
      .from("workspaces")
      .select("id")
      .eq("workspace_id", params.workspaceId)
      .single();

    if (!workspace) {
      return NextResponse.json(
        { error: "Workspace not found" },
        { status: 404 }
      );
    }

    const { data: tasks, error: tasksError } = await supabase
      .from("tasks")
      .select(
        `
        *,
        status:statuses(*),
        project:projects(*)
      `
      )
      .eq("workspace_id", workspace.id)
      .eq("project_id", selectedProjectId)
      .limit(5); // Just get first 5 tasks for testing

    if (tasksError) {
      console.error("Error fetching tasks:", tasksError);
      return NextResponse.json(
        {
          error: "Failed to fetch tasks",
          details: tasksError.message,
        },
        { status: 500 }
      );
    }

    console.log("Found tasks:", tasks?.length || 0);

    return NextResponse.json({
      success: true,
      data: {
        connectionTest,
        projectInfo: {
          key: projectInfo.key,
          name: projectInfo.name,
          id: projectInfo.id,
        },
        issueTypes: issueTypes.map((it) => ({ id: it.id, name: it.name })),
        priorities: priorities.map((p) => ({ id: p.id, name: p.name })),
        testIssue: {
          key: testIssue.key,
          id: testIssue.id,
          summary: testIssue.fields.summary,
        },
        tasksFound: tasks?.length || 0,
        sampleTasks: tasks?.slice(0, 2).map((t) => ({
          id: t.id,
          name: t.name,
          status: t.status?.name,
          project: t.project?.name,
        })),
      },
    });
  } catch (error: any) {
    console.error("Test export error:", error);
    return NextResponse.json(
      { error: "Test export failed", details: error.message },
      { status: 500 }
    );
  }
}
