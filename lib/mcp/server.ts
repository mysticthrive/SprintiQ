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
        case "SPRINTIQ_CHECK_ACTIVE_CONNECTION":
          return await this.checkActiveConnection(params, context);
        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
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
        name: "SPRINTIQ_CHECK_ACTIVE_CONNECTION",
        description: "Check active connection and validation status",
        inputSchema: {
          type: "object",
          properties: {
            context: { type: "object" },
          },
          required: ["context"],
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
    if (!context || !context.workspaceId || !context.userId) {
      throw new Error("Invalid context: workspaceId and userId are required");
    }
    return context as SprintiQContext;
  }

  // Tool implementations
  private async createTask(
    params: any,
    context: SprintiQContext
  ): Promise<MCPToolResult> {
    const supabase = await createServerSupabaseClient();

    // Get the workspace UUID from workspace_id
    const { data: workspace, error: workspaceError } = await supabase
      .from("workspaces")
      .select("id")
      .eq("workspace_id", context.workspaceId)
      .single();

    if (workspaceError || !workspace) {
      return { success: false, error: "Workspace not found" };
    }

    // Get the first space for this workspace to use as default
    const { data: spaces, error: spaceError } = await supabase
      .from("spaces")
      .select("id")
      .eq("workspace_id", workspace.id)
      .limit(1);

    if (spaceError || !spaces || spaces.length === 0) {
      return { success: false, error: "No spaces found in workspace" };
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
      return { success: false, error: "No statuses found in workspace" };
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
      return { success: false, error: error.message };
    }

    return { success: true, data: task };
  }

  private async updateTask(
    params: any,
    context: SprintiQContext
  ): Promise<MCPToolResult> {
    const supabase = await createServerSupabaseClient();

    const { data: task, error } = await supabase
      .from("tasks")
      .update(params.updates)
      .eq("id", params.taskId)
      .eq("workspace_id", context.workspaceId)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: task };
  }

  private async deleteTask(
    params: any,
    context: SprintiQContext
  ): Promise<MCPToolResult> {
    const supabase = await createServerSupabaseClient();

    const { error } = await supabase
      .from("tasks")
      .delete()
      .eq("id", params.taskId)
      .eq("workspace_id", context.workspaceId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: { deleted: true } };
  }

  private async getTask(
    params: any,
    context: SprintiQContext
  ): Promise<MCPToolResult> {
    const supabase = await createServerSupabaseClient();

    const { data: task, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("id", params.taskId)
      .eq("workspace_id", context.workspaceId)
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: task };
  }

  private async listTasks(
    params: any,
    context: SprintiQContext
  ): Promise<MCPToolResult> {
    const supabase = await createServerSupabaseClient();

    let query = supabase
      .from("tasks")
      .select("*")
      .eq("workspace_id", context.workspaceId);

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
      return { success: false, error: error.message };
    }

    return { success: true, data: tasks };
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
    // Implementation for creating projects
    return {
      success: true,
      data: { message: "Project creation not implemented yet" },
    };
  }

  private async getProject(
    params: any,
    context: SprintiQContext
  ): Promise<MCPToolResult> {
    // Implementation for getting projects
    return {
      success: true,
      data: { message: "Get project not implemented yet" },
    };
  }

  private async listProjects(
    params: any,
    context: SprintiQContext
  ): Promise<MCPToolResult> {
    // Implementation for listing projects
    return {
      success: true,
      data: { message: "List projects not implemented yet" },
    };
  }

  private async createSprint(
    params: any,
    context: SprintiQContext
  ): Promise<MCPToolResult> {
    // Implementation for creating sprints
    return {
      success: true,
      data: { message: "Create sprint not implemented yet" },
    };
  }

  private async getSprint(
    params: any,
    context: SprintiQContext
  ): Promise<MCPToolResult> {
    // Implementation for getting sprints
    return {
      success: true,
      data: { message: "Get sprint not implemented yet" },
    };
  }

  private async listSprints(
    params: any,
    context: SprintiQContext
  ): Promise<MCPToolResult> {
    // Implementation for listing sprints
    return {
      success: true,
      data: { message: "List sprints not implemented yet" },
    };
  }

  private async analyzeTaskPriority(
    params: any,
    context: SprintiQContext
  ): Promise<MCPToolResult> {
    // Implementation for task priority analysis
    return {
      success: true,
      data: { message: "Task priority analysis not implemented yet" },
    };
  }

  private async trainTAWOS(
    params: any,
    context: SprintiQContext
  ): Promise<MCPToolResult> {
    // Implementation for TAWOS training
    return {
      success: true,
      data: { message: "TAWOS training not implemented yet" },
    };
  }

  private async getTeamMembers(
    params: any,
    context: SprintiQContext
  ): Promise<MCPToolResult> {
    // Implementation for getting team members
    return {
      success: true,
      data: { message: "Get team members not implemented yet" },
    };
  }

  private async assignTask(
    params: any,
    context: SprintiQContext
  ): Promise<MCPToolResult> {
    // Implementation for task assignment
    return {
      success: true,
      data: { message: "Task assignment not implemented yet" },
    };
  }

  private async getTeamCapacity(
    params: any,
    context: SprintiQContext
  ): Promise<MCPToolResult> {
    // Implementation for team capacity
    return {
      success: true,
      data: { message: "Team capacity not implemented yet" },
    };
  }

  private async getProjectAnalytics(
    params: any,
    context: SprintiQContext
  ): Promise<MCPToolResult> {
    // Implementation for project analytics
    return {
      success: true,
      data: { message: "Project analytics not implemented yet" },
    };
  }

  private async getSprintAnalytics(
    params: any,
    context: SprintiQContext
  ): Promise<MCPToolResult> {
    // Implementation for sprint analytics
    return {
      success: true,
      data: { message: "Sprint analytics not implemented yet" },
    };
  }

  private async getTeamPerformance(
    params: any,
    context: SprintiQContext
  ): Promise<MCPToolResult> {
    // Implementation for team performance
    return {
      success: true,
      data: { message: "Team performance not implemented yet" },
    };
  }

  private async checkActiveConnection(
    params: any,
    context: SprintiQContext
  ): Promise<MCPToolResult> {
    try {
      const supabase = await createServerSupabaseClient();

      // Check database connection by querying a simple table
      const { data: workspace, error } = await supabase
        .from("workspaces")
        .select("id")
        .eq("workspace_id", context.workspaceId)
        .single();

      if (error) {
        return {
          success: false,
          error: `Database connection failed: ${error.message}`,
        };
      }

      // Additional validation checks
      const validationResults = {
        databaseConnection: true,
        workspaceExists: !!workspace,
        workspaceId: context.workspaceId,
        userId: context.userId,
        timestamp: new Date().toISOString(),
      };

      return {
        success: true,
        data: {
          status: "active",
          validation: validationResults,
          message: "Connection is active and validated",
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `Connection check failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      };
    }
  }

  // Resource readers
  private async readTaskResource(taskId: string): Promise<any> {
    // Implementation for reading task resources
    return { message: "Task resource reading not implemented yet" };
  }

  private async readProjectResource(projectId: string): Promise<any> {
    // Implementation for reading project resources
    return { message: "Project resource reading not implemented yet" };
  }

  private async readSprintResource(sprintId: string): Promise<any> {
    // Implementation for reading sprint resources
    return { message: "Sprint resource reading not implemented yet" };
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
}
