import type {
  Project,
  Task,
  Status,
  Workspace,
  Space,
  JiraIntegration,
  JiraProject as JiraProjectType,
} from "@/lib/database.types";
import type { JiraIssue, JiraStatus as JiraStatusType } from "@/lib/jira-api";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { mapJiraStatusColor, convertJiraDescription } from "@/lib/utils";

export interface JiraConversionResult {
  projects: Project[];
  tasks: Task[];
  statuses: Status[];
}

type StatusInsert = Database["public"]["Tables"]["statuses"]["Insert"];
type ProjectInsert = Database["public"]["Tables"]["projects"]["Insert"];
type TaskInsert = Database["public"]["Tables"]["tasks"]["Insert"];

export class JiraConverter {
  private supabase: SupabaseClient;
  private workspace: Workspace;
  private space: Space;
  private integration: JiraIntegration;

  constructor(
    supabase: SupabaseClient,
    workspace: Workspace,
    space: Space,
    integration: JiraIntegration
  ) {
    this.supabase = supabase;
    this.workspace = workspace;
    this.space = space;
    this.integration = integration;
  }

  async convertJiraProjectToProject(
    jiraProject: JiraProjectType
  ): Promise<ProjectInsert> {
    const project: ProjectInsert = {
      name: jiraProject.jira_project_name,
      space_id: this.space.id,
      workspace_id: this.workspace.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      type: "jira",
      external_id: jiraProject.jira_project_id,
      external_data: {
        jira_project_key: jiraProject.jira_project_key,
        jira_project_description: jiraProject.jira_project_description,
        jira_project_lead: jiraProject.jira_project_lead,
        jira_project_url: jiraProject.jira_project_url,
      },
    };

    return project;
  }

  async convertJiraStatusToStatus(
    jiraStatus: JiraStatusType,
    projectId?: string
  ): Promise<StatusInsert> {
    const status: StatusInsert = {
      name: jiraStatus.name,
      color: mapJiraStatusColor(jiraStatus.statusCategory.colorName),
      position: 0, // Will be set based on status category
      workspace_id: this.workspace.id,
      type: "project", // Always set to project since these are Jira project statuses
      status_type_id: null,
      project_id: projectId || null,
      space_id: this.space.id,
      sprint_id: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      integration_type: "jira",
      external_id: jiraStatus.id,
      external_data: {
        status_category: jiraStatus.statusCategory.key,
        color_name: jiraStatus.statusCategory.colorName,
      },
    };

    return status;
  }

  async convertJiraIssueToTask(
    jiraIssue: JiraIssue,
    projectId: string,
    statusId: string,
    parentTaskId?: string
  ): Promise<TaskInsert> {
    const task: TaskInsert = {
      name: jiraIssue.fields.summary,
      description: convertJiraDescription(jiraIssue.fields.description),
      status_id: statusId,
      priority: this.mapJiraPriority(jiraIssue.fields.priority?.name),
      assignee_id: null, // Will be mapped to user ID if found
      project_id: projectId,
      sprint_id: null,
      space_id: this.space.id,
      workspace_id: this.workspace.id,
      start_date: null,
      due_date: jiraIssue.fields.duedate || null,
      parent_task_id: parentTaskId || null,
      created_at: jiraIssue.fields.created,
      updated_at: jiraIssue.fields.updated,
      created_by: null,
      embedding: null,
      type: "jira",
      external_id: jiraIssue.id,
      external_data: {
        jira_key: jiraIssue.key,
        jira_priority: jiraIssue.fields.priority?.name,
        jira_assignee: jiraIssue.fields.assignee,
        jira_issue_type: "story", // Default to story, can be enhanced
      },
    };

    return task;
  }

  private mapJiraPriority(jiraPriority?: string): string {
    const priorityMap: Record<string, string> = {
      Highest: "critical",
      High: "high",
      Medium: "medium",
      Low: "low",
      Lowest: "low",
    };

    return priorityMap[jiraPriority || "Medium"] || "medium";
  }

  async convertAndSave(
    jiraProjects: JiraProjectType[],
    jiraIssues: JiraIssue[],
    jiraStatuses: JiraStatusType[]
  ): Promise<JiraConversionResult> {
    const result: JiraConversionResult = {
      projects: [],
      tasks: [],
      statuses: [],
    };

    try {
      // Check for existing projects to avoid duplicates
      const existingProjects = await this.supabase
        .from("projects")
        .select("external_id")
        .eq("workspace_id", this.workspace.id)
        .eq("space_id", this.space.id)
        .eq("type", "jira");

      const existingProjectIds = new Set(
        existingProjects.data?.map((p) => p.external_id) || []
      );

      // Filter out projects that already exist
      const newProjects = jiraProjects.filter(
        (project) => !existingProjectIds.has(project.jira_project_id)
      );

      // Convert and save only new projects
      const projects = await Promise.all(
        newProjects.map((project) => this.convertJiraProjectToProject(project))
      );

      let savedProjects: any[] = [];
      if (projects.length > 0) {
        const { data: insertedProjects, error: projectError } =
          await this.supabase.from("projects").insert(projects).select();

        if (projectError) {
          throw new Error(`Failed to save projects: ${projectError.message}`);
        }

        savedProjects = insertedProjects || [];
      }

      // Get all projects (existing + new) for the result
      const allProjects = await this.supabase
        .from("projects")
        .select("*")
        .eq("workspace_id", this.workspace.id)
        .eq("space_id", this.space.id)
        .eq("type", "jira");

      result.projects = allProjects.data || [];

      // Check for existing Jira projects to avoid duplicates
      const existingJiraProjects = await this.supabase
        .from("jira_projects")
        .select("jira_project_id")
        .eq("jira_integration_id", this.integration.id);

      const existingJiraProjectIds = new Set(
        existingJiraProjects.data?.map((p) => p.jira_project_id) || []
      );

      // Filter out projects that already exist in jira_projects table
      const newJiraProjects = jiraProjects.filter(
        (project) => !existingJiraProjectIds.has(project.jira_project_id)
      );

      // Create jira_projects table entries only for new projects
      if (newJiraProjects.length > 0) {
        const jiraProjectEntries = newJiraProjects.map(
          (jiraProject, index) => ({
            jira_integration_id: this.integration.id,
            jira_project_id: jiraProject.jira_project_id,
            jira_project_key: jiraProject.jira_project_key,
            jira_project_name: jiraProject.jira_project_name,
            jira_project_description: jiraProject.jira_project_description,
            jira_project_lead: jiraProject.jira_project_lead,
            jira_project_url: jiraProject.jira_project_url,
            space_id: this.space.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
        );

        const { error: jiraProjectError } = await this.supabase
          .from("jira_projects")
          .insert(jiraProjectEntries);

        if (jiraProjectError) {
          throw new Error(
            `Failed to save jira projects: ${jiraProjectError.message}`
          );
        }
      }

      // Convert and save statuses with project associations
      const statuses = await Promise.all(
        jiraStatuses.map(async (status) => {
          // Find the project this status belongs to by checking which project has this status
          // For now, we'll associate all statuses with the first project, but this could be enhanced
          const projectId =
            result.projects.length > 0 ? result.projects[0].id : undefined;
          return this.convertJiraStatusToStatus(status, projectId);
        })
      );

      // Save statuses to database
      const { data: savedStatuses, error: statusError } = await this.supabase
        .from("statuses")
        .insert(statuses)
        .select();

      if (statusError) {
        throw new Error(`Failed to save statuses: ${statusError.message}`);
      }

      result.statuses = savedStatuses || [];

      // Create a map of Jira status IDs to our status IDs
      const statusMap = new Map<string, string>();
      result.statuses.forEach((status) => {
        if (status.external_id) {
          statusMap.set(status.external_id, status.id);
        }
      });

      // Create a map of project external IDs to our project IDs
      const projectMap = new Map<string, string>();
      result.projects.forEach((project) => {
        if (project.external_id) {
          projectMap.set(project.external_id, project.id);
        }
      });

      // Convert and save tasks
      const parentIssues: JiraIssue[] = [];
      const subtaskIssues: JiraIssue[] = [];

      // Separate parent issues and subtasks
      jiraIssues.forEach((issue) => {
        if (issue.fields.parent) {
          subtaskIssues.push(issue);
        } else {
          parentIssues.push(issue);
        }
      });

      // Convert and save parent issues first
      const parentTasks: TaskInsert[] = [];
      for (const issue of parentIssues) {
        // Find the project by matching the issue key prefix with project key
        const projectKey = issue.key.split("-")[0];
        const project = result.projects.find(
          (p) => (p.external_data as any)?.jira_project_key === projectKey
        );
        const projectId = project?.id;
        const statusId = statusMap.get(issue.fields.status.id);

        if (projectId && statusId) {
          const task = await this.convertJiraIssueToTask(
            issue,
            projectId,
            statusId
          );
          parentTasks.push(task);
        }
      }

      // Save parent tasks to database first
      const { data: savedParentTasks, error: parentTaskError } =
        await this.supabase.from("tasks").insert(parentTasks).select();

      if (parentTaskError) {
        throw new Error(
          `Failed to save parent tasks: ${parentTaskError.message}`
        );
      }

      // Create a map of Jira issue IDs to our task IDs for parent-child relationships
      const jiraIssueToTaskIdMap = new Map<string, string>();
      savedParentTasks?.forEach((task) => {
        if (task.external_id) {
          jiraIssueToTaskIdMap.set(task.external_id, task.id);
        }
      });

      // Convert and save subtasks with proper parent references
      const subtasks: TaskInsert[] = [];
      for (const issue of subtaskIssues) {
        // Find the project by matching the issue key prefix with project key
        const projectKey = issue.key.split("-")[0];
        const project = result.projects.find(
          (p) => (p.external_data as any)?.jira_project_key === projectKey
        );
        const projectId = project?.id;
        const statusId = statusMap.get(issue.fields.status.id);

        // Find parent task ID from the map
        const parentTaskId = jiraIssueToTaskIdMap.get(
          issue.fields.parent?.id || ""
        );

        if (projectId && statusId && parentTaskId) {
          const task = await this.convertJiraIssueToTask(
            issue,
            projectId,
            statusId,
            parentTaskId
          );
          subtasks.push(task);
        }
      }

      // Save subtasks to database
      let savedSubtasks: any[] = [];
      if (subtasks.length > 0) {
        const { data: insertedSubtasks, error: subtaskError } =
          await this.supabase.from("tasks").insert(subtasks).select();

        if (subtaskError) {
          throw new Error(`Failed to save subtasks: ${subtaskError.message}`);
        }

        savedSubtasks = insertedSubtasks || [];
      }

      // Combine all tasks for the result
      result.tasks = [...(savedParentTasks || []), ...savedSubtasks];

      return result;
    } catch (error) {
      console.error("Error converting Jira data:", error);
      throw error;
    }
  }
}
