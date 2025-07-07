import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import JiraAPI from "@/lib/jira-api";
import { JiraConverter } from "@/lib/jira-converter";
import type { JiraIntegration, Task, Status } from "@/lib/database.types";
import { mapJiraStatusColor } from "@/lib/utils";

export async function POST(
  request: NextRequest,
  { params }: { params: { workspaceId: string } }
) {
  try {
    const supabase = await createServerSupabaseClient();
    const { projectId } = await request.json();

    if (!projectId) {
      return NextResponse.json(
        { error: "Project ID is required" },
        { status: 400 }
      );
    }

    console.log(`Starting Jira sync for project: ${projectId}`);

    // Get workspace
    const { data: workspace, error: workspaceError } = await supabase
      .from("workspaces")
      .select("*")
      .eq("workspace_id", params.workspaceId)
      .single();

    if (workspaceError || !workspace) {
      return NextResponse.json(
        { error: "Workspace not found" },
        { status: 404 }
      );
    }

    // Get project and check if it's a Jira project
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .eq("workspace_id", workspace.id)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (project.type !== "jira" || !project.external_id) {
      return NextResponse.json(
        { error: "Project is not a Jira project" },
        { status: 400 }
      );
    }

    console.log(
      `Project ${project.name} is a Jira project with external ID: ${project.external_id}`
    );

    // Get Jira integration
    const { data: integration, error: integrationError } = await supabase
      .from("jira_integrations")
      .select("*")
      .eq("workspace_id", workspace.id)
      .eq("is_active", true)
      .single();

    if (integrationError || !integration) {
      return NextResponse.json(
        { error: "Jira integration not found" },
        { status: 404 }
      );
    }

    // Get space
    const { data: space, error: spaceError } = await supabase
      .from("spaces")
      .select("*")
      .eq("id", project.space_id)
      .single();

    if (spaceError || !space) {
      return NextResponse.json({ error: "Space not found" }, { status: 404 });
    }

    // Get Jira project mapping
    let { data: jiraProject, error: jiraProjectError } = await supabase
      .from("jira_projects")
      .select("*")
      .eq("jira_integration_id", integration.id)
      .eq("jira_project_id", project.external_id)
      .single();

    if (jiraProjectError || !jiraProject) {
      // Try to create the mapping from project's external_data if it doesn't exist
      if (project.external_data && project.external_data.jira_project_key) {
        console.log(
          `Creating missing jira_projects mapping for project: ${project.name}`
        );

        const { data: newJiraProject, error: createError } = await supabase
          .from("jira_projects")
          .insert({
            jira_integration_id: integration.id,
            jira_project_id: project.external_id,
            jira_project_key: project.external_data.jira_project_key,
            jira_project_name: project.name,
            jira_project_description:
              project.external_data.jira_project_description || null,
            jira_project_lead: project.external_data.jira_project_lead || null,
            jira_project_url: project.external_data.jira_project_url || null,
            space_id: project.space_id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (createError) {
          console.error("Failed to create jira_projects mapping:", createError);
          return NextResponse.json(
            { error: "Failed to create Jira project mapping" },
            { status: 500 }
          );
        }

        console.log(
          `Created jira_projects mapping for key: ${newJiraProject.jira_project_key}`
        );
        jiraProject = newJiraProject;
      } else {
        return NextResponse.json(
          { error: "Jira project mapping not found and cannot be created" },
          { status: 404 }
        );
      }
    }

    console.log(
      `Found Jira project mapping for key: ${jiraProject.jira_project_key}`
    );

    // Initialize Jira API
    const jiraAPI = new JiraAPI({
      domain: integration.jira_domain,
      email: integration.jira_email,
      apiToken: integration.jira_api_token,
    });

    // Get latest data from Jira
    console.log(
      `Fetching latest data from Jira for project: ${jiraProject.jira_project_key}`
    );
    const [jiraIssues, jiraStatuses] = await Promise.all([
      jiraAPI.getProjectIssues(jiraProject.jira_project_key),
      jiraAPI.getProjectStatuses(jiraProject.jira_project_key),
    ]);

    console.log(
      `Retrieved ${jiraIssues.length} issues and ${jiraStatuses.length} statuses from Jira`
    );

    // Get existing tasks and statuses for this project
    const { data: existingTasks, error: tasksError } = await supabase
      .from("tasks")
      .select("*")
      .eq("project_id", project.id)
      .eq("type", "jira");

    if (tasksError) {
      throw new Error(`Failed to fetch existing tasks: ${tasksError.message}`);
    }

    const { data: existingStatuses, error: statusesError } = await supabase
      .from("statuses")
      .select("*")
      .eq("project_id", project.id)
      .eq("integration_type", "jira");

    if (statusesError) {
      throw new Error(
        `Failed to fetch existing statuses: ${statusesError.message}`
      );
    }

    console.log(
      `Found ${existingTasks?.length || 0} existing tasks and ${
        existingStatuses?.length || 0
      } existing statuses`
    );

    // Create maps for quick lookup
    const existingTaskMap = new Map(
      existingTasks?.map((task: Task) => [task.external_id, task]) || []
    );
    const existingStatusMap = new Map(
      existingStatuses?.map((status: Status) => [status.external_id, status]) ||
        []
    );

    // Update or create statuses
    const statusUpdates: any[] = [];
    const statusInserts: any[] = [];

    for (const jiraStatus of jiraStatuses) {
      const existingStatus = existingStatusMap.get(jiraStatus.id);

      if (existingStatus) {
        // Update existing status
        statusUpdates.push({
          id: existingStatus.id,
          name: jiraStatus.name,
          color: mapJiraStatusColor(jiraStatus.statusCategory.colorName),
          external_data: {
            status_category: jiraStatus.statusCategory.key,
            color_name: jiraStatus.statusCategory.colorName,
          },
          updated_at: new Date().toISOString(),
        });
      } else {
        // Create new status
        const converter = new JiraConverter(
          supabase,
          workspace,
          space,
          integration
        );
        const newStatus = await converter.convertJiraStatusToStatus(
          jiraStatus,
          project.id
        );
        statusInserts.push(newStatus);
      }
    }

    console.log(
      `Updating ${statusUpdates.length} statuses and creating ${statusInserts.length} new statuses`
    );

    // Update statuses
    if (statusUpdates.length > 0) {
      const { error: updateError } = await supabase
        .from("statuses")
        .upsert(statusUpdates);

      if (updateError) {
        throw new Error(`Failed to update statuses: ${updateError.message}`);
      }
    }

    // Insert new statuses
    if (statusInserts.length > 0) {
      const { data: newStatuses, error: insertError } = await supabase
        .from("statuses")
        .insert(statusInserts)
        .select();

      if (insertError) {
        throw new Error(`Failed to insert statuses: ${insertError.message}`);
      }

      // Add new statuses to the map
      newStatuses?.forEach((status) => {
        if (status.external_id) {
          existingStatusMap.set(status.external_id, status);
        }
      });
    }

    // Update or create tasks
    const taskUpdates: any[] = [];
    const taskInserts: any[] = [];

    for (const jiraIssue of jiraIssues) {
      const existingTask = existingTaskMap.get(jiraIssue.id);
      const statusId = existingStatusMap.get(jiraIssue.fields.status.id)?.id;

      if (!statusId) {
        console.warn(`Status not found for issue ${jiraIssue.key}, skipping`);
        continue;
      }

      console.log(`=>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> ${jiraIssue}`);
      if (existingTask) {
        // Update existing task
        taskUpdates.push({
          id: existingTask.id,
          name: jiraIssue.fields.summary,
          description: jiraIssue.fields.description || null,
          status_id: statusId,
          priority: mapJiraPriority(jiraIssue.fields.priority?.name),
          due_date: jiraIssue.fields.duedate || null,
          external_data: {
            jira_key: jiraIssue.key,
            jira_priority: jiraIssue.fields.priority?.name,
            jira_assignee: jiraIssue.fields.assignee,
            jira_issue_type: "story",
          },
          updated_at: new Date().toISOString(),
        });
      } else {
        // Create new task
        const converter = new JiraConverter(
          supabase,
          workspace,
          space,
          integration
        );
        const newTask = await converter.convertJiraIssueToTask(
          jiraIssue,
          project.id,
          statusId
        );
        taskInserts.push(newTask);
      }
    }

    console.log(
      `Updating ${taskUpdates.length} tasks and creating ${taskInserts.length} new tasks`
    );

    // Update tasks
    if (taskUpdates.length > 0) {
      const { error: updateError } = await supabase
        .from("tasks")
        .upsert(taskUpdates);

      if (updateError) {
        throw new Error(`Failed to update tasks: ${updateError.message}`);
      }
    }

    // Insert new tasks
    if (taskInserts.length > 0) {
      const { error: insertError } = await supabase
        .from("tasks")
        .insert(taskInserts);

      if (insertError) {
        throw new Error(`Failed to insert tasks: ${insertError.message}`);
      }
    }

    // Update project's updated_at timestamp
    await supabase
      .from("projects")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", project.id);

    console.log(`Sync completed successfully for project: ${project.name}`);

    return NextResponse.json({
      success: true,
      message: "Jira data synced successfully",
      data: {
        tasksUpdated: taskUpdates.length,
        tasksCreated: taskInserts.length,
        statusesUpdated: statusUpdates.length,
        statusesCreated: statusInserts.length,
      },
    });
  } catch (error: any) {
    console.error("Jira sync error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to sync Jira data" },
      { status: 500 }
    );
  }
}

function mapJiraPriority(priority?: string): string {
  if (!priority) return "medium";

  const priorityMap: Record<string, string> = {
    Highest: "critical",
    High: "high",
    Medium: "medium",
    Low: "low",
    Lowest: "low",
  };

  return priorityMap[priority] || "medium";
}
