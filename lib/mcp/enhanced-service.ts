import { SprintiQMCPClient, MCPClientManager } from "./client";
import {
  MCPClientConfig,
  MCPTool,
  MCPServerInfo,
  SprintiQContext,
  MCPToolResult,
  MCPUserValidationResult,
  MCPValidatedUser,
  MCPWorkspaceInfo,
  MCPTeamInfo,
} from "./types";
import { mcpUserValidationService } from "./user-validation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isUserAllowedServer } from "@/lib/auth-utils-server";
import {
  generateTAWOSStories,
  createSprints,
} from "@/app/[workspaceId]/ai-actions";

export interface MCPConnectionStatus {
  isConnected: boolean;
  hasActiveConnection: boolean;
  connectionId?: string;
  establishedAt?: Date;
  lastActivity?: Date;
  requiresAuthorization?: boolean;
  authorizationUrl?: string;
  error?: string;
}

export interface MCPAuthorizationInfo {
  isRequired: boolean;
  authorizationUrl?: string;
  message?: string;
  redirectUrl?: string;
}

export interface MCPWorkspaceSelection {
  workspaces: MCPWorkspaceInfo[];
  selectedWorkspace?: MCPWorkspaceInfo;
  requiresSelection: boolean;
}

export interface MCPTeamMemberSelection {
  teamMembers: MCPTeamInfo[];
  selectedMembers?: MCPTeamInfo[];
  requiresSelection: boolean;
}

export interface MCPStoryGenerationResult {
  stories: any[];
  metadata: {
    workspaceId: string;
    projectId?: string;
    teamMembers?: MCPTeamInfo[];
    generatedAt: Date;
  };
}

export interface MCPPostExecutionOptions {
  saveAsStoriesOnly: boolean;
  saveWithSprints: boolean;
  createSprintFolder?: boolean;
  sprintDuration?: number;
}

/**
 * Enhanced MCP Service with proper workflow implementation
 */
export class EnhancedMCPService {
  private static instance: EnhancedMCPService;
  private clientManager: MCPClientManager;
  private activeConnections: Map<string, MCPConnectionStatus> = new Map();
  private userSessions: Map<
    string,
    {
      user: MCPValidatedUser;
      workspace?: MCPWorkspaceInfo;
      teamMembers?: MCPTeamInfo[];
      connectionId: string;
    }
  > = new Map();

  private readonly APP_BASE_URL =
    process.env.NEXT_PUBLIC_APP_URL || "https://app.sprintiq.ai";
  private readonly MCP_CALLBACK_URL = `${this.APP_BASE_URL}/api/mcp/auth/callback`;

  private constructor() {
    this.clientManager = new MCPClientManager();
  }

  static getInstance(): EnhancedMCPService {
    if (!EnhancedMCPService.instance) {
      EnhancedMCPService.instance = new EnhancedMCPService();
    }
    return EnhancedMCPService.instance;
  }

  /**
   * Step 1: Check active connection - SPRINTIQ_CHECK_ACTIVE_CONNECTION
   * Now includes proper authorization check
   */
  async checkActiveConnection(userEmail: string): Promise<MCPConnectionStatus> {
    try {
      const existingConnection = this.activeConnections.get(userEmail);

      if (existingConnection && existingConnection.isConnected) {
        // Update last activity
        existingConnection.lastActivity = new Date();
        this.activeConnections.set(userEmail, existingConnection);

        return existingConnection;
      }

      // Check if user is authenticated in the main app
      const authStatus = await this.checkUserAuthentication(userEmail);

      if (!authStatus.isAuthenticated) {
        return {
          isConnected: false,
          hasActiveConnection: false,
          requiresAuthorization: true,
          authorizationUrl: authStatus.authorizationUrl,
          error:
            authStatus.error ||
            "Authentication required. Please sign in to SprintIQ.",
        };
      }

      // No active connection, but user is authenticated - ready to establish connection
      return {
        isConnected: false,
        hasActiveConnection: false,
        requiresAuthorization: false,
      };
    } catch (error) {
      console.error("Error checking active connection:", error);
      return {
        isConnected: false,
        hasActiveConnection: false,
        requiresAuthorization: true,
        authorizationUrl: `${
          this.APP_BASE_URL
        }/signin?redirect=${encodeURIComponent(this.MCP_CALLBACK_URL)}`,
        error: "Failed to check connection status. Please sign in to SprintIQ.",
      };
    }
  }

  /**
   * Check if user is authenticated in the main SprintIQ app
   */
  private async checkUserAuthentication(userEmail: string): Promise<{
    isAuthenticated: boolean;
    authorizationUrl?: string;
    error?: string;
  }> {
    try {
      const supabase = await createServerSupabaseClient();

      // Check if user exists and is allowed
      const { data: user, error: userError } = await supabase
        .from("users")
        .select("id, name, email, allowed, company")
        .eq("email", userEmail.toLowerCase().trim())
        .maybeSingle();

      if (userError) {
        return {
          isAuthenticated: false,
          authorizationUrl: `${
            this.APP_BASE_URL
          }/signin?redirect=${encodeURIComponent(this.MCP_CALLBACK_URL)}`,
          error: "Failed to verify user authentication",
        };
      }

      if (!user) {
        return {
          isAuthenticated: false,
          authorizationUrl: `${
            this.APP_BASE_URL
          }/signup?redirect=${encodeURIComponent(this.MCP_CALLBACK_URL)}`,
          error:
            "User not found. Please sign up for SprintIQ to access MCP features.",
        };
      }

      if (!user.allowed) {
        return {
          isAuthenticated: false,
          authorizationUrl: `${this.APP_BASE_URL}/access-denied`,
          error: "User account is not activated. Please contact support.",
        };
      }

      // Check if user has an active session (this is a simplified check)
      const isAllowed = await isUserAllowedServer(userEmail);

      if (!isAllowed) {
        return {
          isAuthenticated: false,
          authorizationUrl: `${
            this.APP_BASE_URL
          }/signin?redirect=${encodeURIComponent(this.MCP_CALLBACK_URL)}`,
          error: "Please sign in to SprintIQ to access MCP features.",
        };
      }

      return {
        isAuthenticated: true,
      };
    } catch (error) {
      console.error("Error checking user authentication:", error);
      return {
        isAuthenticated: false,
        authorizationUrl: `${
          this.APP_BASE_URL
        }/signin?redirect=${encodeURIComponent(this.MCP_CALLBACK_URL)}`,
        error: "Authentication check failed. Please sign in to SprintIQ.",
      };
    }
  }

  /**
   * Step 2: Establish connection and validate user
   * Now includes proper authorization flow
   */
  async establishConnection(userEmail: string): Promise<{
    success: boolean;
    connectionId?: string;
    user?: MCPValidatedUser;
    error?: string;
    requiresAuthorization?: boolean;
    authorizationUrl?: string;
  }> {
    try {
      // First check authentication
      const authStatus = await this.checkUserAuthentication(userEmail);

      if (!authStatus.isAuthenticated) {
        return {
          success: false,
          requiresAuthorization: true,
          authorizationUrl: authStatus.authorizationUrl,
          error: authStatus.error || "Authentication required",
        };
      }

      // Validate user and get full context
      const validation = await mcpUserValidationService.validateUserByEmail(
        userEmail
      );

      if (!validation.isValid || !validation.user) {
        return {
          success: false,
          requiresAuthorization: true,
          authorizationUrl: `${
            this.APP_BASE_URL
          }/signin?redirect=${encodeURIComponent(this.MCP_CALLBACK_URL)}`,
          error: validation.error || "User validation failed",
        };
      }

      // Create connection
      const connectionId = `conn_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      const connectionStatus: MCPConnectionStatus = {
        isConnected: true,
        hasActiveConnection: true,
        connectionId,
        establishedAt: new Date(),
        lastActivity: new Date(),
      };

      this.activeConnections.set(userEmail, connectionStatus);

      // Store user session
      this.userSessions.set(userEmail, {
        user: validation.user,
        connectionId,
      });

      return {
        success: true,
        connectionId,
        user: validation.user,
      };
    } catch (error) {
      console.error("Error establishing connection:", error);
      return {
        success: false,
        requiresAuthorization: true,
        authorizationUrl: `${
          this.APP_BASE_URL
        }/signin?redirect=${encodeURIComponent(this.MCP_CALLBACK_URL)}`,
        error: "Failed to establish connection. Please try signing in again.",
      };
    }
  }

  /**
   * Step 3: Handle workspace selection
   */
  async handleWorkspaceSelection(
    userEmail: string,
    workspaceId?: string
  ): Promise<MCPWorkspaceSelection> {
    try {
      const userSession = this.userSessions.get(userEmail);

      if (!userSession) {
        throw new Error(
          "No active session found. Please establish connection first."
        );
      }

      const { user } = userSession;
      const availableWorkspaces = user.workspaces;

      // If workspace ID is provided, validate and select it
      if (workspaceId) {
        const selectedWorkspace = availableWorkspaces.find(
          (w) => w.workspace_id === workspaceId || w.id === workspaceId
        );

        if (!selectedWorkspace) {
          throw new Error(
            `Workspace ${workspaceId} not found or not accessible`
          );
        }

        // Update user session with selected workspace
        userSession.workspace = selectedWorkspace;
        this.userSessions.set(userEmail, userSession);

        return {
          workspaces: availableWorkspaces,
          selectedWorkspace,
          requiresSelection: false,
        };
      }

      // If only one workspace, auto-select it
      if (availableWorkspaces.length === 1) {
        const selectedWorkspace = availableWorkspaces[0];
        userSession.workspace = selectedWorkspace;
        this.userSessions.set(userEmail, userSession);

        return {
          workspaces: availableWorkspaces,
          selectedWorkspace,
          requiresSelection: false,
        };
      }

      // Multiple workspaces, user needs to select
      return {
        workspaces: availableWorkspaces,
        requiresSelection: true,
      };
    } catch (error) {
      console.error("Error handling workspace selection:", error);
      throw error;
    }
  }

  /**
   * Step 4: Handle team member selection
   */
  async handleTeamMemberSelection(
    userEmail: string,
    selectedTeamMemberIds?: string[]
  ): Promise<MCPTeamMemberSelection> {
    try {
      const userSession = this.userSessions.get(userEmail);

      if (!userSession || !userSession.workspace) {
        throw new Error("No active session or workspace selected");
      }

      const availableTeamMembers = userSession.workspace.teams;

      // If no team members in workspace, proceed without selection
      if (!availableTeamMembers || availableTeamMembers.length === 0) {
        return {
          teamMembers: [],
          requiresSelection: false,
        };
      }

      // If team member IDs are provided, validate and select them
      if (selectedTeamMemberIds && selectedTeamMemberIds.length > 0) {
        const selectedMembers = availableTeamMembers.filter((member) =>
          selectedTeamMemberIds.includes(member.id)
        );

        if (selectedMembers.length === 0) {
          throw new Error("No valid team members found for the provided IDs");
        }

        // Update user session with selected team members
        userSession.teamMembers = selectedMembers;
        this.userSessions.set(userEmail, userSession);

        return {
          teamMembers: availableTeamMembers,
          selectedMembers,
          requiresSelection: false,
        };
      }

      // Team members available, user needs to select
      return {
        teamMembers: availableTeamMembers,
        requiresSelection: true,
      };
    } catch (error) {
      console.error("Error handling team member selection:", error);
      throw error;
    }
  }

  /**
   * Step 5: Execute tool with proper context
   */
  async executeToolWithWorkflow(
    userEmail: string,
    toolName: string,
    params: any,
    workspaceId?: string,
    selectedTeamMemberIds?: string[]
  ): Promise<MCPToolResult> {
    try {
      // Step 1: Check active connection
      const connectionStatus = await this.checkActiveConnection(userEmail);

      if (!connectionStatus.isConnected) {
        // Establish connection
        const connectionResult = await this.establishConnection(userEmail);

        if (!connectionResult.success) {
          return {
            success: false,
            error: connectionResult.error,
            metadata: {
              step: "connection_establishment",
              requiresAuthorization: true,
            },
          };
        }
      }

      // Step 2: Handle workspace selection
      const workspaceSelection = await this.handleWorkspaceSelection(
        userEmail,
        workspaceId
      );

      if (workspaceSelection.requiresSelection) {
        return {
          success: false,
          error: "Workspace selection required",
          data: {
            availableWorkspaces: workspaceSelection.workspaces.map((w) => ({
              id: w.workspace_id,
              name: w.name,
              role: w.role,
            })),
          },
          metadata: {
            step: "workspace_selection",
            requiresWorkspaceSelection: true,
          },
        };
      }

      // Step 3: Handle team member selection (if needed for the tool)
      if (this.toolRequiresTeamMembers(toolName)) {
        const teamMemberSelection = await this.handleTeamMemberSelection(
          userEmail,
          selectedTeamMemberIds
        );

        if (teamMemberSelection.requiresSelection) {
          return {
            success: false,
            error: "Team member selection required",
            data: {
              availableTeamMembers: teamMemberSelection.teamMembers.map(
                (m) => ({
                  id: m.id,
                  name: m.name,
                  role: m.role,
                  level: m.level,
                })
              ),
            },
            metadata: {
              step: "team_member_selection",
              requiresTeamMemberSelection: true,
            },
          };
        }
      }

      // Step 4: Execute the tool
      const userSession = this.userSessions.get(userEmail)!;
      const context = this.createExecutionContext(userSession);

      const result = await this.executeTool(toolName, params, context);

      // Step 5: Handle post-execution based on tool type
      if (toolName === "generateUserStories") {
        return await this.handleStoryGenerationResult(result, userSession);
      }

      return result;
    } catch (error) {
      console.error("Error executing tool with workflow:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        metadata: {
          step: "tool_execution",
        },
      };
    }
  }

  /**
   * Step 6: Handle story generation result with post-execution options
   */
  private async handleStoryGenerationResult(
    result: MCPToolResult,
    userSession: {
      user: MCPValidatedUser;
      workspace?: MCPWorkspaceInfo;
      teamMembers?: MCPTeamInfo[];
    }
  ): Promise<MCPToolResult> {
    if (!result.success) {
      return result;
    }

    const storyResult: MCPStoryGenerationResult = {
      stories: result.data.stories || result.data,
      metadata: {
        workspaceId: userSession.workspace!.workspace_id,
        teamMembers: userSession.teamMembers,
        generatedAt: new Date(),
      },
    };

    return {
      success: true,
      data: storyResult,
      metadata: {
        ...result.metadata,
        step: "story_generation_complete",
        requiresPostExecutionChoice: true,
        postExecutionOptions: {
          saveAsStoriesOnly: "Save generated stories as individual tasks",
          saveWithSprints: "Create sprints and organize stories within them",
        },
      },
    };
  }

  /**
   * Handle post-execution choice for story generation
   */
  async handlePostExecutionChoice(
    userEmail: string,
    choice: "saveAsStoriesOnly" | "saveWithSprints",
    storyData: MCPStoryGenerationResult,
    options?: {
      sprintDuration?: number;
      createSprintFolder?: boolean;
    }
  ): Promise<MCPToolResult> {
    try {
      const userSession = this.userSessions.get(userEmail);

      if (!userSession || !userSession.workspace) {
        throw new Error("No active session or workspace");
      }

      const context = this.createExecutionContext(userSession);

      if (choice === "saveAsStoriesOnly") {
        return await this.saveStoriesOnly(storyData, context);
      } else if (choice === "saveWithSprints") {
        return await this.saveStoriesWithSprints(storyData, context, options);
      }

      throw new Error("Invalid post-execution choice");
    } catch (error) {
      console.error("Error handling post-execution choice:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Save stories as individual tasks only
   */
  private async saveStoriesOnly(
    storyData: MCPStoryGenerationResult,
    context: SprintiQContext
  ): Promise<MCPToolResult> {
    try {
      const supabase = await createServerSupabaseClient();
      const savedStories = [];

      // Get the workspace UUID from workspace_id
      const { data: workspace, error: workspaceError } = await supabase
        .from("workspaces")
        .select("id")
        .eq("workspace_id", context.workspaceId)
        .single();

      if (workspaceError || !workspace) {
        console.error("Error finding workspace:", workspaceError);
        return {
          success: false,
          error: "Workspace not found",
        };
      }

      // Get the first space for this workspace to use as default
      const { data: spaces, error: spaceError } = await supabase
        .from("spaces")
        .select("id")
        .eq("workspace_id", workspace.id)
        .limit(1);

      if (spaceError || !spaces || spaces.length === 0) {
        console.error("Error finding spaces:", spaceError);
        return {
          success: false,
          error: "No spaces found in workspace",
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
        console.error("Error finding statuses:", statusError);
        return {
          success: false,
          error: "No statuses found in workspace",
        };
      }

      const statusId = statuses[0].id;

      for (const story of storyData.stories) {
        const { data: task, error } = await supabase
          .from("tasks")
          .insert({
            name: story.title,
            description: story.description,
            status_id: statusId,
            priority: story.priority?.toLowerCase() || "medium",
            project_id: context.projectId || null,
            space_id: spaceId,
            workspace_id: workspace.id,
            created_by: context.userId,
            story_points: story.storyPoints,
            type: "ai-generated",
          })
          .select()
          .single();

        if (error) {
          console.error("Error saving story:", error);
          continue;
        }

        savedStories.push(task);
      }

      return {
        success: true,
        data: {
          savedStories,
          count: savedStories.length,
        },
        metadata: {
          action: "stories_saved",
          workspaceId: context.workspaceId,
        },
      };
    } catch (error) {
      console.error("Error saving stories:", error);
      return {
        success: false,
        error: "Failed to save stories",
      };
    }
  }

  /**
   * Save stories with sprints
   */
  private async saveStoriesWithSprints(
    storyData: MCPStoryGenerationResult,
    context: SprintiQContext,
    options?: {
      sprintDuration?: number;
      createSprintFolder?: boolean;
    }
  ): Promise<MCPToolResult> {
    try {
      // First save stories as individual tasks
      const storiesResult = await this.saveStoriesOnly(storyData, context);

      if (!storiesResult.success) {
        return storiesResult;
      }

      // Then create a sprint and assign the stories to it
      const sprintName = `Sprint ${new Date().toISOString().split("T")[0]}`;
      const sprintParams = {
        sprints: [
          {
            name: sprintName,
            goal: `Complete ${storyData.stories.length} user stories`,
            duration: options?.sprintDuration || 14,
          },
        ],
        sprintFolderId:
          context.workspaceData?.spaces?.[0]?.sprint_folders?.[0]?.id ||
          "default",
        spaceId: context.workspaceData?.spaces?.[0]?.id || "default",
        workspaceId: context.workspaceId,
      };

      const result = await createSprints(sprintParams);

      return {
        success: true,
        data: {
          stories: storiesResult.data.savedStories,
          sprints: result,
        },
        metadata: {
          action: "stories_saved_with_sprints",
          workspaceId: context.workspaceId,
        },
      };
    } catch (error) {
      console.error("Error saving stories with sprints:", error);
      return {
        success: false,
        error: "Failed to save stories with sprints",
      };
    }
  }

  /**
   * Helper methods
   */
  private toolRequiresTeamMembers(toolName: string): boolean {
    const teamRequiredTools = [
      "generateUserStories",
      "analyzeTaskPriority",
      "assignTask",
      "getTeamCapacity",
    ];
    return teamRequiredTools.includes(toolName);
  }

  private createExecutionContext(userSession: {
    user: MCPValidatedUser;
    workspace?: MCPWorkspaceInfo;
    teamMembers?: MCPTeamInfo[];
  }): SprintiQContext {
    if (!userSession.workspace) {
      throw new Error("No workspace selected");
    }

    return mcpUserValidationService.createSprintiQContext(
      userSession.user,
      userSession.workspace.workspace_id,
      undefined, // projectId
      undefined, // sprintId
      userSession.teamMembers?.[0]?.id // teamId
    );
  }

  private async executeTool(
    toolName: string,
    params: any,
    context: SprintiQContext
  ): Promise<MCPToolResult> {
    try {
      // For now, we'll use the internal server implementation
      // This can be extended to use external MCP servers
      const { SprintiQMCPServer } = await import("./server");
      const server = new SprintiQMCPServer();

      const result = await server.callTool(toolName, { ...params, context });

      return {
        success: true,
        data: result,
        metadata: {
          tool: toolName,
          executedAt: new Date(),
        },
      };
    } catch (error) {
      console.error("Error executing tool:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Tool execution failed",
      };
    }
  }

  /**
   * Cleanup inactive connections
   */
  async cleanupInactiveConnections(
    maxIdleTime: number = 30 * 60 * 1000
  ): Promise<void> {
    const now = new Date();
    const cutoff = new Date(now.getTime() - maxIdleTime);

    for (const [email, connection] of this.activeConnections.entries()) {
      if (connection.lastActivity && connection.lastActivity < cutoff) {
        this.activeConnections.delete(email);
        this.userSessions.delete(email);
        console.log(`Cleaned up inactive connection for ${email}`);
      }
    }
  }

  /**
   * Disconnect user session
   */
  async disconnectUser(userEmail: string): Promise<void> {
    this.activeConnections.delete(userEmail);
    this.userSessions.delete(userEmail);
    console.log(`Disconnected user session for ${userEmail}`);
  }

  /**
   * Get authorization info for a user
   */
  async getAuthorizationInfo(userEmail: string): Promise<MCPAuthorizationInfo> {
    const authStatus = await this.checkUserAuthentication(userEmail);

    if (!authStatus.isAuthenticated) {
      return {
        isRequired: true,
        authorizationUrl: authStatus.authorizationUrl,
        message:
          authStatus.error ||
          "Please sign in to SprintIQ to access MCP features.",
        redirectUrl: this.MCP_CALLBACK_URL,
      };
    }

    return {
      isRequired: false,
      message: "User is authenticated and ready to use MCP features.",
    };
  }
}

// Export singleton instance
export const enhancedMCPService = EnhancedMCPService.getInstance();
