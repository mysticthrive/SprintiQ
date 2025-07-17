import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  MCPServer,
  MCPServerInfo,
  MCPTool,
  MCPResource,
  MCPPrompt,
  MCPToolResult,
  SprintiQContext,
  MCPMessage,
  MCPError,
} from "./types";
import {
  generateTAWOSStories,
  createSprintFolder,
  createSprints,
  trackStoryGenerationSession,
} from "@/app/[workspaceId]/ai-actions";
import { SprintCreationService } from "@/lib/sprint-creation-service";
import { getOptimalTeamAssignment } from "@/lib/supabase-vector-service";
import { DEFAULT_WEIGHTS } from "@/types";
import { enhancedMCPService } from "./enhanced-service";

export class SprintiQMCPServer implements MCPServer {
  private serverInfo: MCPServerInfo;
  private tools: MCPTool[];
  private resources: MCPResource[];
  private prompts: MCPPrompt[];

  constructor() {
    this.serverInfo = {
      name: "SprintiQ MCP Server",
      version: "1.0.0",
      capabilities: [],
    };

    this.tools = this.initializeTools();
    this.resources = this.initializeResources();
    this.prompts = this.initializePrompts();
  }

  info(): MCPServerInfo {
    return this.serverInfo;
  }

  listTools(): MCPTool[] {
    return this.tools;
  }

  async callTool(name: string, params: any): Promise<MCPToolResult> {
    try {
      // Special handling for SPRINTIQ_CHECK_ACTIVE_CONNECTION - doesn't need full context validation
      if (name === "SPRINTIQ_CHECK_ACTIVE_CONNECTION") {
        // Try to create a minimal context from params if available
        const contextData = params.context;
        let minimalContext: SprintiQContext | null = null;

        if (
          contextData &&
          contextData.workspaceId &&
          contextData.userId &&
          contextData.email
        ) {
          minimalContext = {
            workspaceId: contextData.workspaceId || contextData.workspace_id,
            userId: contextData.userId || contextData.user_id,
            email: contextData.email,
            teamId: contextData.teamId || contextData.team_id,
            projectId: contextData.projectId || contextData.project_id,
            sprintId: contextData.sprintId || contextData.sprint_id,
            permissions: contextData.permissions || ["read"],
            workspaceData: contextData.workspaceData,
          };
        }

        return await this.checkActiveConnection(params, minimalContext);
      }

      // Special handling for SPRINTIQ_GET_AUTHENTICATED_USER - check if user is authenticated
      if (name === "SPRINTIQ_GET_AUTHENTICATED_USER") {
        return await this.getAuthenticatedUser(params);
      }

      // For all other tools, validate context
      const context: SprintiQContext = this.validateContext(params.context);

      switch (name) {
        case "SPRINTIQ_CREATE_TASK":
          return await this.createTask(params, context);
        case "SPRINTIQ_UPDATE_TASK":
          return await this.updateTask(params, context);
        case "SPRINTIQ_DELETE_TASK":
          return await this.deleteTask(params, context);
        case "SPRINTIQ_GET_TASK":
          return await this.getTask(params, context);
        case "SPRINTIQ_LIST_TASKS":
          return await this.listTasks(params, context);
        case "SPRINTIQ_CREATE_PROJECT":
          return await this.createProject(params, context);
        case "SPRINTIQ_GET_PROJECT":
          return await this.getProject(params, context);
        case "SPRINTIQ_LIST_PROJECTS":
          return await this.listProjects(params, context);
        case "SPRINTIQ_CREATE_SPRINT":
          return await this.createSprint(params, context);
        case "SPRINTIQ_GET_SPRINT":
          return await this.getSprint(params, context);
        case "SPRINTIQ_LIST_SPRINTS":
          return await this.listSprints(params, context);
        case "SPRINTIQ_GENERATE_SPRINT_GOAL":
          return await this.generateSprintGoal(params, context);
        case "SPRINTIQ_GENERATE_USER_STORIES":
          return await this.generateUserStories(params, context);
        case "SPRINTIQ_ANALYZE_TASK_PRIORITY":
          return await this.analyzeTaskPriority(params, context);
        case "SPRINTIQ_FIND_SIMILAR_TASKS":
          return await this.findSimilarTasks(params, context);
        case "SPRINTIQ_TRAIN_TAWOS":
          return await this.trainTAWOS(params, context);
        case "SPRINTIQ_GET_TEAM_MEMBERS":
          return await this.getTeamMembers(params, context);
        case "SPRINTIQ_ASSIGN_TASK":
          return await this.assignTask(params, context);
        case "SPRINTIQ_GET_TEAM_CAPACITY":
          return await this.getTeamCapacity(params, context);
        case "SPRINTIQ_GET_PROJECT_ANALYTICS":
          return await this.getProjectAnalytics(params, context);
        case "SPRINTIQ_GET_SPRINT_ANALYTICS":
          return await this.getSprintAnalytics(params, context);
        case "SPRINTIQ_GET_TEAM_PERFORMANCE":
          return await this.getTeamPerformance(params, context);
        default:
          return {
            success: false,
            error: `Unknown tool: ${name}`,
            metadata: {
              tool: name,
              availableTools: this.tools.map((t) => t.name),
            },
          };
      }
    } catch (error) {
      console.error(`Error in callTool for ${name}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        metadata: {
          tool: name,
          operation: "call_tool",
          errorType:
            error instanceof Error ? error.constructor.name : "UnknownError",
        },
      };
    }
  }

  listResources(): MCPResource[] {
    return this.resources;
  }

  async readResource(uri: string): Promise<any> {
    // Implementation for reading resources
    const resourceType = uri.split(":")[0];
    const resourceId = uri.split(":")[1];

    switch (resourceType) {
      case "task":
        return await this.readTaskResource(resourceId);
      case "project":
        return await this.readProjectResource(resourceId);
      case "sprint":
        return await this.readSprintResource(resourceId);
      default:
        throw new Error(`Unknown resource type: ${resourceType}`);
    }
  }

  listPrompts(): MCPPrompt[] {
    return this.prompts;
  }

  async getPrompt(name: string, args?: any): Promise<any> {
    const prompt = this.prompts.find((p) => p.name === name);
    if (!prompt) {
      throw new Error(`Unknown prompt: ${name}`);
    }

    switch (name) {
      case "generate_user_story":
        return this.generateUserStoryPrompt(args);
      case "analyze_task_priority":
        return this.analyzeTaskPriorityPrompt(args);
      case "create_sprint_goal":
        return this.createSprintGoalPrompt(args);
      default:
        throw new Error(`Unknown prompt: ${name}`);
    }
  }

  private initializeTools(): MCPTool[] {
    return [
      {
        name: "SPRINTIQ_CHECK_ACTIVE_CONNECTION",
        description:
          "Check if user has active SprintiQ connection. Returns authorization URL if not authenticated.",
        inputSchema: {
          type: "object",
          properties: {},
          required: [],
        },
      },
      {
        name: "SPRINTIQ_GET_AUTHENTICATED_USER",
        description:
          "Get authenticated user info after signin (call this after typing 'Done' in a new thread).",
        inputSchema: {
          type: "object",
          properties: {},
          required: [],
        },
      },
      {
        name: "SPRINTIQ_CREATE_TASK",
        description: "Create a new task in a project",
        inputSchema: {
          type: "object",
          properties: {
            title: { type: "string" },
            description: { type: "string" },
            projectId: { type: "string" },
            assigneeId: { type: "string" },
            priority: {
              type: "string",
              enum: ["low", "medium", "high", "urgent"],
            },
            storyPoints: { type: "number" },
            context: { type: "object" },
          },
          required: ["title", "projectId", "context"],
        },
      },
      {
        name: "SPRINTIQ_UPDATE_TASK",
        description: "Update an existing task",
        inputSchema: {
          type: "object",
          properties: {
            taskId: { type: "string" },
            updates: { type: "object" },
            context: { type: "object" },
          },
          required: ["taskId", "updates", "context"],
        },
      },
      {
        name: "SPRINTIQ_DELETE_TASK",
        description: "Delete a task",
        inputSchema: {
          type: "object",
          properties: {
            taskId: { type: "string" },
            context: { type: "object" },
          },
          required: ["taskId", "context"],
        },
      },
      {
        name: "SPRINTIQ_GET_TASK",
        description: "Get details of a specific task",
        inputSchema: {
          type: "object",
          properties: {
            taskId: { type: "string" },
            context: { type: "object" },
          },
          required: ["taskId", "context"],
        },
      },
      {
        name: "SPRINTIQ_LIST_TASKS",
        description: "List tasks with optional filters",
        inputSchema: {
          type: "object",
          properties: {
            projectId: { type: "string" },
            sprintId: { type: "string" },
            assigneeId: { type: "string" },
            status: { type: "string" },
            priority: { type: "string" },
            context: { type: "object" },
          },
          required: ["context"],
        },
      },
      {
        name: "SPRINTIQ_GENERATE_USER_STORIES",
        description: "Generate user stories using AI",
        inputSchema: {
          type: "object",
          properties: {
            featureDescription: { type: "string" },
            numberOfStories: { type: "number" },
            complexity: {
              type: "string",
              enum: ["simple", "moderate", "complex"],
            },
            useTAWOS: { type: "boolean" },
            context: { type: "object" },
          },
          required: ["featureDescription", "context"],
        },
      },
      {
        name: "SPRINTIQ_ANALYZE_TASK_PRIORITY",
        description: "Analyze and prioritize tasks using AI",
        inputSchema: {
          type: "object",
          properties: {
            taskIds: { type: "array", items: { type: "string" } },
            priorityWeights: { type: "object" },
            context: { type: "object" },
          },
          required: ["taskIds", "context"],
        },
      },
      {
        name: "SPRINTIQ_FIND_SIMILAR_TASKS",
        description: "Find tasks similar to a given description",
        inputSchema: {
          type: "object",
          properties: {
            query: { type: "string" },
            projectId: { type: "string" },
            limit: { type: "number" },
            context: { type: "object" },
          },
          required: ["query", "context"],
        },
      },
      {
        name: "SPRINTIQ_GENERATE_SPRINT_GOAL",
        description: "Generate a sprint goal from user stories",
        inputSchema: {
          type: "object",
          properties: {
            stories: { type: "array" },
            projectContext: { type: "object" },
            context: { type: "object" },
          },
          required: ["stories", "context"],
        },
      },
      {
        name: "SPRINTIQ_GET_TEAM_MEMBERS",
        description: "Get team members and their details",
        inputSchema: {
          type: "object",
          properties: {
            teamId: { type: "string" },
            context: { type: "object" },
          },
          required: ["context"],
        },
      },
      {
        name: "SPRINTIQ_GET_PROJECT_ANALYTICS",
        description: "Get analytics for a project",
        inputSchema: {
          type: "object",
          properties: {
            projectId: { type: "string" },
            timeRange: { type: "string" },
            context: { type: "object" },
          },
          required: ["projectId", "context"],
        },
      },
      {
        name: "SPRINTIQ_CREATE_PROJECT",
        description: "Create a new project",
        inputSchema: {
          type: "object",
          properties: {
            name: { type: "string" },
            description: { type: "string" },
            context: { type: "object" },
          },
          required: ["name", "context"],
        },
      },
      {
        name: "SPRINTIQ_GET_PROJECT",
        description: "Get details of a specific project",
        inputSchema: {
          type: "object",
          properties: {
            projectId: { type: "string" },
            context: { type: "object" },
          },
          required: ["projectId", "context"],
        },
      },
      {
        name: "SPRINTIQ_LIST_PROJECTS",
        description: "List projects in workspace",
        inputSchema: {
          type: "object",
          properties: {
            context: { type: "object" },
          },
          required: ["context"],
        },
      },
      {
        name: "SPRINTIQ_CREATE_SPRINT",
        description: "Create a new sprint",
        inputSchema: {
          type: "object",
          properties: {
            name: { type: "string" },
            description: { type: "string" },
            projectId: { type: "string" },
            startDate: { type: "string" },
            endDate: { type: "string" },
            context: { type: "object" },
          },
          required: ["name", "projectId", "context"],
        },
      },
      {
        name: "SPRINTIQ_GET_SPRINT",
        description: "Get details of a specific sprint",
        inputSchema: {
          type: "object",
          properties: {
            sprintId: { type: "string" },
            context: { type: "object" },
          },
          required: ["sprintId", "context"],
        },
      },
      {
        name: "SPRINTIQ_LIST_SPRINTS",
        description: "List sprints with optional filters",
        inputSchema: {
          type: "object",
          properties: {
            projectId: { type: "string" },
            context: { type: "object" },
          },
          required: ["context"],
        },
      },
      {
        name: "SPRINTIQ_TRAIN_TAWOS",
        description: "Train TAWOS with project data",
        inputSchema: {
          type: "object",
          properties: {
            projectId: { type: "string" },
            trainingData: { type: "object" },
            context: { type: "object" },
          },
          required: ["projectId", "context"],
        },
      },
      {
        name: "SPRINTIQ_ASSIGN_TASK",
        description: "Assign a task to a team member",
        inputSchema: {
          type: "object",
          properties: {
            taskId: { type: "string" },
            assigneeId: { type: "string" },
            context: { type: "object" },
          },
          required: ["taskId", "assigneeId", "context"],
        },
      },
      {
        name: "SPRINTIQ_GET_TEAM_CAPACITY",
        description: "Get team capacity information",
        inputSchema: {
          type: "object",
          properties: {
            teamId: { type: "string" },
            sprintId: { type: "string" },
            context: { type: "object" },
          },
          required: ["context"],
        },
      },
      {
        name: "SPRINTIQ_GET_SPRINT_ANALYTICS",
        description: "Get analytics for a sprint",
        inputSchema: {
          type: "object",
          properties: {
            sprintId: { type: "string" },
            timeRange: { type: "string" },
            context: { type: "object" },
          },
          required: ["sprintId", "context"],
        },
      },
      {
        name: "SPRINTIQ_GET_TEAM_PERFORMANCE",
        description: "Get team performance metrics",
        inputSchema: {
          type: "object",
          properties: {
            teamId: { type: "string" },
            timeRange: { type: "string" },
            context: { type: "object" },
          },
          required: ["context"],
        },
      },
    ];
  }

  private initializeResources(): MCPResource[] {
    return [
      {
        uri: "task:*",
        name: "Task Resource",
        description: "Access to task data",
        mimeType: "application/json",
      },
      {
        uri: "project:*",
        name: "Project Resource",
        description: "Access to project data",
        mimeType: "application/json",
      },
      {
        uri: "sprint:*",
        name: "Sprint Resource",
        description: "Access to sprint data",
        mimeType: "application/json",
      },
    ];
  }

  private initializePrompts(): MCPPrompt[] {
    return [
      {
        name: "generate_user_story",
        description: "Generate a user story from a feature description",
        arguments: [
          {
            name: "feature_description",
            description: "Description of the feature",
            required: true,
          },
          {
            name: "user_role",
            description: "Target user role",
            required: false,
          },
        ],
      },
      {
        name: "analyze_task_priority",
        description: "Analyze and suggest task priority",
        arguments: [
          {
            name: "task_description",
            description: "Description of the task",
            required: true,
          },
          {
            name: "project_context",
            description: "Project context",
            required: false,
          },
        ],
      },
      {
        name: "create_sprint_goal",
        description: "Create a sprint goal from user stories",
        arguments: [
          {
            name: "user_stories",
            description: "Array of user stories",
            required: true,
          },
        ],
      },
    ];
  }

  private validateContext(context: any): SprintiQContext {
    if (!context) {
      throw new Error("Context is required");
    }

    // Handle different context formats
    const workspaceId = context.workspaceId || context.workspace_id;
    const userId = context.userId || context.user_id;
    const email = context.email;

    if (!workspaceId) {
      throw new Error(
        "Invalid context: workspaceId or workspace_id is required"
      );
    }

    if (!userId) {
      throw new Error("Invalid context: userId or user_id is required");
    }

    if (!email) {
      throw new Error("Invalid context: email is required");
    }

    // Ensure we have a valid SprintiQContext
    return {
      workspaceId,
      userId,
      email,
      teamId: context.teamId || context.team_id,
      projectId: context.projectId || context.project_id,
      sprintId: context.sprintId || context.sprint_id,
      permissions: context.permissions || ["read"],
      workspaceData: context.workspaceData,
    } as SprintiQContext;
  }

  // Tool implementations
  private async createTask(
    params: any,
    context: SprintiQContext
  ): Promise<MCPToolResult> {
    try {
      const supabase = await createServerSupabaseClient();

      // Get the workspace UUID from workspace_id
      const { data: workspace, error: workspaceError } = await supabase
        .from("workspaces")
        .select("id")
        .eq("workspace_id", context.workspaceId)
        .single();

      if (workspaceError || !workspace) {
        return {
          success: false,
          error: `Workspace not found: ${context.workspaceId}`,
          metadata: { workspaceId: context.workspaceId, error: workspaceError },
        };
      }

      // Get the first space for this workspace to use as default
      const { data: spaces, error: spaceError } = await supabase
        .from("spaces")
        .select("id")
        .eq("workspace_id", workspace.id)
        .limit(1);

      if (spaceError || !spaces || spaces.length === 0) {
        return {
          success: false,
          error: "No spaces found in workspace",
          metadata: {
            workspaceId: context.workspaceId,
            workspaceUUID: workspace.id,
          },
        };
      }

      const spaceId = spaces[0].id;

      // Get the first available status for this workspace
      const { data: statuses, error: statusError } = await supabase
        .from("statuses")
        .select("id")
        .eq("workspace_id", workspace.id)
        .order("position", { ascending: true })
        .limit(1);

      if (statusError || !statuses || statuses.length === 0) {
        return {
          success: false,
          error: "No statuses found in workspace",
          metadata: {
            workspaceId: context.workspaceId,
            workspaceUUID: workspace.id,
          },
        };
      }

      const statusId = statuses[0].id;

      const { data: task, error } = await supabase
        .from("tasks")
        .insert({
          name: params.title,
          description: params.description,
          status_id: statusId,
          priority: params.priority || "medium",
          project_id: params.projectId || null,
          space_id: spaceId,
          workspace_id: workspace.id,
          assignee_id: params.assigneeId,
          story_points: params.storyPoints,
          created_by: context.userId,
        })
        .select()
        .single();

      if (error) {
        return {
          success: false,
          error: `Failed to create task: ${error.message}`,
          metadata: {
            workspaceId: context.workspaceId,
            workspaceUUID: workspace.id,
            dbError: error,
          },
        };
      }

      return {
        success: true,
        data: task,
        metadata: {
          workspaceId: context.workspaceId,
          workspaceUUID: workspace.id,
          action: "task_created",
        },
      };
    } catch (error) {
      console.error("Error creating task:", error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown error creating task",
        metadata: {
          workspaceId: context.workspaceId,
          operation: "create_task",
        },
      };
    }
  }

  private async updateTask(
    params: any,
    context: SprintiQContext
  ): Promise<MCPToolResult> {
    try {
      const supabase = await createServerSupabaseClient();

      // Get the workspace UUID from workspace_id
      const { data: workspace, error: workspaceError } = await supabase
        .from("workspaces")
        .select("id")
        .eq("workspace_id", context.workspaceId)
        .single();

      if (workspaceError || !workspace) {
        return {
          success: false,
          error: `Workspace not found: ${context.workspaceId}`,
          metadata: { workspaceId: context.workspaceId, error: workspaceError },
        };
      }

      const { data: task, error } = await supabase
        .from("tasks")
        .update(params.updates)
        .eq("id", params.taskId)
        .eq("workspace_id", workspace.id)
        .select()
        .single();

      if (error) {
        return {
          success: false,
          error: `Failed to update task: ${error.message}`,
          metadata: {
            workspaceId: context.workspaceId,
            taskId: params.taskId,
            dbError: error,
          },
        };
      }

      return {
        success: true,
        data: task,
        metadata: {
          workspaceId: context.workspaceId,
          taskId: params.taskId,
          action: "task_updated",
        },
      };
    } catch (error) {
      console.error("Error updating task:", error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown error updating task",
        metadata: {
          workspaceId: context.workspaceId,
          taskId: params.taskId,
          operation: "update_task",
        },
      };
    }
  }

  private async deleteTask(
    params: any,
    context: SprintiQContext
  ): Promise<MCPToolResult> {
    try {
      const supabase = await createServerSupabaseClient();

      // Get the workspace UUID from workspace_id
      const { data: workspace, error: workspaceError } = await supabase
        .from("workspaces")
        .select("id")
        .eq("workspace_id", context.workspaceId)
        .single();

      if (workspaceError || !workspace) {
        return {
          success: false,
          error: `Workspace not found: ${context.workspaceId}`,
          metadata: { workspaceId: context.workspaceId, error: workspaceError },
        };
      }

      const { error } = await supabase
        .from("tasks")
        .delete()
        .eq("id", params.taskId)
        .eq("workspace_id", workspace.id);

      if (error) {
        return {
          success: false,
          error: `Failed to delete task: ${error.message}`,
          metadata: {
            workspaceId: context.workspaceId,
            taskId: params.taskId,
            dbError: error,
          },
        };
      }

      return {
        success: true,
        data: { deleted: true },
        metadata: {
          workspaceId: context.workspaceId,
          taskId: params.taskId,
          action: "task_deleted",
        },
      };
    } catch (error) {
      console.error("Error deleting task:", error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown error deleting task",
        metadata: {
          workspaceId: context.workspaceId,
          taskId: params.taskId,
          operation: "delete_task",
        },
      };
    }
  }

  private async getTask(
    params: any,
    context: SprintiQContext
  ): Promise<MCPToolResult> {
    try {
      const supabase = await createServerSupabaseClient();

      // Get the workspace UUID from workspace_id
      const { data: workspace, error: workspaceError } = await supabase
        .from("workspaces")
        .select("id")
        .eq("workspace_id", context.workspaceId)
        .single();

      if (workspaceError || !workspace) {
        return {
          success: false,
          error: `Workspace not found: ${context.workspaceId}`,
          metadata: { workspaceId: context.workspaceId, error: workspaceError },
        };
      }

      const { data: task, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("id", params.taskId)
        .eq("workspace_id", workspace.id)
        .single();

      if (error) {
        return {
          success: false,
          error: `Failed to get task: ${error.message}`,
          metadata: {
            workspaceId: context.workspaceId,
            taskId: params.taskId,
            dbError: error,
          },
        };
      }

      return {
        success: true,
        data: task,
        metadata: {
          workspaceId: context.workspaceId,
          taskId: params.taskId,
          action: "task_retrieved",
        },
      };
    } catch (error) {
      console.error("Error getting task:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error getting task",
        metadata: {
          workspaceId: context.workspaceId,
          taskId: params.taskId,
          operation: "get_task",
        },
      };
    }
  }

  private async listTasks(
    params: any,
    context: SprintiQContext
  ): Promise<MCPToolResult> {
    try {
      const supabase = await createServerSupabaseClient();

      // Get the workspace UUID from workspace_id
      const { data: workspace, error: workspaceError } = await supabase
        .from("workspaces")
        .select("id")
        .eq("workspace_id", context.workspaceId)
        .single();

      if (workspaceError || !workspace) {
        return {
          success: false,
          error: `Workspace not found: ${context.workspaceId}`,
          metadata: { workspaceId: context.workspaceId, error: workspaceError },
        };
      }

      let query = supabase
        .from("tasks")
        .select("*")
        .eq("workspace_id", workspace.id);

      if (params.projectId) {
        query = query.eq("project_id", params.projectId);
      }
      if (params.sprintId) {
        query = query.eq("sprint_id", params.sprintId);
      }
      if (params.assigneeId) {
        query = query.eq("assignee_id", params.assigneeId);
      }
      if (params.status) {
        query = query.eq("status", params.status);
      }
      if (params.priority) {
        query = query.eq("priority", params.priority);
      }

      const { data: tasks, error } = await query;

      if (error) {
        return {
          success: false,
          error: `Failed to list tasks: ${error.message}`,
          metadata: {
            workspaceId: context.workspaceId,
            filters: params,
            dbError: error,
          },
        };
      }

      return {
        success: true,
        data: tasks,
        metadata: {
          workspaceId: context.workspaceId,
          count: tasks.length,
          filters: params,
          action: "tasks_listed",
        },
      };
    } catch (error) {
      console.error("Error listing tasks:", error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown error listing tasks",
        metadata: {
          workspaceId: context.workspaceId,
          filters: params,
          operation: "list_tasks",
        },
      };
    }
  }

  private async generateUserStories(
    params: any,
    context: SprintiQContext
  ): Promise<MCPToolResult> {
    try {
      const storyParams = {
        featureDescription: params.featureDescription,
        numberOfStories: params.numberOfStories || 3,
        complexity: params.complexity || "moderate",
        priorityWeights: params.priorityWeights || DEFAULT_WEIGHTS,
        workspaceId: context.workspaceId,
        teamMembers: params.team_members,
        useTAWOS: true, // Always use TAWOS data
      };

      const result = await generateTAWOSStories(storyParams);

      return { success: true, data: result };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate user stories",
      };
    }
  }

  private async findSimilarTasks(
    params: any,
    context: SprintiQContext
  ): Promise<MCPToolResult> {
    try {
      // Since findSimilarTasksWithAI doesn't exist, we'll create a basic implementation
      const supabase = await createServerSupabaseClient();

      const { data: tasks, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("workspace_id", context.workspaceId)
        .ilike("title", `%${params.query}%`)
        .limit(params.limit || 10);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: { tasks } };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to find similar tasks",
      };
    }
  }

  private async generateSprintGoal(
    params: any,
    context: SprintiQContext
  ): Promise<MCPToolResult> {
    try {
      const service = new SprintCreationService();
      const goal = await service.generateSprintGoal(
        params.stories,
        params.projectContext
      );

      return { success: true, data: { goal } };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate sprint goal",
      };
    }
  }

  // Placeholder implementations for other methods
  private async createProject(
    params: any,
    context: SprintiQContext
  ): Promise<MCPToolResult> {
    return {
      success: false,
      error: "Project creation not implemented yet",
      metadata: {
        tool: "SPRINTIQ_CREATE_PROJECT",
        workspaceId: context.workspaceId,
        status: "not_implemented",
      },
    };
  }

  private async getProject(
    params: any,
    context: SprintiQContext
  ): Promise<MCPToolResult> {
    return {
      success: false,
      error: "Get project not implemented yet",
      metadata: {
        tool: "SPRINTIQ_GET_PROJECT",
        workspaceId: context.workspaceId,
        status: "not_implemented",
      },
    };
  }

  private async listProjects(
    params: any,
    context: SprintiQContext
  ): Promise<MCPToolResult> {
    return {
      success: false,
      error: "List projects not implemented yet",
      metadata: {
        tool: "SPRINTIQ_LIST_PROJECTS",
        workspaceId: context.workspaceId,
        status: "not_implemented",
      },
    };
  }

  private async createSprint(
    params: any,
    context: SprintiQContext
  ): Promise<MCPToolResult> {
    return {
      success: false,
      error: "Create sprint not implemented yet",
      metadata: {
        tool: "SPRINTIQ_CREATE_SPRINT",
        workspaceId: context.workspaceId,
        status: "not_implemented",
      },
    };
  }

  private async getSprint(
    params: any,
    context: SprintiQContext
  ): Promise<MCPToolResult> {
    return {
      success: false,
      error: "Get sprint not implemented yet",
      metadata: {
        tool: "SPRINTIQ_GET_SPRINT",
        workspaceId: context.workspaceId,
        status: "not_implemented",
      },
    };
  }

  private async listSprints(
    params: any,
    context: SprintiQContext
  ): Promise<MCPToolResult> {
    return {
      success: false,
      error: "List sprints not implemented yet",
      metadata: {
        tool: "SPRINTIQ_LIST_SPRINTS",
        workspaceId: context.workspaceId,
        status: "not_implemented",
      },
    };
  }

  private async analyzeTaskPriority(
    params: any,
    context: SprintiQContext
  ): Promise<MCPToolResult> {
    return {
      success: false,
      error: "Task priority analysis not implemented yet",
      metadata: {
        tool: "SPRINTIQ_ANALYZE_TASK_PRIORITY",
        workspaceId: context.workspaceId,
        status: "not_implemented",
      },
    };
  }

  private async trainTAWOS(
    params: any,
    context: SprintiQContext
  ): Promise<MCPToolResult> {
    return {
      success: false,
      error: "TAWOS training not implemented yet",
      metadata: {
        tool: "SPRINTIQ_TRAIN_TAWOS",
        workspaceId: context.workspaceId,
        status: "not_implemented",
      },
    };
  }

  private async getTeamMembers(
    params: any,
    context: SprintiQContext
  ): Promise<MCPToolResult> {
    return {
      success: false,
      error: "Get team members not implemented yet",
      metadata: {
        tool: "SPRINTIQ_GET_TEAM_MEMBERS",
        workspaceId: context.workspaceId,
        status: "not_implemented",
      },
    };
  }

  private async assignTask(
    params: any,
    context: SprintiQContext
  ): Promise<MCPToolResult> {
    return {
      success: false,
      error: "Task assignment not implemented yet",
      metadata: {
        tool: "SPRINTIQ_ASSIGN_TASK",
        workspaceId: context.workspaceId,
        status: "not_implemented",
      },
    };
  }

  private async getTeamCapacity(
    params: any,
    context: SprintiQContext
  ): Promise<MCPToolResult> {
    return {
      success: false,
      error: "Team capacity not implemented yet",
      metadata: {
        tool: "SPRINTIQ_GET_TEAM_CAPACITY",
        workspaceId: context.workspaceId,
        status: "not_implemented",
      },
    };
  }

  private async getProjectAnalytics(
    params: any,
    context: SprintiQContext
  ): Promise<MCPToolResult> {
    return {
      success: false,
      error: "Project analytics not implemented yet",
      metadata: {
        tool: "SPRINTIQ_GET_PROJECT_ANALYTICS",
        workspaceId: context.workspaceId,
        status: "not_implemented",
      },
    };
  }

  private async getSprintAnalytics(
    params: any,
    context: SprintiQContext
  ): Promise<MCPToolResult> {
    return {
      success: false,
      error: "Sprint analytics not implemented yet",
      metadata: {
        tool: "SPRINTIQ_GET_SPRINT_ANALYTICS",
        workspaceId: context.workspaceId,
        status: "not_implemented",
      },
    };
  }

  private async getTeamPerformance(
    params: any,
    context: SprintiQContext
  ): Promise<MCPToolResult> {
    return {
      success: false,
      error: "Team performance not implemented yet",
      metadata: {
        tool: "SPRINTIQ_GET_TEAM_PERFORMANCE",
        workspaceId: context.workspaceId,
        status: "not_implemented",
      },
    };
  }

  private async getAuthenticatedUser(params: any): Promise<MCPToolResult> {
    try {
      // Check if there are any completed authentication tokens
      const completedAuth =
        await enhancedMCPService.getCompletedAuthentication();

      if (completedAuth.success && completedAuth.email) {
        // User is authenticated, establish connection
        const connectionResult = await enhancedMCPService.establishConnection(
          completedAuth.email
        );

        if (connectionResult.success && connectionResult.user) {
          return {
            success: true,
            data: {
              status: "authenticated",
              message:
                "✅ Authentication successful! You can now use SprintIQ tools.",
              user: {
                email: connectionResult.user.email,
                name: connectionResult.user.name,
                company: connectionResult.user.company,
                workspaces: connectionResult.user.workspaces.map((w) => ({
                  id: w.workspace_id,
                  name: w.name,
                  role: w.role,
                })),
              },
              instructions: [
                "You are now authenticated with SprintIQ.",
                "You can create tickets, list projects, and use other SprintIQ tools.",
                "For example, try asking: 'Please create 3 tickets for my project'",
              ],
              nextSteps:
                "You can now use any SprintIQ tool. The system will automatically provide the necessary context.",
            },
            metadata: {
              tool: "SPRINTIQ_GET_AUTHENTICATED_USER",
              step: "authenticated",
              timestamp: new Date().toISOString(),
            },
          };
        } else {
          return {
            success: false,
            error: "Failed to establish connection with authenticated user",
            metadata: {
              tool: "SPRINTIQ_GET_AUTHENTICATED_USER",
              step: "connection_failed",
              timestamp: new Date().toISOString(),
            },
          };
        }
      }

      // No completed authentication found
      return {
        success: false,
        error:
          "No authentication found. Please sign in first by calling SPRINTIQ_CHECK_ACTIVE_CONNECTION",
        data: {
          status: "not_authenticated",
          message: "Please authenticate first",
          instructions: [
            "1. Call SPRINTIQ_CHECK_ACTIVE_CONNECTION to get the signin URL",
            "2. Sign in via the browser",
            "3. Then call this tool again",
          ],
        },
        metadata: {
          tool: "SPRINTIQ_GET_AUTHENTICATED_USER",
          step: "not_authenticated",
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      console.error("Error getting authenticated user:", error);
      return {
        success: false,
        error: "Failed to get authenticated user info",
        metadata: {
          tool: "SPRINTIQ_GET_AUTHENTICATED_USER",
          step: "error",
          timestamp: new Date().toISOString(),
        },
      };
    }
  }

  private async checkActiveConnection(
    params: any,
    context: SprintiQContext | null
  ): Promise<MCPToolResult> {
    try {
      // Simply return the authorization URL - this tool should only handle the initial auth step
      const connectionStatus = await enhancedMCPService.checkActiveConnection();

      if (connectionStatus.requiresAuthorization) {
        return {
          success: true,
          data: {
            status: "authentication_required",
            message: "🔐 Authentication Required",
            authorizationUrl: connectionStatus.authorizationUrl,
            authToken: connectionStatus.authToken,
            instructions: [
              "Please sign in to SprintIQ to continue:",
              "",
              "1. Click this link to sign in: " +
                connectionStatus.authorizationUrl,
              "2. Sign in to your SprintiQ account in the browser",
              "3. After successful sign-in, the browser will redirect back to Cursor",
              "4. Then type 'Done' in a NEW conversation thread",
              "5. You can then create tickets and use other SprintIQ tools",
              "",
              "⚠️  Important: You must type 'Done' in a NEW thread after signing in!",
            ],
            nextSteps:
              "After signing in, start a new conversation and type 'Done' to continue with ticket creation.",
          },
          metadata: {
            tool: "SPRINTIQ_CHECK_ACTIVE_CONNECTION",
            step: "authentication_required",
            timestamp: new Date().toISOString(),
            stopHere: true, // Signal to stop processing
          },
        };
      }

      // If somehow we get here, return an error
      return {
        success: false,
        error: "Unable to generate authorization URL",
        metadata: {
          tool: "SPRINTIQ_CHECK_ACTIVE_CONNECTION",
          step: "error",
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      console.error("Error in checkActiveConnection:", error);
      return {
        success: false,
        error: "Failed to check connection status",
        metadata: {
          tool: "SPRINTIQ_CHECK_ACTIVE_CONNECTION",
          step: "error",
          timestamp: new Date().toISOString(),
        },
      };
    }
  }

  // Resource readers
  private async readTaskResource(taskId: string): Promise<any> {
    try {
      const supabase = await createServerSupabaseClient();
      const { data: task, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("id", taskId)
        .single();

      if (error) {
        throw new Error(`Failed to read task resource: ${error.message}`);
      }

      return {
        uri: `task:${taskId}`,
        content: task,
        mimeType: "application/json",
      };
    } catch (error) {
      throw new Error(
        `Task resource reading failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  private async readProjectResource(projectId: string): Promise<any> {
    try {
      const supabase = await createServerSupabaseClient();
      const { data: project, error } = await supabase
        .from("projects")
        .select("*")
        .eq("id", projectId)
        .single();

      if (error) {
        throw new Error(`Failed to read project resource: ${error.message}`);
      }

      return {
        uri: `project:${projectId}`,
        content: project,
        mimeType: "application/json",
      };
    } catch (error) {
      throw new Error(
        `Project resource reading failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  private async readSprintResource(sprintId: string): Promise<any> {
    try {
      const supabase = await createServerSupabaseClient();
      const { data: sprint, error } = await supabase
        .from("sprints")
        .select("*")
        .eq("id", sprintId)
        .single();

      if (error) {
        throw new Error(`Failed to read sprint resource: ${error.message}`);
      }

      return {
        uri: `sprint:${sprintId}`,
        content: sprint,
        mimeType: "application/json",
      };
    } catch (error) {
      throw new Error(
        `Sprint resource reading failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  // Prompt generators
  private async generateUserStoryPrompt(args: any): Promise<any> {
    return {
      prompt: `Generate a user story for the following feature: ${args.feature_description}`,
      role: args.user_role || "user",
    };
  }

  private async analyzeTaskPriorityPrompt(args: any): Promise<any> {
    return {
      prompt: `Analyze the priority for this task: ${args.task_description}`,
      context: args.project_context || "",
    };
  }

  private async createSprintGoalPrompt(args: any): Promise<any> {
    return {
      prompt: `Create a sprint goal for these user stories: ${JSON.stringify(
        args.user_stories
      )}`,
      stories: args.user_stories,
    };
  }

  /**
   * Get client-specific authentication instructions
   */
  private getClientSpecificInstructions(
    clientType: string,
    authUrl: string,
    userEmail: string
  ): string[] {
    switch (clientType) {
      case "cursor":
        return [
          "🔐 SprintiQ Authentication for Cursor",
          "",
          "To use SprintiQ with Cursor, you need to authenticate:",
          "",
          "1️⃣ Click the authorization URL below (it will open in your browser)",
          "2️⃣ Sign in to your SprintiQ account in the browser",
          "3️⃣ After successful signin, return to Cursor",
          "4️⃣ Call this tool again with 'authorizationComplete: true'",
          "",
          `🔗 Authorization URL: ${authUrl}`,
          "",
          "📝 Next step: Call SPRINTIQ_CHECK_ACTIVE_CONNECTION with:",
          `   { userEmail: '${userEmail}', authorizationComplete: true }`,
          "",
          "💡 This opens app.sprintiq.ai in your browser for secure authentication",
          "⚠️  Note: This is required for security and billing purposes.",
        ];

      case "claude":
        return [
          "🔐 SprintiQ Authentication for Claude Desktop",
          "",
          "To use SprintiQ with Claude Desktop, you need to authenticate:",
          "",
          "1️⃣ Open this URL in your browser:",
          `   ${authUrl}`,
          "2️⃣ Sign in to your SprintiQ account",
          "3️⃣ Return to Claude Desktop",
          "4️⃣ Call SPRINTIQ_CHECK_ACTIVE_CONNECTION again with authorizationComplete: true",
          "",
          "🔒 Secure authentication via app.sprintiq.ai",
          "⚠️  Note: This is required for security and billing purposes.",
        ];

      case "vscode":
        return [
          "🔐 SprintiQ Authentication for VS Code",
          "",
          "To use SprintiQ with VS Code, you need to authenticate:",
          "",
          "1️⃣ Click the authorization URL below:",
          `   ${authUrl}`,
          "2️⃣ Sign in to your SprintiQ account in the browser",
          "3️⃣ After successful signin, return to VS Code",
          "4️⃣ Call this tool again with 'authorizationComplete: true'",
          "",
          "🔒 Secure authentication via app.sprintiq.ai",
          "⚠️  Note: This is required for security and billing purposes.",
        ];

      default:
        return [
          "🔐 SprintiQ Authentication Required",
          "",
          "To use SprintiQ with your MCP client, you need to authenticate:",
          "",
          "1️⃣ Open this URL in your browser:",
          `   ${authUrl}`,
          "2️⃣ Sign in to your SprintiQ account",
          "3️⃣ Return to your MCP client",
          "4️⃣ Call this function again with authorizationComplete: true",
          "",
          "🔒 Secure authentication via app.sprintiq.ai",
          "⚠️  Note: This is required for security and billing purposes.",
        ];
    }
  }
}
