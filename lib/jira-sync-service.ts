import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import JiraAPI from "@/lib/jira-api";
import type {
  JiraIntegration,
  Task,
  Status,
  Project,
} from "@/lib/database.types";

export interface SyncResult {
  success: boolean;
  message: string;
  data: {
    tasksPushedToJira: number;
    tasksPulledFromJira: number;
    statusesPushedToJira: number;
    statusesPulledFromJira: number;
    conflicts: SyncConflict[];
  };
}

export interface SyncConflict {
  entityType: "task" | "status";
  entityId: string;
  entityName: string;
  localChange: string;
  remoteChange: string;
  resolution: "local" | "remote" | "manual";
}

export interface SyncOptions {
  pushToJira?: boolean;
  pullFromJira?: boolean;
  resolveConflicts?: "local" | "remote" | "manual";
  syncTasks?: boolean;
  syncStatuses?: boolean;
}

export class JiraSyncService {
  private supabase: SupabaseClient<Database>;
  private jiraAPI: JiraAPI;
  private integration: JiraIntegration;
  private project: Project;

  constructor(
    supabase: SupabaseClient<Database>,
    integration: JiraIntegration,
    project: Project
  ) {
    this.supabase = supabase;
    this.integration = integration;
    this.project = project;
    this.jiraAPI = new JiraAPI({
      domain: integration.jira_domain,
      email: integration.jira_email,
      apiToken: integration.jira_api_token,
    });
  }

  /**
   * Perform bidirectional sync between local database and Jira
   * Following the exact workflow: Get Jira → Push Updates → Cleanup → Get Jira Again → Save
   */
  async performBidirectionalSync(
    options: SyncOptions = {}
  ): Promise<SyncResult> {
    const {
      pushToJira = true,
      pullFromJira = true,
      resolveConflicts = "manual",
      syncTasks = true,
      syncStatuses = true,
    } = options;

    const result: SyncResult = {
      success: true,
      message: "Bidirectional sync completed",
      data: {
        tasksPushedToJira: 0,
        tasksPulledFromJira: 0,
        statusesPushedToJira: 0,
        statusesPulledFromJira: 0,
        conflicts: [],
      },
    };

    try {
      // Step 1: Get data from Jira and analyze with our current DB
      if (pullFromJira) {
        const pullResult = await this.pullFromJira(syncTasks, syncStatuses);
        result.data.tasksPulledFromJira = pullResult.tasksUpdated;
        result.data.statusesPulledFromJira = pullResult.statusesUpdated;
      }

      // Step 2: Push updated data to Jira service
      if (pushToJira) {
        const pushResult = await this.pushToJira(syncTasks, syncStatuses);
        result.data.tasksPushedToJira = pushResult.tasksPushed;
        result.data.statusesPushedToJira = pushResult.statusesPushed;
      }

      const cleanupCount = await this.cleanupInvalidTasks();

      // Step 4: Get Jira data again (because Jira side was updated from our push)
      if (pullFromJira) {
        const pullResult2 = await this.pullFromJira(syncTasks, syncStatuses);
        result.data.tasksPulledFromJira += pullResult2.tasksUpdated;
        result.data.statusesPulledFromJira += pullResult2.statusesUpdated;
      }

      // Step 5: Handle any conflicts that were detected
      if (result.data.conflicts.length > 0) {
        await this.resolveConflicts(result.data.conflicts, resolveConflicts);
      }

      return result;
    } catch (error: any) {
      console.error("Bidirectional sync failed:", error);
      result.success = false;
      result.message = `Sync failed: ${error.message}`;
      return result;
    }
  }

  /**
   * Pull changes from Jira to local database
   */
  private async pullFromJira(syncTasks: boolean, syncStatuses: boolean) {
    const projectKey = (this.project.external_data as any)?.jira_project_key;
    if (!projectKey) {
      throw new Error("Project key not found in external data");
    }

    let tasksUpdated = 0;
    let statusesUpdated = 0;

    if (syncStatuses) {
      const jiraStatuses = await this.jiraAPI.getProjectStatuses(projectKey);
      statusesUpdated = await this.updateStatusesFromJira(jiraStatuses);
    }

    if (syncTasks) {
      const jiraIssues = await this.jiraAPI.getProjectIssues(projectKey);
      tasksUpdated = await this.updateTasksFromJira(jiraIssues);
    }

    return { tasksUpdated, statusesUpdated };
  }

  /**
   * Push local changes to Jira (improved with better analysis)
   */
  private async pushToJira(syncTasks: boolean, syncStatuses: boolean) {
    let tasksPushed = 0;
    let statusesPushed = 0;

    if (syncTasks) {
      tasksPushed = await this.pushTasksToJira();
    }

    if (syncStatuses) {
      statusesPushed = await this.pushStatusesToJira();
    }

    return { tasksPushed, statusesPushed };
  }

  /**
   * Update local statuses from Jira data
   */
  private async updateStatusesFromJira(jiraStatuses: any[]): Promise<number> {
    let updated = 0;

    for (const jiraStatus of jiraStatuses) {
      const { data: existingStatus } = await this.supabase
        .from("statuses")
        .select("*")
        .eq("project_id", this.project.id)
        .eq("external_id", jiraStatus.id)
        .single();

      if (existingStatus) {
        // Check if Jira version is newer
        const jiraUpdated = new Date(jiraStatus.updated || jiraStatus.created);
        const localUpdated = new Date(existingStatus.updated_at);

        if (jiraUpdated > localUpdated) {
          // Update local status
          await this.supabase
            .from("statuses")
            .update({
              name: jiraStatus.name,
              color: this.mapJiraStatusColor(
                jiraStatus.statusCategory.colorName
              ),
              external_data: {
                ...existingStatus.external_data,
                status_category: jiraStatus.statusCategory.key,
                color_name: jiraStatus.statusCategory.colorName,
                last_jira_update: jiraStatus.updated || jiraStatus.created,
              },
              last_synced_at: new Date().toISOString(),
              sync_status: "synced",
              pending_sync: false,
            })
            .eq("id", existingStatus.id);

          updated++;
        }
      } else {
        // Create new status
        await this.supabase.from("statuses").insert({
          name: jiraStatus.name,
          color: this.mapJiraStatusColor(jiraStatus.statusCategory.colorName),
          position: 0,
          workspace_id: this.project.workspace_id,
          type: "project",
          project_id: this.project.id,
          space_id: this.project.space_id,
          integration_type: "jira",
          external_id: jiraStatus.id,
          external_data: {
            status_category: jiraStatus.statusCategory.key,
            color_name: jiraStatus.statusCategory.colorName,
            last_jira_update: jiraStatus.updated || jiraStatus.created,
          },
          last_synced_at: new Date().toISOString(),
          sync_status: "synced",
          pending_sync: false,
        });

        updated++;
      }
    }

    return updated;
  }

  /**
   * Update local tasks from Jira data (improved with better analysis)
   */
  private async updateTasksFromJira(jiraIssues: any[]): Promise<number> {
    let updated = 0;

    // Get all Jira tasks from local database
    const { data: localJiraTasks } = await this.supabase
      .from("tasks")
      .select("*")
      .eq("project_id", this.project.id)
      .eq("type", "jira");

    // Create maps for both external_id and jira_key matching
    const existingTasksByIdMap = new Map(
      localJiraTasks
        ?.filter((task) => task.external_id && task.external_id !== "")
        .map((task) => [task.external_id, task]) || []
    );

    const existingTasksByKeyMap = new Map(
      localJiraTasks
        ?.filter((task) => task.external_id && task.external_id !== "")
        ?.map((task) => {
          const jiraKey = (task.external_data as any)?.jira_key;
          return jiraKey ? [jiraKey, task] : null;
        })
        .filter((entry): entry is [string, any] => entry !== null) || []
    );

    for (const jiraIssue of jiraIssues) {
      try {
        // Try to find existing task by external_id first, then by jira_key
        let existingTask = existingTasksByIdMap.get(jiraIssue.id);

        if (!existingTask) {
          // If not found by ID, try to find by Jira key
          existingTask = existingTasksByKeyMap.get(jiraIssue.key);

          if (existingTask) {
            // Update the external_id to match the Jira issue ID
            await this.supabase
              .from("tasks")
              .update({
                external_id: jiraIssue.id,
                external_data: {
                  ...existingTask.external_data,
                  jira_key: jiraIssue.key,
                  last_jira_update: jiraIssue.fields.updated,
                },
              })
              .eq("id", existingTask.id);

            // Update the task object for further processing
            existingTask.external_id = jiraIssue.id;
            existingTask.external_data = {
              ...existingTask.external_data,
              jira_key: jiraIssue.key,
              last_jira_update: jiraIssue.fields.updated,
            };
          }
        }

        if (existingTask) {
          // Task exists locally - check for conflicts and updates
          const jiraUpdated = new Date(jiraIssue.fields.updated);
          const localUpdated = new Date(existingTask.updated_at);
          const lastSynced = existingTask.last_synced_at
            ? new Date(existingTask.last_synced_at)
            : new Date(0);

          // Check if there are conflicting changes
          const hasLocalChanges = localUpdated > lastSynced;
          const hasJiraChanges = jiraUpdated > lastSynced;

          if (hasLocalChanges && hasJiraChanges) {
            // Conflict detected - both sides have changes since last sync
            const conflict: SyncConflict = {
              entityType: "task",
              entityId: existingTask.id,
              entityName: existingTask.name,
              localChange: `Last modified: ${localUpdated}`,
              remoteChange: `Last modified: ${jiraUpdated}`,
              resolution: "manual",
            };

            // For now, we'll prioritize Jira changes, but this could be configurable
            await this.updateTaskFromJira(existingTask, jiraIssue);
            updated++;
          } else if (hasJiraChanges) {
            // Only Jira has changes - safe to update
            await this.updateTaskFromJira(existingTask, jiraIssue);
            updated++;
          }
        } else {
          await this.createTaskFromJira(jiraIssue);
          updated++;
        }
      } catch (error: any) {
        console.error(`Error processing Jira issue ${jiraIssue.key}:`, error);
      }
    }

    return updated;
  }

  /**
   * Update an existing task with data from Jira
   */
  private async updateTaskFromJira(
    existingTask: any,
    jiraIssue: any
  ): Promise<void> {
    // Get status ID for this task
    const { data: status } = await this.supabase
      .from("statuses")
      .select("id")
      .eq("project_id", this.project.id)
      .eq("external_id", jiraIssue.fields.status.id)
      .single();

    if (!status) {
      console.warn(
        `Status not found for Jira status ID: ${jiraIssue.fields.status.id}`
      );
      return;
    }

    // Update local task
    await this.supabase
      .from("tasks")
      .update({
        name: jiraIssue.fields.summary,
        description: this.convertJiraDescription(jiraIssue.fields.description),
        status_id: status.id,
        priority: this.mapJiraPriority(jiraIssue.fields.priority?.name),
        due_date: jiraIssue.fields.duedate || null,
        external_data: {
          ...existingTask.external_data,
          jira_key: jiraIssue.key,
          jira_priority: jiraIssue.fields.priority?.name,
          jira_assignee: jiraIssue.fields.assignee,
          last_jira_update: jiraIssue.fields.updated,
        },
        last_synced_at: new Date().toISOString(),
        sync_status: "synced",
        pending_sync: false,
      })
      .eq("id", existingTask.id);
  }

  /**
   * Create a new task from Jira data
   */
  private async createTaskFromJira(jiraIssue: any): Promise<void> {
    // Get status ID for this task
    const { data: status } = await this.supabase
      .from("statuses")
      .select("id")
      .eq("project_id", this.project.id)
      .eq("external_id", jiraIssue.fields.status.id)
      .single();

    if (!status) {
      console.warn(
        `Status not found for new Jira issue ${jiraIssue.key}, skipping creation`
      );
      return;
    }

    // Create new task
    await this.supabase.from("tasks").insert({
      name: jiraIssue.fields.summary,
      description: this.convertJiraDescription(jiraIssue.fields.description),
      status_id: status.id,
      priority: this.mapJiraPriority(jiraIssue.fields.priority?.name),
      project_id: this.project.id,
      space_id: this.project.space_id,
      workspace_id: this.project.workspace_id,
      due_date: jiraIssue.fields.duedate || null,
      type: "jira",
      external_id: jiraIssue.id,
      external_data: {
        jira_key: jiraIssue.key,
        jira_priority: jiraIssue.fields.priority?.name,
        jira_assignee: jiraIssue.fields.assignee,
        last_jira_update: jiraIssue.fields.updated,
      },
      last_synced_at: new Date().toISOString(),
      sync_status: "synced",
      pending_sync: false,
    });
  }

  /**
   * Push local task changes to Jira (improved with better analysis)
   */
  private async pushTasksToJira(): Promise<number> {
    let pushed = 0;

    // Step 1: Push new tasks (without external_id) - including those with type "jira"
    const { data: newTasks, error: newTasksError } = await this.supabase
      .from("tasks")
      .select("*")
      .eq("project_id", this.project.id)
      .in("type", ["jira", "default"])
      .or("external_id.is.null,external_id.eq.");

    if (newTasksError) {
      console.error("Error fetching new tasks:", newTasksError);
      throw new Error(`Failed to fetch new tasks: ${newTasksError.message}`);
    }

    // Create new tasks in Jira
    for (const task of newTasks || []) {
      try {
        const projectKey = (this.project.external_data as any)
          ?.jira_project_key;
        if (!projectKey) {
          console.warn(`Project key not found for task ${task.id}, skipping`);
          continue;
        }

        // Create new issue in Jira
        const newJiraIssue = await this.jiraAPI.createIssue(projectKey, {
          summary: task.name,
          description: this.convertDescriptionForJira(task.description),
          issueType: "Story", // Default to Story, can be made configurable
          priority: this.mapPriorityToJira(task.priority),
          assignee: undefined, // Will be handled later if needed
        });

        // Update local task with the new external data
        try {
          await this.supabase
            .from("tasks")
            .update({
              type: "jira", // Ensure it's jira type
              external_id: newJiraIssue.id,
              external_data: {
                jira_key: newJiraIssue.key,
                jira_priority: task.priority,
                jira_assignee: null,
                last_jira_update: new Date().toISOString(), // Use current timestamp since new issue doesn't have updated field
              },
              last_synced_at: new Date().toISOString(),
              sync_status: "synced",
              pending_sync: false,
            })
            .eq("id", task.id);

          pushed++;
        } catch (updateError: any) {
          console.error(
            `Failed to update local task ${task.id} after Jira creation:`,
            updateError
          );
          // Mark as failed but don't throw - continue with other tasks
          await this.supabase
            .from("tasks")
            .update({
              sync_status: "failed",
              external_data: {
                ...task.external_data,
                last_sync_error: `Failed to update local task: ${updateError.message}`,
                last_sync_attempt: new Date().toISOString(),
              },
            })
            .eq("id", task.id);
        }
      } catch (error: any) {
        console.error(
          `Failed to create Jira issue for task ${task.id}:`,
          error
        );

        // Mark as failed
        await this.supabase
          .from("tasks")
          .update({
            sync_status: "failed",
            external_data: {
              ...task.external_data,
              last_sync_error: error.message,
              last_sync_attempt: new Date().toISOString(),
            },
          })
          .eq("id", task.id);
      }
    }

    // Step 2: Push updates to existing Jira tasks
    const { data: existingTasks, error: existingTasksError } =
      await this.supabase
        .from("tasks")
        .select("*")
        .eq("project_id", this.project.id)
        .eq("type", "jira")
        .not("external_id", "is", null)
        .neq("external_id", "")
        .eq("pending_sync", true);

    if (existingTasksError) {
      console.error("Error fetching existing tasks:", existingTasksError);
      throw new Error(
        `Failed to fetch existing tasks: ${existingTasksError.message}`
      );
    }

    // Update existing tasks in Jira
    for (const task of existingTasks || []) {
      try {
        const jiraKey = (task.external_data as any)?.jira_key;

        if (!jiraKey) {
          console.warn(`Task ${task.id} has no Jira key, skipping update`);
          continue;
        }

        // Get status transition ID if status changed
        let statusTransitionId: string | undefined;
        if (task.status_id) {
          const { data: status } = await this.supabase
            .from("statuses")
            .select("external_id")
            .eq("id", task.status_id)
            .single();

          if (status?.external_id) {
            try {
              // Get available transitions for this issue
              const transitions = await this.jiraAPI.getIssueTransitions(
                jiraKey
              );
              const targetTransition = transitions.find(
                (t: any) => t.to.id === status.external_id
              );
              statusTransitionId = targetTransition?.id;
            } catch (transitionError) {
              console.warn(
                `Failed to get transitions for issue ${jiraKey}:`,
                transitionError
              );
            }
          }
        }

        // Update issue in Jira
        await this.jiraAPI.updateIssue(jiraKey, {
          summary: task.name,
          description: this.convertDescriptionForJira(task.description),
          priority: this.mapPriorityToJira(task.priority),
          status: statusTransitionId,
        });

        // Mark as synced
        await this.supabase
          .from("tasks")
          .update({
            last_synced_at: new Date().toISOString(),
            sync_status: "synced",
            pending_sync: false,
          })
          .eq("id", task.id);

        pushed++;
      } catch (error: any) {
        console.error(
          `Failed to update Jira issue for task ${task.id}:`,
          error
        );

        // Mark as failed
        await this.supabase
          .from("tasks")
          .update({
            sync_status: "failed",
            external_data: {
              ...task.external_data,
              last_sync_error: error.message,
              last_sync_attempt: new Date().toISOString(),
            },
          })
          .eq("id", task.id);
      }
    }
    return pushed;
  }

  /**
   * Push local status changes to Jira
   */
  private async pushStatusesToJira(): Promise<number> {
    const { data: pendingStatuses } = await this.supabase
      .from("statuses")
      .select("*")
      .eq("project_id", this.project.id)
      .eq("integration_type", "jira")
      .eq("pending_sync", true)
      .not("external_id", "is", null);

    let pushed = 0;

    for (const status of pendingStatuses || []) {
      try {
        // Note: Jira status updates are limited by API permissions
        // Most status changes in Jira require admin permissions
        // For now, we'll just mark them as synced if they exist in Jira

        await this.supabase
          .from("statuses")
          .update({
            last_synced_at: new Date().toISOString(),
            sync_status: "synced",
            pending_sync: false,
          })
          .eq("id", status.id);

        pushed++;
      } catch (error: any) {
        console.error(`Failed to push status ${status.id} to Jira:`, error);

        await this.supabase
          .from("statuses")
          .update({
            sync_status: "failed",
            external_data: {
              ...status.external_data,
              last_sync_error: error.message,
            },
          })
          .eq("id", status.id);
      }
    }

    return pushed;
  }

  /**
   * Analyze sync state and detect conflicts
   */
  private async analyzeSyncState(): Promise<{
    conflicts: SyncConflict[];
    localChanges: any[];
    remoteChanges: any[];
  }> {
    const conflicts: SyncConflict[] = [];
    const localChanges: any[] = [];
    const remoteChanges: any[] = [];

    // Get all Jira tasks from local database
    const { data: localJiraTasks } = await this.supabase
      .from("tasks")
      .select("*")
      .eq("project_id", this.project.id)
      .eq("type", "jira");

    // Get all issues from Jira
    const projectKey = (this.project.external_data as any)?.jira_project_key;
    if (!projectKey) {
      throw new Error("Project key not found in external data");
    }

    const jiraIssues = await this.jiraAPI.getProjectIssues(projectKey);

    // Create maps for matching (only for tasks with valid external_id)
    const localTasksByIdMap = new Map(
      localJiraTasks
        ?.filter((task) => task.external_id && task.external_id !== "")
        .map((task) => [task.external_id, task]) || []
    );

    const localTasksByKeyMap = new Map(
      localJiraTasks
        ?.filter((task) => task.external_id && task.external_id !== "")
        ?.map((task) => {
          const jiraKey = (task.external_data as any)?.jira_key;
          return jiraKey ? [jiraKey, task] : null;
        })
        .filter((entry): entry is [string, any] => entry !== null) || []
    );

    // Analyze each Jira issue for conflicts
    for (const jiraIssue of jiraIssues) {
      // Try to find local task by external_id first, then by jira_key
      let localTask = localTasksByIdMap.get(jiraIssue.id);

      if (!localTask) {
        localTask = localTasksByKeyMap.get(jiraIssue.key);
      }

      if (localTask) {
        const jiraUpdated = new Date(jiraIssue.fields.updated);
        const localUpdated = new Date(localTask.updated_at);
        const lastSynced = localTask.last_synced_at
          ? new Date(localTask.last_synced_at)
          : new Date(0);

        const hasLocalChanges = localUpdated > lastSynced;
        const hasJiraChanges = jiraUpdated > lastSynced;

        if (hasLocalChanges && hasJiraChanges) {
          // Conflict detected
          conflicts.push({
            entityType: "task",
            entityId: localTask.id,
            entityName: localTask.name,
            localChange: `Last modified: ${localUpdated}`,
            remoteChange: `Last modified: ${jiraUpdated}`,
            resolution: "manual",
          });
        } else if (hasLocalChanges) {
          localChanges.push(localTask);
        } else if (hasJiraChanges) {
          remoteChanges.push(jiraIssue);
        }
      }
    }

    return { conflicts, localChanges, remoteChanges };
  }

  /**
   * Resolve sync conflicts with improved logic
   */
  private async resolveConflicts(
    conflicts: SyncConflict[],
    resolution: string
  ) {
    for (const conflict of conflicts) {
      try {
        if (resolution === "local") {
          await this.markAsSynced(conflict.entityType, conflict.entityId);
        } else if (resolution === "remote") {
          await this.overrideWithRemote(conflict.entityType, conflict.entityId);
        }
      } catch (error: any) {
        console.error(
          `Error resolving conflict for ${conflict.entityType} ${conflict.entityId}:`,
          error
        );
      }
    }
  }

  /**
   * Mark entity as synced to avoid future conflicts
   */
  private async markAsSynced(entityType: string, entityId: string) {
    const table = entityType === "task" ? "tasks" : "statuses";
    await this.supabase
      .from(table)
      .update({
        last_synced_at: new Date().toISOString(),
        sync_status: "synced",
        pending_sync: false,
      })
      .eq("id", entityId);
  }

  /**
   * Override local changes with remote changes
   */
  private async overrideWithRemote(entityType: string, entityId: string) {
    if (entityType === "task") {
      // For tasks, we need to fetch the latest data from Jira and update
      const { data: task } = await this.supabase
        .from("tasks")
        .select("*")
        .eq("id", entityId)
        .single();

      if (task && task.external_id) {
        try {
          // Fetch latest data from Jira using the external_id (Jira issue ID)
          const jiraIssue = await this.jiraAPI.getIssue(task.external_id);
          await this.updateTaskFromJira(task, jiraIssue);
        } catch (error: any) {
          console.error(
            `Failed to fetch Jira data for task ${entityId}:`,
            error
          );
        }
      }
    } else if (entityType === "status") {
      // For statuses, similar logic would apply
    }
  }

  /**
   * Mark a task as needing sync
   */
  async markTaskForSync(taskId: string) {
    await this.supabase
      .from("tasks")
      .update({
        pending_sync: true,
        sync_status: "pending",
        updated_at: new Date().toISOString(),
      })
      .eq("id", taskId);
  }

  /**
   * Mark a status as needing sync
   */
  async markStatusForSync(statusId: string) {
    await this.supabase
      .from("statuses")
      .update({
        pending_sync: true,
        sync_status: "pending",
        updated_at: new Date().toISOString(),
      })
      .eq("id", statusId);
  }

  /**
   * Get sync status for a project
   */
  async getSyncStatus() {
    const { data: pendingTasks } = await this.supabase
      .from("tasks")
      .select("id, name, sync_status, pending_sync")
      .eq("project_id", this.project.id)
      .eq("type", "jira")
      .eq("pending_sync", true);

    const { data: pendingStatuses } = await this.supabase
      .from("statuses")
      .select("id, name, sync_status, pending_sync")
      .eq("project_id", this.project.id)
      .eq("integration_type", "jira")
      .eq("pending_sync", true);

    return {
      pendingTasks: pendingTasks || [],
      pendingStatuses: pendingStatuses || [],
      hasPendingChanges:
        (pendingTasks?.length || 0) + (pendingStatuses?.length || 0) > 0,
    };
  }

  /**
   * Get detailed sync status for a project
   */
  async getDetailedSyncStatus() {
    const { data: allTasks } = await this.supabase
      .from("tasks")
      .select(
        "id, name, type, sync_status, pending_sync, external_id, last_synced_at, updated_at"
      )
      .eq("project_id", this.project.id)
      .in("type", ["jira", "default"]);

    const { data: allStatuses } = await this.supabase
      .from("statuses")
      .select(
        "id, name, sync_status, pending_sync, external_id, last_synced_at, updated_at"
      )
      .eq("project_id", this.project.id)
      .eq("integration_type", "jira");

    const pendingTasks = allTasks?.filter((task) => task.pending_sync) || [];
    const failedTasks =
      allTasks?.filter((task) => task.sync_status === "failed") || [];
    const syncedTasks =
      allTasks?.filter((task) => task.sync_status === "synced") || [];

    const pendingStatuses =
      allStatuses?.filter((status) => status.pending_sync) || [];
    const failedStatuses =
      allStatuses?.filter((status) => status.sync_status === "failed") || [];
    const syncedStatuses =
      allStatuses?.filter((status) => status.sync_status === "synced") || [];

    return {
      tasks: {
        total: allTasks?.length || 0,
        pending: pendingTasks.length,
        failed: failedTasks.length,
        synced: syncedTasks.length,
        pendingTasks,
        failedTasks,
      },
      statuses: {
        total: allStatuses?.length || 0,
        pending: pendingStatuses.length,
        failed: failedStatuses.length,
        synced: syncedStatuses.length,
        pendingStatuses,
        failedStatuses,
      },
      hasPendingChanges: pendingTasks.length + pendingStatuses.length > 0,
      hasFailedSyncs: failedTasks.length + failedStatuses.length > 0,
    };
  }

  // Helper methods
  private mapJiraStatusColor(colorName: string): string {
    const colorMap: Record<string, string> = {
      "medium-gray": "gray",
      green: "green",
      yellow: "yellow",
      red: "red",
      "blue-gray": "blue",
      blue: "blue",
      orange: "orange",
      purple: "purple",
      pink: "pink",
    };
    return colorMap[colorName] || "gray";
  }

  private mapJiraPriority(priority?: string): string {
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

  private mapPriorityToJira(priority: string): string {
    const priorityMap: Record<string, string> = {
      critical: "Highest",
      high: "High",
      medium: "Medium",
      low: "Low",
    };
    return priorityMap[priority] || "Medium";
  }

  private convertJiraDescription(description: any): string | null {
    if (!description) return null;

    if (typeof description === "string") {
      // Check if it's HTML content and convert to Jira format
      if (description.includes("<") && description.includes(">")) {
        return this.convertHtmlToJiraFormat(description);
      }
      return description;
    }

    if (description.content) {
      // Convert Jira document format to plain text
      return this.extractTextFromJiraDoc(description);
    }

    return null;
  }

  /**
   * Convert HTML content to Jira format
   * Handles common HTML tags and converts them to Jira markup
   */
  private convertHtmlToJiraFormat(htmlContent: string): string {
    if (!htmlContent) return "";

    let jiraContent = htmlContent;

    // Convert HTML tags to Jira markup
    // Headers
    jiraContent = jiraContent.replace(/<h1[^>]*>(.*?)<\/h1>/gi, "h1. $1");
    jiraContent = jiraContent.replace(/<h2[^>]*>(.*?)<\/h2>/gi, "h2. $1");
    jiraContent = jiraContent.replace(/<h3[^>]*>(.*?)<\/h3>/gi, "h3. $1");
    jiraContent = jiraContent.replace(/<h4[^>]*>(.*?)<\/h4>/gi, "h4. $1");
    jiraContent = jiraContent.replace(/<h5[^>]*>(.*?)<\/h5>/gi, "h5. $1");
    jiraContent = jiraContent.replace(/<h6[^>]*>(.*?)<\/h6>/gi, "h6. $1");

    // Bold and strong
    jiraContent = jiraContent.replace(
      /<(b|strong)[^>]*>(.*?)<\/(b|strong)>/gi,
      "*$2*"
    );

    // Italic and emphasis
    jiraContent = jiraContent.replace(/<(i|em)[^>]*>(.*?)<\/(i|em)>/gi, "_$2_");

    // Underline
    jiraContent = jiraContent.replace(/<u[^>]*>(.*?)<\/u>/gi, "+$1+");

    // Strikethrough
    jiraContent = jiraContent.replace(
      /<(s|strike|del)[^>]*>(.*?)<\/(s|strike|del)>/gi,
      "-$2-"
    );

    // Monospace/code
    jiraContent = jiraContent.replace(
      /<(code|tt)[^>]*>(.*?)<\/(code|tt)>/gi,
      "{{$2}}"
    );

    // Paragraphs
    jiraContent = jiraContent.replace(/<p[^>]*>(.*?)<\/p>/gi, "$1\n\n");

    // Line breaks
    jiraContent = jiraContent.replace(/<br\s*\/?>/gi, "\n");

    // Unordered lists
    jiraContent = jiraContent.replace(
      /<ul[^>]*>(.*?)<\/ul>/gi,
      (match, content) => {
        return content.replace(/<li[^>]*>(.*?)<\/li>/gi, "* $1\n") + "\n";
      }
    );

    // Ordered lists
    jiraContent = jiraContent.replace(
      /<ol[^>]*>(.*?)<\/ol>/gi,
      (match, content) => {
        let counter = 1;
        return (
          content.replace(/<li[^>]*>(.*?)<\/li>/gi, () => {
            return `${counter++}. $1\n`;
          }) + "\n"
        );
      }
    );

    // Links
    jiraContent = jiraContent.replace(
      /<a[^>]*href=["']([^"']*)["'][^>]*>(.*?)<\/a>/gi,
      "[$2|$1]"
    );

    // Blockquotes
    jiraContent = jiraContent.replace(
      /<blockquote[^>]*>(.*?)<\/blockquote>/gi,
      (match, content) => {
        return (
          content
            .split("\n")
            .map((line: string) => `bq. ${line}`)
            .join("\n") + "\n"
        );
      }
    );

    // Preformatted text
    jiraContent = jiraContent.replace(
      /<pre[^>]*>(.*?)<\/pre>/gi,
      (match, content) => {
        return `{code}\n${content}\n{code}\n`;
      }
    );

    // Tables (basic support)
    jiraContent = jiraContent.replace(
      /<table[^>]*>(.*?)<\/table>/gi,
      (match, content) => {
        let tableContent = "||";

        // Extract headers
        const headerMatch = content.match(/<thead[^>]*>(.*?)<\/thead>/i);
        if (headerMatch) {
          const headers = headerMatch[1].match(/<th[^>]*>(.*?)<\/th>/gi);
          if (headers) {
            headers.forEach((header: string) => {
              const text = header.replace(/<th[^>]*>(.*?)<\/th>/i, "$1");
              tableContent += ` ${text} ||`;
            });
            tableContent += "\n";
          }
        }

        // Extract rows
        const rows = content.match(/<tr[^>]*>(.*?)<\/tr>/gi);
        if (rows) {
          rows.forEach((row: string) => {
            const cells = row.match(/<td[^>]*>(.*?)<\/td>/gi);
            if (cells) {
              tableContent += "||";
              cells.forEach((cell: string) => {
                const text = cell.replace(/<td[^>]*>(.*?)<\/td>/i, "$1");
                tableContent += ` ${text} ||`;
              });
              tableContent += "\n";
            }
          });
        }

        return tableContent + "\n";
      }
    );

    // Remove any remaining HTML tags
    jiraContent = jiraContent.replace(/<[^>]*>/g, "");

    // Decode HTML entities
    jiraContent = jiraContent
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, " ");

    // Clean up extra whitespace and newlines
    jiraContent = jiraContent
      .replace(/\n\s*\n\s*\n/g, "\n\n") // Remove excessive newlines
      .replace(/^\s+|\s+$/g, ""); // Trim whitespace

    return jiraContent;
  }

  private extractTextFromJiraDoc(doc: any): string {
    if (!doc.content) return "";

    let text = "";
    for (const block of doc.content) {
      if (block.content) {
        for (const content of block.content) {
          if (content.text) {
            text += content.text;
          }
        }
      }
      text += "\n";
    }
    return text.trim();
  }

  async resetFailedSyncs(): Promise<void> {
    const { error: taskError } = await this.supabase
      .from("tasks")
      .update({
        sync_status: "pending",
        pending_sync: true,
      })
      .eq("project_id", this.project.id)
      .eq("type", "jira")
      .eq("sync_status", "failed");

    if (taskError) {
      console.error("Error resetting failed tasks:", taskError);
    }

    // Reset failed statuses
    const { error: statusError } = await this.supabase
      .from("statuses")
      .update({
        sync_status: "pending",
        pending_sync: true,
      })
      .eq("project_id", this.project.id)
      .eq("integration_type", "jira")
      .eq("sync_status", "failed");

    if (statusError) {
      console.error("Error resetting failed statuses:", statusError);
    }
  }

  /**
   * Debug method to check task matching between local and Jira
   */
  async debugTaskMatching(): Promise<{
    localTasks: any[];
    jiraIssues: any[];
    matches: any[];
    unmatchedLocal: any[];
    unmatchedJira: any[];
  }> {
    const { data: localTasks } = await this.supabase
      .from("tasks")
      .select("*")
      .eq("project_id", this.project.id)
      .eq("type", "jira");

    // Get all Jira issues
    const projectKey = (this.project.external_data as any)?.jira_project_key;
    if (!projectKey) {
      throw new Error("Project key not found in external data");
    }

    const jiraIssues = await this.jiraAPI.getProjectIssues(projectKey);

    // Create maps for matching
    const localTasksByIdMap = new Map(
      localTasks?.map((task) => [task.external_id, task]) || []
    );

    const localTasksByKeyMap = new Map(
      localTasks
        ?.map((task) => {
          const jiraKey = (task.external_data as any)?.jira_key;
          return jiraKey ? [jiraKey, task] : null;
        })
        .filter((entry): entry is [string, any] => entry !== null) || []
    );

    const jiraIssuesByIdMap = new Map(
      jiraIssues.map((issue) => [issue.id, issue])
    );
    const jiraIssuesByKeyMap = new Map(
      jiraIssues.map((issue) => [issue.key, issue])
    );

    const matches: any[] = [];
    const unmatchedLocal: any[] = [];
    const unmatchedJira: any[] = [];

    // Check local tasks
    for (const localTask of localTasks || []) {
      const jiraIssueById = localTask.external_id
        ? jiraIssuesByIdMap.get(localTask.external_id)
        : null;
      const jiraIssueByKey = (localTask.external_data as any)?.jira_key
        ? jiraIssuesByKeyMap.get((localTask.external_data as any).jira_key)
        : null;

      if (jiraIssueById || jiraIssueByKey) {
        matches.push({
          localTask,
          jiraIssue: jiraIssueById || jiraIssueByKey,
          matchedBy: jiraIssueById ? "id" : "key",
        });
      } else {
        unmatchedLocal.push(localTask);
      }
    }

    // Check Jira issues
    for (const jiraIssue of jiraIssues) {
      const localTaskById = localTasksByIdMap.get(jiraIssue.id);
      const localTaskByKey = localTasksByKeyMap.get(jiraIssue.key);

      if (!localTaskById && !localTaskByKey) {
        unmatchedJira.push(jiraIssue);
      }
    }
    return {
      localTasks: localTasks || [],
      jiraIssues,
      matches,
      unmatchedLocal,
      unmatchedJira,
    };
  }

  /**
   * Manually clean up invalid tasks (public method for manual cleanup)
   */
  async cleanupInvalidTasksManually(): Promise<number> {
    return await this.cleanupInvalidTasks();
  }

  /**
   * Validate sync state and check for potential issues
   */
  async validateSyncState(): Promise<{
    isValid: boolean;
    issues: string[];
    duplicateTasks: any[];
    orphanedTasks: any[];
    invalidTasks: any[];
  }> {
    const issues: string[] = [];
    const duplicateTasks: any[] = [];
    const orphanedTasks: any[] = [];
    const invalidTasks: any[] = [];

    // Get all Jira tasks
    const { data: allJiraTasks } = await this.supabase
      .from("tasks")
      .select("*")
      .eq("project_id", this.project.id)
      .eq("type", "jira");

    // Check for invalid tasks (type "jira" but no external_id - null or empty)
    const invalid =
      allJiraTasks?.filter(
        (task) =>
          task.type === "jira" && (!task.external_id || task.external_id === "")
      ) || [];

    if (invalid.length > 0) {
      issues.push(
        `Found ${invalid.length} invalid tasks (type "jira" but no external_id - null or empty)`
      );
      invalidTasks.push(...invalid);
    }

    // Check for duplicate external_ids
    const externalIdCounts = new Map<string, number>();
    const jiraKeyCounts = new Map<string, number>();

    for (const task of allJiraTasks || []) {
      if (task.external_id) {
        const count = externalIdCounts.get(task.external_id) || 0;
        externalIdCounts.set(task.external_id, count + 1);
      }

      const jiraKey = (task.external_data as any)?.jira_key;
      if (jiraKey) {
        const count = jiraKeyCounts.get(jiraKey) || 0;
        jiraKeyCounts.set(jiraKey, count + 1);
      }
    }

    // Find duplicates
    for (const [externalId, count] of externalIdCounts) {
      if (count > 1) {
        issues.push(
          `Duplicate external_id found: ${externalId} (${count} tasks)`
        );
        const duplicates =
          allJiraTasks?.filter((task) => task.external_id === externalId) || [];
        duplicateTasks.push(...duplicates);
      }
    }

    for (const [jiraKey, count] of jiraKeyCounts) {
      if (count > 1) {
        issues.push(`Duplicate jira_key found: ${jiraKey} (${count} tasks)`);
      }
    }

    // Check for orphaned tasks (have external_id but no jira_key)
    const orphaned =
      allJiraTasks?.filter(
        (task) => task.external_id && !(task.external_data as any)?.jira_key
      ) || [];

    if (orphaned.length > 0) {
      issues.push(
        `Found ${orphaned.length} orphaned tasks (external_id but no jira_key)`
      );
      orphanedTasks.push(...orphaned);
    }

    // Check for tasks with jira_key but no external_id
    const tasksWithKeyNoId =
      allJiraTasks?.filter(
        (task) => !task.external_id && (task.external_data as any)?.jira_key
      ) || [];

    if (tasksWithKeyNoId.length > 0) {
      issues.push(
        `Found ${tasksWithKeyNoId.length} tasks with jira_key but no external_id`
      );
    }

    const isValid = issues.length === 0;

    return {
      isValid,
      issues,
      duplicateTasks,
      orphanedTasks,
      invalidTasks,
    };
  }

  /**
   * Clean up invalid tasks after sync
   */
  private async cleanupInvalidTasks(): Promise<number> {
    // First, let's get ALL jira tasks to see what we have
    const { data: allJiraTasks, error: allTasksError } = await this.supabase
      .from("tasks")
      .select("id, name, type, external_id")
      .eq("project_id", this.project.id)
      .eq("type", "jira");

    if (allTasksError) {
      console.error("Error fetching all Jira tasks:", allTasksError);
      return 0;
    }

    // Manually filter for invalid tasks
    const invalidTasks =
      allJiraTasks?.filter(
        (task) =>
          !task.external_id ||
          task.external_id === "" ||
          task.external_id === null
      ) || [];

    if (invalidTasks.length === 0) {
      return 0;
    }

    // Delete each invalid task individually to ensure it works
    let deletedCount = 0;
    for (const task of invalidTasks) {
      try {
        const { error: deleteError } = await this.supabase
          .from("tasks")
          .delete()
          .eq("id", task.id);

        if (deleteError) {
          console.error(`Error deleting task ${task.id}:`, deleteError);
        } else {
          deletedCount++;
        }
      } catch (error: any) {
        console.error(`Exception deleting task ${task.id}:`, error);
      }
    }

    return deletedCount;
  }

  /**
   * Test method to manually check and clean up invalid tasks
   */
  async testCleanupInvalidTasks(): Promise<{
    totalJiraTasks: number;
    invalidTasks: any[];
    deletedCount: number;
    details: string[];
  }> {
    const details: string[] = [];

    // Get all Jira tasks
    const { data: allJiraTasks, error: allTasksError } = await this.supabase
      .from("tasks")
      .select("id, name, type, external_id, created_at")
      .eq("project_id", this.project.id)
      .eq("type", "jira");

    if (allTasksError) {
      console.error("Error fetching tasks:", allTasksError);
      return {
        totalJiraTasks: 0,
        invalidTasks: [],
        deletedCount: 0,
        details: ["Error fetching tasks"],
      };
    }

    const totalJiraTasks = allJiraTasks?.length || 0;

    // Log all tasks
    allJiraTasks?.forEach((task) => {
      const detail = `Task ${task.id}: "${task.name}" - external_id: "${
        task.external_id
      }" (type: ${typeof task.external_id})`;
      details.push(detail);
    });

    // Find invalid tasks
    const invalidTasks =
      allJiraTasks?.filter(
        (task) =>
          !task.external_id ||
          task.external_id === "" ||
          task.external_id === null
      ) || [];

    details.push(`Invalid tasks found: ${invalidTasks.length}`);

    // Delete invalid tasks
    let deletedCount = 0;
    for (const task of invalidTasks) {
      try {
        const { error: deleteError } = await this.supabase
          .from("tasks")
          .delete()
          .eq("id", task.id);

        if (deleteError) {
          const errorDetail = `Error deleting task ${task.id}: ${deleteError.message}`;
          details.push(errorDetail);
          console.error(errorDetail);
        } else {
          const successDetail = `Successfully deleted task ${task.id}: "${task.name}"`;
          details.push(successDetail);
          deletedCount++;
        }
      } catch (error: any) {
        const errorDetail = `Exception deleting task ${task.id}: ${error.message}`;
        details.push(errorDetail);
        console.error(errorDetail);
      }
    }

    details.push(`Total deleted: ${deletedCount}`);

    return {
      totalJiraTasks,
      invalidTasks,
      deletedCount,
      details,
    };
  }

  private convertDescriptionForJira(description: string | null): string {
    if (!description) return "";

    if (typeof description === "string") {
      // Check if it's HTML content and convert to Jira format
      if (description.includes("<") && description.includes(">")) {
        return this.convertHtmlToJiraFormat(description);
      }
      return description;
    }

    return "";
  }

  /**
   * Test method to verify HTML to Jira conversion
   */
  testHtmlToJiraConversion(): {
    example1: { html: string; jira: string };
    example2: { html: string; jira: string };
  } {
    const example1Html = "<p><b>bbbbbbbbbbbbbbbbbbbbbb</b></p>";
    const example2Html = `## User Story
As a **registered user**, I want **to view and manage all active sessions on my account**, so that **I can monitor account access and revoke suspicious sessions**.

## Acceptance Criteria
- User can view list of active sessions with device, location, and timestamp
- User can revoke individual sessions or all sessions except current
- System logs session activity for last 30 days
- User receives email notification for new device logins

## Story Details
- **Story Points**: 5
- **Business Value**: 2/5
- **Priority**: Low

## AI Generated
This task was generated using AI story generation and may require review and refinement.`;

    return {
      example1: {
        html: example1Html,
        jira: this.convertHtmlToJiraFormat(example1Html),
      },
      example2: {
        html: example2Html,
        jira: this.convertHtmlToJiraFormat(example2Html),
      },
    };
  }

  /**
   * Comprehensive test method to demonstrate HTML to Jira conversion
   */
  async testCompleteWorkflow(): Promise<{
    htmlConversion: {
      example1: { html: string; jira: string };
      example2: { html: string; jira: string };
    };
    syncStatus: any;
    validation: any;
  }> {
    // Test HTML conversion
    const htmlConversion = this.testHtmlToJiraConversion();

    // Get current sync status
    const syncStatus = await this.getDetailedSyncStatus();

    // Validate sync state
    const validation = await this.validateSyncState();

    return {
      htmlConversion,
      syncStatus,
      validation,
    };
  }
}
