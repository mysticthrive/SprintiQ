import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import JiraAPI from "@/lib/jira-api";

export async function POST(
  request: NextRequest,
  { params }: { params: { workspaceId: string } }
) {
  try {
    console.log("Export API called for workspace:", params.workspaceId);

    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // First, find the workspace by workspace_id (short ID)
    const { data: workspace, error: workspaceError } = await supabase
      .from("workspaces")
      .select("id, name")
      .eq("workspace_id", params.workspaceId)
      .single();

    if (workspaceError || !workspace) {
      console.error("Workspace not found:", workspaceError);
      return NextResponse.json(
        { error: "Workspace not found" },
        { status: 404 }
      );
    }

    console.log("Found workspace:", {
      shortId: params.workspaceId,
      uuid: workspace.id,
      name: workspace.name,
    });

    const body = await request.json();
    console.log("Export request body:", {
      hasJiraCredentials: !!body.jiraCredentials,
      projectKey: body.projectKey,
      projectName: body.projectName,
      createNewProject: body.createNewProject,
      selectedProjectId: body.selectedProjectId,
      selectedSpaceId: body.selectedSpaceId,
      statusMappingsCount: body.statusMappings?.length || 0,
    });

    const {
      jiraCredentials,
      projectKey,
      projectName,
      createNewProject,
      statusMappings,
      selectedProjectId,
      selectedSpaceId,
    } = body;

    // Validate required fields
    if (!jiraCredentials || !projectKey || !statusMappings) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Debug: Check if selectedProjectId is provided
    if (!selectedProjectId) {
      console.error("No selectedProjectId provided in request");
      return NextResponse.json(
        { error: "No project selected for export" },
        { status: 400 }
      );
    }

    console.log("Selected project ID for export:", selectedProjectId);

    // Debug: Check if the project exists
    const { data: projectData, error: projectError } = await supabase
      .from("projects")
      .select("id, name, project_id")
      .eq("id", selectedProjectId)
      .single();

    if (projectError || !projectData) {
      console.error("Project not found:", {
        selectedProjectId,
        error: projectError,
      });
      return NextResponse.json(
        { error: "Selected project not found" },
        { status: 404 }
      );
    }

    console.log("Found project for export:", projectData);

    // Debug: Check tasks in this project
    const { data: projectTasks, error: projectTasksError } = await supabase
      .from("tasks")
      .select("id, name, project_id")
      .eq("project_id", selectedProjectId);

    console.log("Tasks in project:", {
      projectId: selectedProjectId,
      projectName: projectData.name,
      tasksFound: projectTasks?.length || 0,
      error: projectTasksError,
      sampleTasks: projectTasks
        ?.slice(0, 3)
        .map((t) => ({ id: t.id, name: t.name })),
    });

    // Initialize Jira API
    const jiraApi = new JiraAPI({
      domain: jiraCredentials.jira_domain,
      email: jiraCredentials.jira_email,
      apiToken: jiraCredentials.jira_api_token,
    });

    // Step 1: Create project if needed
    let finalProjectKey = projectKey;
    if (createNewProject) {
      try {
        console.log("Creating new project:", { projectName, projectKey });

        // Get current user info from Jira for project lead
        console.log("Getting current user info from Jira...");
        const currentUser = await jiraApi.getCurrentUser();
        console.log("Current Jira user:", {
          accountId: currentUser.accountId,
          displayName: currentUser.displayName,
          emailAddress: currentUser.emailAddress,
        });

        if (!currentUser.accountId) {
          throw new Error(
            "Could not retrieve current user's account ID from Jira"
          );
        }

        const projectData = {
          key: projectKey,
          name: projectName,
          description: `Project exported from SprintiQ workspace: ${workspace.name}`,
          projectTypeKey: "software", // Default to software project
          leadAccountId: currentUser.accountId, // Use the account ID from Jira
        };

        console.log("Attempting to create project with data:", projectData);

        const newProject = await jiraApi.createProject(projectData);
        console.log("Created new Jira project:", newProject);
        finalProjectKey = newProject.key;
      } catch (error: any) {
        console.error("Error creating project:", error);

        // Check if it's a project lead issue
        if (error.message && error.message.includes("project lead")) {
          return NextResponse.json(
            {
              error: `Invalid project lead. Please ensure your Jira account has admin permissions to create projects.`,
            },
            { status: 400 }
          );
        }

        // Check if it's a project key conflict
        if (error.message && error.message.includes("uses this project key")) {
          return NextResponse.json(
            {
              error: `Project key '${projectKey}' already exists. Please choose a different project key.`,
            },
            { status: 400 }
          );
        }

        // Check if it's a permission issue
        if (error.message && error.message.includes("permission")) {
          return NextResponse.json(
            {
              error: `Permission denied. Please ensure your Jira account has admin permissions to create projects.`,
            },
            { status: 400 }
          );
        }

        return NextResponse.json(
          {
            error: `Failed to create Jira project: ${error.message}`,
          },
          { status: 500 }
        );
      }
    }

    // Step 2: Fetch tasks to export
    console.log("Fetching tasks with filters:", {
      workspaceId: workspace.id,
      selectedProjectId,
      selectedSpaceId,
    });

    let tasksQuery = supabase
      .from("tasks")
      .select(
        `
        *,
        status:statuses(*),
        project:projects(*),
        space:spaces(*)
      `
      )
      .eq("workspace_id", workspace.id);

    if (selectedProjectId) {
      console.log("Filtering by project ID:", selectedProjectId);
      tasksQuery = tasksQuery.eq("project_id", selectedProjectId);
    } else if (selectedSpaceId) {
      console.log("Filtering by space ID:", selectedSpaceId);
      tasksQuery = tasksQuery.eq("space_id", selectedSpaceId);
    }

    console.log("Executing tasks query...");
    const { data: tasks, error: tasksError } = await tasksQuery;

    console.log("Tasks query result:", {
      hasData: !!tasks,
      dataLength: tasks?.length || 0,
      hasError: !!tasksError,
      error: tasksError,
      queryFilters: {
        workspaceId: workspace.id,
        selectedProjectId,
        selectedSpaceId,
      },
    });

    if (tasksError) {
      console.error("Error fetching tasks:", tasksError);
      return NextResponse.json(
        { error: "Failed to fetch tasks" },
        { status: 500 }
      );
    }

    if (!tasks || tasks.length === 0) {
      console.log("No tasks found. Debug info:", {
        workspaceId: workspace.id,
        selectedProjectId,
        selectedSpaceId,
        totalTasksInWorkspace: await supabase
          .from("tasks")
          .select("*", { count: "exact", head: true })
          .eq("workspace_id", workspace.id)
          .then((result) => result.count),
        tasksInProject: selectedProjectId
          ? await supabase
              .from("tasks")
              .select("*", { count: "exact", head: true })
              .eq("project_id", selectedProjectId)
              .then((result) => result.count)
          : "N/A",
      });
      return NextResponse.json(
        { error: "No tasks found to export" },
        { status: 400 }
      );
    }

    console.log(`Found ${tasks.length} tasks to export`);
    console.log(
      "Sample tasks:",
      tasks.slice(0, 3).map((t) => ({
        id: t.id,
        name: t.name,
        project_id: t.project_id,
        project_name: t.project?.name,
      }))
    );

    // Step 3: Export tasks to Jira
    let exportedCount = 0;
    let failedCount = 0;
    const exportedTasks: any[] = [];

    // First, get available issue types for the project
    let availableIssueTypes: any[] = [];
    try {
      console.log(
        "Fetching available issue types for project:",
        finalProjectKey
      );
      availableIssueTypes = await jiraApi.getProjectIssueTypes(finalProjectKey);
      console.log(
        "Available issue types:",
        availableIssueTypes.map((it) => ({ id: it.id, name: it.name }))
      );
    } catch (error) {
      console.error("Failed to fetch issue types:", error);
      // Continue with default issue type
    }

    // Get available priorities
    let availablePriorities: any[] = [];
    try {
      console.log("Fetching available priorities");
      availablePriorities = await jiraApi.getPriorities();
      console.log(
        "Available priorities:",
        availablePriorities.map((p) => ({ id: p.id, name: p.name }))
      );
    } catch (error) {
      console.error("Failed to fetch priorities:", error);
    }

    for (const task of tasks) {
      try {
        console.log(`Processing task: ${task.id} - ${task.name}`);

        // Find the mapped Jira status
        const statusMapping = statusMappings.find(
          (m: any) => m.localStatusId === task.status_id
        );

        if (!statusMapping) {
          console.warn(
            `No status mapping found for task ${task.id}, using first available status`
          );
        }

        // Determine issue type - try to find "Task" or "Story" or use the first available
        let issueType = "Task";
        if (availableIssueTypes.length > 0) {
          const taskType = availableIssueTypes.find(
            (it) =>
              it.name.toLowerCase() === "task" ||
              it.name.toLowerCase() === "story" ||
              it.name.toLowerCase() === "issue"
          );
          if (taskType) {
            issueType = taskType.name;
          } else {
            issueType = availableIssueTypes[0].name;
          }
        }

        // Determine priority
        let priority = "Medium";
        if (availablePriorities.length > 0) {
          const mediumPriority = availablePriorities.find(
            (p) =>
              p.name.toLowerCase() === "medium" ||
              p.name.toLowerCase() === "normal"
          );
          if (mediumPriority) {
            priority = mediumPriority.name;
          } else {
            priority = availablePriorities[0].name;
          }
        }

        // Prepare task data for Jira
        const jiraIssueData = {
          summary: task.name,
          description: task.description || "",
          issueType: issueType,
          priority: priority,
          // Note: Assignee mapping would need additional logic
        };

        console.log(`Creating Jira issue for task ${task.id}:`, jiraIssueData);

        // Create issue in Jira
        const jiraIssue = await jiraApi.createIssue(
          finalProjectKey,
          jiraIssueData
        );

        console.log(`Created Jira issue: ${jiraIssue.key} for task ${task.id}`);

        // Update task in database to mark as exported
        const { error: updateError } = await supabase
          .from("tasks")
          .update({
            type: "jira",
            external_id: jiraIssue.key,
            external_data: {
              jira_issue_id: jiraIssue.id,
              jira_project_key: finalProjectKey,
              last_synced_at: new Date().toISOString(),
            },
            last_synced_at: new Date().toISOString(),
            sync_status: "synced",
          })
          .eq("id", task.id);

        if (updateError) {
          console.error("Error updating task:", updateError);
        }

        exportedTasks.push({
          taskId: task.id,
          jiraIssueKey: jiraIssue.key,
          jiraIssueId: jiraIssue.id,
        });

        exportedCount++;
      } catch (error) {
        console.error(`Error exporting task ${task.id}:`, error);
        failedCount++;
      }
    }

    // Step 4: Update project type if exporting from a specific project
    if (selectedProjectId) {
      console.log(`Updating project ${selectedProjectId} to Jira type`);
      const { error: projectUpdateError } = await supabase
        .from("projects")
        .update({
          type: "jira",
          external_id: finalProjectKey,
          external_data: {
            jira_project_key: finalProjectKey,
            last_synced_at: new Date().toISOString(),
          },
        })
        .eq("id", selectedProjectId);

      if (projectUpdateError) {
        console.error("Error updating project:", projectUpdateError);
      }
    }

    // Step 5: Create or update Jira integration record
    console.log("Creating/updating Jira integration record");
    const { data: existingIntegration } = await supabase
      .from("jira_integrations")
      .select("*")
      .eq("workspace_id", workspace.id) // Use the actual workspace UUID
      .single();

    if (existingIntegration) {
      // Update existing integration
      await supabase
        .from("jira_integrations")
        .update({
          jira_domain: jiraCredentials.jira_domain,
          jira_email: jiraCredentials.jira_email,
          jira_api_token: jiraCredentials.jira_api_token,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingIntegration.id);
    } else {
      // Create new integration
      await supabase.from("jira_integrations").insert({
        workspace_id: workspace.id, // Use the actual workspace UUID
        jira_domain: jiraCredentials.jira_domain,
        jira_email: jiraCredentials.jira_email,
        jira_api_token: jiraCredentials.jira_api_token,
        is_active: true,
      });
    }

    console.log("Export completed successfully:", {
      exportedCount,
      failedCount,
      totalTasks: tasks.length,
    });

    return NextResponse.json({
      success: true,
      data: {
        tasksExported: exportedCount,
        tasksFailed: failedCount,
        totalTasks: tasks.length,
        exportedTasks,
        projectKey: finalProjectKey,
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json(
      { error: "Failed to export data to Jira" },
      { status: 500 }
    );
  }
}
