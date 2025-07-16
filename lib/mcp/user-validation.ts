import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  MCPUserValidationResult,
  MCPValidatedUser,
  MCPWorkspaceInfo,
  MCPSpaceInfo,
  MCPProjectInfo,
  MCPSprintFolderInfo,
  MCPSprintInfo,
  MCPTeamInfo,
  SprintiQContext,
} from "./types";

/**
 * MCP User Validation Service
 * Handles email-based user validation and context fetching
 */
export class MCPUserValidationService {
  private static instance: MCPUserValidationService;

  private constructor() {}

  static getInstance(): MCPUserValidationService {
    if (!MCPUserValidationService.instance) {
      MCPUserValidationService.instance = new MCPUserValidationService();
    }
    return MCPUserValidationService.instance;
  }

  /**
   * Validate user by email and get their full context
   */
  async validateUserByEmail(email: string): Promise<MCPUserValidationResult> {
    try {
      const supabase = await createServerSupabaseClient();

      // Check if user exists in users table
      const { data: user, error: userError } = await supabase
        .from("users")
        .select("id, name, email, allowed, company, created_at")
        .eq("email", email.toLowerCase().trim())
        .maybeSingle();

      if (userError) {
        return {
          isValid: false,
          error: "Failed to query user database",
        };
      }

      if (!user) {
        return {
          isValid: false,
          error:
            "User not found. Please join SprintiQ to access these features.",
        };
      }

      if (!user.allowed) {
        return {
          isValid: false,
          error:
            "Account not yet approved. Please wait for admin approval or contact support.",
        };
      }

      // Get user's workspaces and full context
      const workspaces = await this.getUserWorkspaces(user.id);

      const validatedUser: MCPValidatedUser = {
        id: user.id,
        email: user.email,
        name: user.name,
        allowed: user.allowed,
        company: user.company || undefined,
        workspaces,
      };

      return {
        isValid: true,
        user: validatedUser,
      };
    } catch (error) {
      console.error("Error validating user by email:", error);
      return {
        isValid: false,
        error: "Internal server error during user validation",
      };
    }
  }

  /**
   * Get user's workspaces and their full context
   * Fetches both owned workspaces and member workspaces
   */
  private async getUserWorkspaces(userId: string): Promise<MCPWorkspaceInfo[]> {
    const supabase = await createServerSupabaseClient();
    const workspaces: MCPWorkspaceInfo[] = [];
    const processedWorkspaceIds = new Set<string>();

    try {
      // 1. Get workspaces where user is the owner
      const { data: ownedWorkspaces, error: ownedError } = await supabase
        .from("workspaces")
        .select(
          `
          id,
          workspace_id,
          name,
          created_at
        `
        )
        .eq("owner_id", userId);

      if (ownedError) {
        console.error("Error fetching owned workspaces:", ownedError);
      } else if (ownedWorkspaces) {
        for (const workspace of ownedWorkspaces) {
          const workspaceInfo: MCPWorkspaceInfo = {
            id: workspace.id,
            workspace_id: workspace.workspace_id,
            name: workspace.name,
            role: "owner", // User is the owner
            spaces: [],
            teams: [],
          };

          // Get spaces for this workspace
          const spaces = await this.getWorkspaceSpaces(workspace.id);
          workspaceInfo.spaces = spaces;

          // Get teams for this workspace
          const teams = await this.getWorkspaceTeams(workspace.id, userId);
          workspaceInfo.teams = teams;

          workspaces.push(workspaceInfo);
          processedWorkspaceIds.add(workspace.id);
        }
      }

      // 2. Get workspaces where user is a member (but not owner)
      const { data: memberships, error: membershipError } = await supabase
        .from("workspace_members")
        .select(
          `
          role,
          workspace_id,
          workspaces!inner (
            id,
            workspace_id,
            name,
            created_at
          )
        `
        )
        .eq("user_id", userId)
        .eq("status", "active");

      if (membershipError) {
        console.error("Error fetching workspace memberships:", membershipError);
      } else if (memberships) {
        for (const membership of memberships) {
          const workspace = membership.workspaces as any;

          // Skip if we already processed this workspace as owned
          if (processedWorkspaceIds.has(workspace.id)) {
            continue;
          }

          const workspaceInfo: MCPWorkspaceInfo = {
            id: workspace.id,
            workspace_id: workspace.workspace_id,
            name: workspace.name,
            role: membership.role,
            spaces: [],
            teams: [],
          };

          // Get spaces for this workspace
          const spaces = await this.getWorkspaceSpaces(workspace.id);
          workspaceInfo.spaces = spaces;

          // Get teams for this workspace
          const teams = await this.getWorkspaceTeams(workspace.id, userId);
          workspaceInfo.teams = teams;

          workspaces.push(workspaceInfo);
          processedWorkspaceIds.add(workspace.id);
        }
      }

      return workspaces;
    } catch (error) {
      console.error("Error fetching user workspaces:", error);
      return [];
    }
  }

  /**
   * Get spaces for a workspace
   */
  private async getWorkspaceSpaces(
    workspaceId: string
  ): Promise<MCPSpaceInfo[]> {
    const supabase = await createServerSupabaseClient();
    const spaces: MCPSpaceInfo[] = [];

    try {
      const { data: spacesData, error: spacesError } = await supabase
        .from("spaces")
        .select(
          `
          id,
          space_id,
          name,
          description,
          created_at
        `
        )
        .eq("workspace_id", workspaceId)
        .order("created_at", { ascending: true });

      if (spacesError || !spacesData) {
        console.error("Error fetching spaces:", spacesError);
        return [];
      }

      for (const space of spacesData) {
        const spaceInfo: MCPSpaceInfo = {
          id: space.id,
          space_id: space.space_id,
          name: space.name,
          description: space.description || undefined,
          projects: [],
          sprint_folders: [],
        };

        // Get projects for this space
        const projects = await this.getSpaceProjects(space.id);
        spaceInfo.projects = projects;

        // Get sprint folders for this space
        const sprintFolders = await this.getSpaceSprintFolders(space.id);
        spaceInfo.sprint_folders = sprintFolders;

        spaces.push(spaceInfo);
      }

      return spaces;
    } catch (error) {
      console.error("Error fetching workspace spaces:", error);
      return [];
    }
  }

  /**
   * Get projects for a space
   */
  private async getSpaceProjects(spaceId: string): Promise<MCPProjectInfo[]> {
    const supabase = await createServerSupabaseClient();

    try {
      const { data: projects, error: projectsError } = await supabase
        .from("projects")
        .select(
          `
          id,
          project_id,
          name,
          type,
          created_at
        `
        )
        .eq("space_id", spaceId)
        .order("created_at", { ascending: true });

      if (projectsError || !projects) {
        console.error("Error fetching projects:", projectsError);
        return [];
      }

      return projects.map((project) => ({
        id: project.id,
        project_id: project.project_id,
        name: project.name,
        type: project.type || undefined,
      }));
    } catch (error) {
      console.error("Error fetching space projects:", error);
      return [];
    }
  }

  /**
   * Get sprint folders for a space
   */
  private async getSpaceSprintFolders(
    spaceId: string
  ): Promise<MCPSprintFolderInfo[]> {
    const supabase = await createServerSupabaseClient();

    try {
      const { data: sprintFolders, error: sprintFoldersError } = await supabase
        .from("sprint_folders")
        .select(
          `
          id,
          sprint_folder_id,
          name,
          created_at
        `
        )
        .eq("space_id", spaceId)
        .order("created_at", { ascending: true });

      if (sprintFoldersError || !sprintFolders) {
        console.error("Error fetching sprint folders:", sprintFoldersError);
        return [];
      }

      const sprintFolderInfos: MCPSprintFolderInfo[] = [];

      for (const folder of sprintFolders) {
        const sprints = await this.getSprintFolderSprints(folder.id);

        sprintFolderInfos.push({
          id: folder.id,
          sprint_folder_id: folder.sprint_folder_id,
          name: folder.name,
          sprints,
        });
      }

      return sprintFolderInfos;
    } catch (error) {
      console.error("Error fetching space sprint folders:", error);
      return [];
    }
  }

  /**
   * Get sprints for a sprint folder
   */
  private async getSprintFolderSprints(
    sprintFolderId: string
  ): Promise<MCPSprintInfo[]> {
    const supabase = await createServerSupabaseClient();

    try {
      const { data: sprints, error: sprintsError } = await supabase
        .from("sprints")
        .select(
          `
          id,
          sprint_id,
          name,
          status,
          created_at
        `
        )
        .eq("sprint_folder_id", sprintFolderId)
        .order("created_at", { ascending: true });

      if (sprintsError || !sprints) {
        console.error("Error fetching sprints:", sprintsError);
        return [];
      }

      return sprints.map((sprint) => ({
        id: sprint.id,
        sprint_id: sprint.sprint_id,
        name: sprint.name,
        status: sprint.status,
      }));
    } catch (error) {
      console.error("Error fetching sprint folder sprints:", error);
      return [];
    }
  }

  /**
   * Get teams for a workspace
   */
  private async getWorkspaceTeams(
    workspaceId: string,
    userId: string
  ): Promise<MCPTeamInfo[]> {
    const supabase = await createServerSupabaseClient();

    try {
      // Get all teams in the workspace
      const { data: teams, error: teamsError } = await supabase
        .from("teams")
        .select(
          `
          id,
          name,
          description,
          created_at
        `
        )
        .eq("workspace_id", workspaceId)
        .order("created_at", { ascending: true });

      if (teamsError || !teams) {
        console.error("Error fetching teams:", teamsError);
        return [];
      }

      const teamInfos: MCPTeamInfo[] = [];

      for (const team of teams) {
        // Check if user is a member of this team
        const { data: membership, error: membershipError } = await supabase
          .from("team_members")
          .select(
            `
            role_id,
            level_id,
            roles!inner (name),
            levels!inner (name)
          `
          )
          .eq("team_id", team.id)
          .eq("user_id", userId)
          .eq("is_registered", true)
          .maybeSingle();

        if (membershipError) {
          console.error("Error fetching team membership:", membershipError);
          continue;
        }

        // If user is a member, include role and level info
        if (membership) {
          const membershipData = membership as any;
          teamInfos.push({
            id: team.id,
            name: team.name,
            description: team.description || undefined,
            role: membershipData.roles?.name,
            level: membershipData.levels?.name,
          });
        } else {
          // User is not a member, include basic info only
          teamInfos.push({
            id: team.id,
            name: team.name,
            description: team.description || undefined,
          });
        }
      }

      return teamInfos;
    } catch (error) {
      console.error("Error fetching workspace teams:", error);
      return [];
    }
  }

  /**
   * Create SprintiQ context from validated user and workspace
   */
  createSprintiQContext(
    validatedUser: MCPValidatedUser,
    workspaceId?: string,
    projectId?: string,
    sprintId?: string,
    teamId?: string
  ): SprintiQContext {
    let targetWorkspace: MCPWorkspaceInfo | undefined;

    if (workspaceId) {
      targetWorkspace = validatedUser.workspaces.find(
        (w) => w.workspace_id === workspaceId || w.id === workspaceId
      );
    } else if (validatedUser.workspaces.length > 0) {
      // Use first workspace if none specified
      targetWorkspace = validatedUser.workspaces[0];
    }

    if (!targetWorkspace) {
      throw new Error("No accessible workspace found for user");
    }

    // Determine permissions based on role
    const permissions: string[] = [];
    switch (targetWorkspace.role) {
      case "owner":
        permissions.push("admin", "write", "read");
        break;
      case "admin":
        permissions.push("admin", "write", "read");
        break;
      case "member":
        permissions.push("write", "read");
        break;
      default:
        permissions.push("read");
    }

    return {
      workspaceId: targetWorkspace.workspace_id,
      userId: validatedUser.id,
      email: validatedUser.email,
      teamId,
      projectId,
      sprintId,
      permissions,
      workspaceData: targetWorkspace,
    };
  }

  /**
   * Get user ID from email (quick lookup)
   */
  async getUserIdFromEmail(email: string): Promise<string | null> {
    try {
      const supabase = await createServerSupabaseClient();

      const { data: user, error } = await supabase
        .from("users")
        .select("id")
        .eq("email", email.toLowerCase().trim())
        .eq("allowed", true)
        .maybeSingle();

      if (error || !user) {
        return null;
      }

      return user.id;
    } catch (error) {
      console.error("Error getting user ID from email:", error);
      return null;
    }
  }
}

// Export singleton instance
export const mcpUserValidationService = MCPUserValidationService.getInstance();
