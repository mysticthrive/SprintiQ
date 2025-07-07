import { createClientSupabaseClient } from "@/lib/supabase/client";
import type {
  Team,
  TeamMember,
  Role,
  Level,
  Profile,
} from "@/lib/database.types";

export interface TeamWithMembers extends Team {
  team_members: (TeamMember & {
    profile?: Profile;
    role?: Role;
    level?: Level;
  })[];
  memberCount: number;
}

export interface TeamMemberForAssignment {
  id: string;
  name: string;
  avatar_url: string;
  email: string;
  role: string;
  level: "Junior" | "Mid" | "Senior" | "Lead";
  skills: string[];
  availability: number;
  teamName: string;
  teamId: string;
}

/**
 * Fetch all teams and their members for a workspace
 */
export async function fetchTeamsWithMembers(workspaceId: string): Promise<{
  teams: TeamWithMembers[];
  error?: string;
}> {
  try {
    const supabase = createClientSupabaseClient();

    console.log("Fetching teams for workspace:", workspaceId);

    // First, get the workspace UUID
    const { data: workspace, error: workspaceError } = await supabase
      .from("workspaces")
      .select("id")
      .eq("workspace_id", workspaceId)
      .single();

    if (workspaceError || !workspace) {
      console.error("Workspace not found:", workspaceId, workspaceError);
      return {
        teams: [],
        error: "Workspace not found",
      };
    }

    console.log("Found workspace UUID:", workspace.id);

    // Check if teams table exists by trying a simple query
    const { data: teamsTest, error: teamsTestError } = await supabase
      .from("teams")
      .select("id")
      .limit(1);

    if (teamsTestError) {
      console.error("Teams table not available:", teamsTestError);
      return {
        teams: [],
        error:
          "Teams feature not available. Please set up the teams table first.",
      };
    }

    // Get all teams for the workspace
    const { data: teamsData, error: teamsError } = await supabase
      .from("teams")
      .select("*")
      .eq("workspace_id", workspace.id);

    if (teamsError) {
      console.error("Error fetching teams:", teamsError);
      return {
        teams: [],
        error: `Failed to fetch teams: ${teamsError.message}`,
      };
    }

    console.log(
      `Found ${
        teamsData?.length || 0
      } teams for workspace ${workspaceId} (UUID: ${workspace.id})`
    );

    // Log team details for debugging
    if (teamsData && teamsData.length > 0) {
      teamsData.forEach((team) => {
        console.log(
          `Team: ${team.name} (ID: ${team.id}, Workspace: ${team.workspace_id})`
        );
      });
    }

    // Check if team_members table exists
    const { data: membersTest, error: membersTestError } = await supabase
      .from("team_members")
      .select("id")
      .limit(1);

    if (membersTestError) {
      console.error("Team members table not available:", membersTestError);
      return {
        teams: [],
        error:
          "Team members feature not available. Please set up the team_members table first.",
      };
    }

    // For each team, get its members with related data
    const teamsWithMembers: TeamWithMembers[] = [];

    for (const team of teamsData || []) {
      console.log(`Fetching members for team: ${team.name} (${team.id})`);

      const { data: teamMembersData, error: teamMembersError } = await supabase
        .from("team_members")
        .select(
          `
          id,
          user_id,
          name,
          email,
          role_id,
          level_id,
          is_registered,
          description,
          created_at,
          profile:profiles!user_id(*),
          role:roles!role_id(*),
          level:levels!level_id(*),
          weekly_hours
        `
        )
        .eq("team_id", team.id);

      if (teamMembersError) {
        console.error(
          `Error fetching members for team ${team.id}:`,
          teamMembersError
        );
        // Continue with empty members array for this team
      }

      const members = teamMembersData || [];
      console.log(`Found ${members.length} members for team ${team.name}`);

      teamsWithMembers.push({
        ...team,
        team_members: members,
        memberCount: members.length,
      });
    }

    console.log(`Total teams with members: ${teamsWithMembers.length}`);
    return { teams: teamsWithMembers };
  } catch (error) {
    console.error("Error fetching teams with members:", error);
    return {
      teams: [],
      error: "Failed to fetch teams. Please check your database setup.",
    };
  }
}

/**
 * Convert database team members to the format expected by the story generator
 */
export function convertTeamMembersForAssignment(
  teams: TeamWithMembers[]
): TeamMemberForAssignment[] {
  const convertedMembers: TeamMemberForAssignment[] = [];

  for (const team of teams) {
    for (const member of team.team_members) {
      // Get member name from profile or email
      const name = member.profile?.full_name || member.name || "Unknown Member";

      // Get email from profile or member
      const email = member.profile?.email || member.email || "";

      // Get role name
      const roleName = member.role?.name || "Team Member";

      // Map level name to expected format
      const levelMap: Record<string, "Junior" | "Mid" | "Senior" | "Lead"> = {
        Junior: "Junior",
        "Mid-Level": "Mid",
        Senior: "Senior",
        Lead: "Lead",
        Principal: "Senior",
        Architect: "Senior",
        Manager: "Lead",
        Director: "Lead",
        VP: "Lead",
        "C-Level": "Lead",
      };

      const level = levelMap[member.level?.name || "Mid-Level"] || "Mid";

      // Generate skills based on role
      const roleSkills: Record<string, string[]> = {
        "Front-end Developer": [
          "React",
          "Vue",
          "Angular",
          "JavaScript",
          "TypeScript",
          "CSS",
          "HTML",
        ],
        "Back-end Developer": [
          "Java",
          "Spring",
          "Node.js",
          "Python",
          "C#",
          "Database Design",
        ],
        "Full-stack Developer": [
          "React",
          "Node.js",
          "Java",
          "Spring",
          "Database",
          "DevOps",
        ],
        "UI/UX Designer": [
          "Figma",
          "Adobe XD",
          "User Research",
          "Prototyping",
          "Design Systems",
        ],
        "Product Manager": [
          "Product Strategy",
          "User Research",
          "Agile",
          "Stakeholder Management",
        ],
        "Project Manager": [
          "Project Management",
          "Agile",
          "Scrum",
          "Team Coordination",
        ],
        "DevOps Engineer": [
          "Docker",
          "Kubernetes",
          "AWS",
          "CI/CD",
          "Infrastructure",
          "Monitoring",
        ],
        "QA Engineer": [
          "Testing",
          "Automation",
          "Selenium",
          "Jest",
          "Quality Assurance",
        ],
        "Data Scientist": [
          "Python",
          "Machine Learning",
          "Statistics",
          "Data Analysis",
          "SQL",
        ],
        "Business Analyst": [
          "Business Analysis",
          "Requirements Gathering",
          "Process Modeling",
        ],
        "Marketing Specialist": [
          "Marketing Strategy",
          "Digital Marketing",
          "Content Creation",
        ],
        "Sales Representative": [
          "Sales",
          "Customer Relationship",
          "Negotiation",
        ],
        "Content Writer": ["Content Creation", "Copywriting", "SEO", "Editing"],
        "Graphic Designer": [
          "Graphic Design",
          "Adobe Creative Suite",
          "Visual Design",
        ],
        "System Administrator": [
          "System Administration",
          "IT Infrastructure",
          "Security",
        ],
      };

      const skills = roleSkills[roleName] || ["General Skills"];

      convertedMembers.push({
        id: member.id,
        name,
        avatar_url: member.profile?.avatar_url || "",
        email,
        role: roleName,
        level,
        skills,
        availability: member.weekly_hours || 40, // Use actual weekly hours from database
        teamName: team.name,
        teamId: team.id,
      });
    }
  }

  return convertedMembers;
}

/**
 * Fetch teams and convert members for story assignment
 */
export async function fetchTeamsForAssignment(workspaceId: string): Promise<{
  teamMembers: TeamMemberForAssignment[];
  error?: string;
}> {
  const { teams, error } = await fetchTeamsWithMembers(workspaceId);

  if (error) {
    return { teamMembers: [], error };
  }

  const teamMembers = convertTeamMembersForAssignment(teams);

  return { teamMembers };
}
