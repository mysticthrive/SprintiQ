import type { Database as DB } from "@/lib/database.types";

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          updated_at: string | null;
          username: string | null;
          full_name: string | null;
          avatar_url: string | null;
          email: string | null;
          company: string | null;
          language: string | null;
          timezone: string | null;
          notify_timezone_changes: boolean | null;
          start_of_week: string | null;
          time_format: string | null;
          date_format: string | null;
          inbox_notifications: string | null;
          email_notifications: string | null;
          browser_notifications_enabled: boolean | null;
          mobile_notifications: string | null;
          auto_watch_tasks: boolean | null;
          auto_watch_create_task: boolean | null;
          auto_watch_new_subtask: boolean | null;
          auto_watch_edit_task: boolean | null;
          auto_watch_comment_task: boolean | null;
          smart_notifications_enabled: boolean | null;
          smart_notifications_delay: string | null;
        };
        Insert: {
          id: string;
          updated_at?: string | null;
          username?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          email?: string | null;
          company?: string | null;
          language?: string | null;
          timezone?: string | null;
          notify_timezone_changes?: boolean | null;
          start_of_week?: string | null;
          time_format?: string | null;
          date_format?: string | null;
          inbox_notifications?: string | null;
          email_notifications?: string | null;
          browser_notifications_enabled?: boolean | null;
          mobile_notifications?: string | null;
          auto_watch_tasks?: boolean | null;
          auto_watch_create_task?: boolean | null;
          auto_watch_new_subtask?: boolean | null;
          auto_watch_edit_task?: boolean | null;
          auto_watch_comment_task?: boolean | null;
          smart_notifications_enabled?: boolean | null;
          smart_notifications_delay?: string | null;
        };
        Update: {
          id?: string;
          updated_at?: string | null;
          username?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          email?: string | null;
          company?: string | null;
          language?: string | null;
          timezone?: string | null;
          notify_timezone_changes?: boolean | null;
          start_of_week?: string | null;
          time_format?: string | null;
          date_format?: string | null;
          inbox_notifications?: string | null;
          email_notifications?: string | null;
          browser_notifications_enabled?: boolean | null;
          mobile_notifications?: string | null;
          auto_watch_tasks?: boolean | null;
          auto_watch_create_task?: boolean | null;
          auto_watch_new_subtask?: boolean | null;
          auto_watch_edit_task?: boolean | null;
          auto_watch_comment_task?: boolean | null;
          smart_notifications_enabled?: boolean | null;
          smart_notifications_delay?: string | null;
        };
      };
      workspaces: {
        Row: {
          id: string;
          workspace_id: string;
          name: string;
          created_at: string;
          updated_at: string;
          owner_id: string;
          purpose: string;
          type: string;
          category: string;
        };
        Insert: {
          id?: string;
          workspace_id?: string;
          name: string;
          created_at?: string;
          updated_at?: string;
          owner_id: string;
          purpose: string;
          type: string;
          category: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          name?: string;
          created_at?: string;
          updated_at?: string;
          owner_id?: string;
          purpose?: string;
          type?: string;
          category?: string;
        };
      };
      workspace_members: {
        Row: {
          id: string;
          workspace_id: string;
          user_id: string;
          email: string | null;
          role: string;
          status: string;
          invited_at: string;
          joined_at: string | null;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          user_id: string;
          email?: string | null;
          role?: string;
          status?: string;
          invited_at?: string;
          joined_at?: string | null;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          user_id?: string;
          email?: string | null;
          role?: string;
          status?: string;
          invited_at?: string;
          joined_at?: string | null;
        };
      };
      teams: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          workspace_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          workspace_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          workspace_id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      team_members: {
        Row: {
          id: string;
          team_id: string;
          user_id: string | null;
          email: string | null;
          role_id: string;
          level_id: string;
          description: string | null;
          is_registered: boolean;
          weekly_hours: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          team_id: string;
          user_id?: string | null;
          email?: string | null;
          role_id: string;
          level_id: string;
          description?: string | null;
          is_registered?: boolean;
          weekly_hours?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          team_id?: string;
          user_id?: string | null;
          email?: string | null;
          role_id?: string;
          level_id?: string;
          description?: string | null;
          is_registered?: boolean;
          weekly_hours?: number | null;
          created_at?: string;
        };
      };
      spaces: {
        Row: {
          id: string;
          space_id: string;
          name: string;
          description: string | null;
          icon: string;
          is_private: boolean;
          workspace_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          space_id?: string;
          name: string;
          description?: string | null;
          icon?: string;
          is_private?: boolean;
          workspace_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          space_id?: string;
          name?: string;
          description?: string | null;
          icon?: string;
          is_private?: boolean;
          workspace_id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      space_members: {
        Row: {
          id: string;
          space_id: string;
          user_id: string;
          role: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          space_id: string;
          user_id: string;
          role?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          space_id?: string;
          user_id?: string;
          role?: string;
          created_at?: string;
        };
      };
      projects: {
        Row: {
          id: string;
          project_id: string;
          name: string;
          space_id: string;
          workspace_id: string;
          created_at: string;
          updated_at: string;
          type: string | null;
          external_id: string | null;
          external_data: Json | null;
        };
        Insert: {
          id?: string;
          project_id?: string;
          name: string;
          space_id: string;
          workspace_id: string;
          created_at?: string;
          updated_at?: string;
          type?: string | null;
          external_id?: string | null;
          external_data?: Json | null;
        };
        Update: {
          id?: string;
          project_id?: string;
          name?: string;
          space_id?: string;
          workspace_id?: string;
          created_at?: string;
          updated_at?: string;
          type?: string | null;
          external_id?: string | null;
          external_data?: Json | null;
        };
      };
      tasks: {
        Row: {
          id: string;
          task_id: string;
          name: string;
          description: string | null;
          status_id: string;
          priority: string;
          assignee_id: string | null;
          project_id: string | null;
          sprint_id: string | null;
          space_id: string;
          workspace_id: string;
          start_date: string | null;
          due_date: string | null;
          parent_task_id: string | null;
          created_at: string;
          updated_at: string;
          created_by: string | null;
          embedding: number[] | null;
          type: string | null;
          external_id: string | null;
          external_data: Json | null;
          last_synced_at: string | null;
          sync_status: string | null;
          pending_sync: boolean | null;
          business_value?: number | null;
          user_impact?: number | null;
          complexity?: number | null;
          risk?: number | null;
          dependencies?: number | null;
          estimated_time?: number | null;
          story_points?: number | null;
          velocity?: number | null;
          completion_rate?: number | null;
          anti_pattern_warnings?: string[] | null;
          success_pattern?: string | null;
        };
        Insert: {
          id?: string;
          task_id?: string;
          name: string;
          description?: string | null;
          status_id: string;
          priority?: string;
          assignee_id?: string | null;
          project_id?: string | null;
          sprint_id?: string | null;
          space_id: string;
          workspace_id: string;
          start_date?: string | null;
          due_date?: string | null;
          parent_task_id?: string | null;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
          embedding?: number[] | null;
          type?: string | null;
          external_id?: string | null;
          external_data?: Json | null;
          last_synced_at?: string | null;
          sync_status?: string | null;
          pending_sync?: boolean | null;
          business_value?: number | null;
          user_impact?: number | null;
          complexity?: number | null;
          risk?: number | null;
          dependencies?: number | null;
          estimated_time?: number | null;
          story_points?: number | null;
          velocity?: number | null;
          completion_rate?: number | null;
          anti_pattern_warnings?: string[] | null;
          success_pattern?: string | null;
        };
        Update: {
          id?: string;
          task_id?: string;
          name?: string;
          description?: string | null;
          status_id?: string;
          priority?: string;
          assignee_id?: string | null;
          project_id?: string | null;
          sprint_id?: string | null;
          space_id?: string;
          workspace_id?: string;
          start_date?: string | null;
          due_date?: string | null;
          parent_task_id?: string | null;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
          embedding?: number[] | null;
          type?: string | null;
          external_id?: string | null;
          external_data?: Json | null;
          last_synced_at?: string | null;
          sync_status?: string | null;
          pending_sync?: boolean | null;
          business_value?: number | null;
          user_impact?: number | null;
          complexity?: number | null;
          risk?: number | null;
          dependencies?: number | null;
          estimated_time?: number | null;
          story_points?: number | null;
          velocity?: number | null;
          completion_rate?: number | null;
          anti_pattern_warnings?: string[] | null;
          success_pattern?: string | null;
        };
      };
      tags: {
        Row: {
          id: string;
          tag_id: string;
          name: string;
          color: string;
          workspace_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tag_id?: string;
          name: string;
          color?: string;
          workspace_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tag_id?: string;
          name?: string;
          color?: string;
          workspace_id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      statuses: {
        Row: {
          id: string;
          status_id: string;
          name: string;
          color: string;
          position: number;
          workspace_id: string;
          type: string;
          status_type_id: string | null;
          project_id: string | null;
          space_id: string | null;
          sprint_id: string | null;
          created_at: string;
          updated_at: string;
          integration_type: string | null;
          external_id: string | null;
          external_data: Json | null;
          last_synced_at: string | null;
          sync_status: string | null;
          pending_sync: boolean | null;
        };
        Insert: {
          id?: string;
          status_id?: string;
          name: string;
          color?: string;
          position?: number;
          workspace_id: string;
          type?: string;
          status_type_id?: string | null;
          project_id?: string | null;
          space_id?: string | null;
          sprint_id?: string | null;
          created_at?: string;
          updated_at?: string;
          integration_type?: string | null;
          external_id?: string | null;
          external_data?: Json | null;
          last_synced_at?: string | null;
          sync_status?: string | null;
          pending_sync?: boolean | null;
        };
        Update: {
          id?: string;
          status_id?: string;
          name?: string;
          color?: string;
          position?: number;
          workspace_id?: string;
          type?: string;
          status_type_id?: string | null;
          project_id?: string | null;
          space_id?: string | null;
          sprint_id?: string | null;
          created_at?: string;
          updated_at?: string;
          integration_type?: string | null;
          external_id?: string | null;
          external_data?: Json | null;
          last_synced_at?: string | null;
          sync_status?: string | null;
          pending_sync?: boolean | null;
        };
      };
      status_types: {
        Row: {
          id: string;
          name: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      task_tags: {
        Row: {
          id: string;
          task_id: string;
          tag_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          task_id: string;
          tag_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          task_id?: string;
          tag_id?: string;
          created_at?: string;
        };
      };
      events: {
        Row: {
          id: string;
          event_id: string;
          type: string;
          entity_type: string;
          entity_id: string;
          entity_name: string;
          user_id: string;
          workspace_id: string;
          space_id: string | null;
          project_id: string | null;
          parent_task_id: string | null;
          description: string;
          metadata: Json;
          is_read: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          event_id?: string;
          type: string;
          entity_type: string;
          entity_id: string;
          entity_name: string;
          user_id: string;
          workspace_id: string;
          space_id?: string | null;
          project_id?: string | null;
          parent_task_id?: string | null;
          description: string;
          metadata?: Json;
          is_read?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          type?: string;
          entity_type?: string;
          entity_id?: string;
          entity_name?: string;
          user_id?: string;
          workspace_id?: string;
          space_id?: string | null;
          project_id?: string | null;
          parent_task_id?: string | null;
          description?: string;
          metadata?: Json;
          is_read?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      allowed_users: {
        Row: {
          id: string;
          email: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          email: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          email?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      sprint_folders: {
        Row: {
          id: string;
          sprint_folder_id: string;
          name: string;
          sprint_start_day_id: string | null;
          duration_week: number;
          space_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          sprint_folder_id?: string;
          name: string;
          sprint_start_day_id?: string | null;
          duration_week?: number;
          space_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          sprint_folder_id?: string;
          name?: string;
          sprint_start_day_id?: string | null;
          duration_week?: number;
          space_id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      sprints: {
        Row: {
          id: string;
          sprint_id: string;
          name: string;
          goal: string | null;
          task_id: string | null;
          start_date: string | null;
          end_date: string | null;
          sprint_folder_id: string;
          space_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          sprint_id?: string;
          name: string;
          goal?: string | null;
          task_id?: string | null;
          start_date?: string | null;
          end_date?: string | null;
          sprint_folder_id: string;
          space_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          sprint_id?: string;
          name?: string;
          goal?: string | null;
          task_id?: string | null;
          start_date?: string | null;
          end_date?: string | null;
          sprint_folder_id?: string;
          space_id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      days: {
        Row: {
          id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          created_at?: string;
        };
      };
      jira_integrations: {
        Row: {
          id: string;
          workspace_id: string;
          jira_domain: string;
          jira_email: string;
          jira_api_token: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          jira_domain: string;
          jira_email: string;
          jira_api_token: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          jira_domain?: string;
          jira_email?: string;
          jira_api_token?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      jira_projects: {
        Row: {
          id: string;
          jira_integration_id: string;
          jira_project_id: string;
          jira_project_key: string;
          jira_project_name: string;
          jira_project_description: string | null;
          jira_project_lead: string | null;
          jira_project_url: string | null;
          space_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          jira_integration_id: string;
          jira_project_id: string;
          jira_project_key: string;
          jira_project_name: string;
          jira_project_description?: string | null;
          jira_project_lead?: string | null;
          jira_project_url?: string | null;
          space_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          jira_integration_id?: string;
          jira_project_id?: string;
          jira_project_key?: string;
          jira_project_name?: string;
          jira_project_description?: string | null;
          jira_project_lead?: string | null;
          jira_project_url?: string | null;
          space_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      roles: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      levels: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      slack_integrations: {
        Row: {
          id: string;
          workspace_id: string;
          slack_workspace_id: string;
          slack_workspace_name: string;
          slack_workspace_domain: string | null;
          access_token: string;
          bot_user_id: string | null;
          bot_username: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          slack_workspace_id: string;
          slack_workspace_name: string;
          slack_workspace_domain?: string | null;
          access_token: string;
          bot_user_id?: string | null;
          bot_username?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          slack_workspace_id?: string;
          slack_workspace_name?: string;
          slack_workspace_domain?: string | null;
          access_token?: string;
          bot_user_id?: string | null;
          bot_username?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      slack_channel_mappings: {
        Row: {
          id: string;
          slack_integration_id: string;
          channel_id: string;
          channel_name: string;
          channel_type: string;
          entity_type: string;
          entity_id: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slack_integration_id: string;
          channel_id: string;
          channel_name: string;
          channel_type: string;
          entity_type: string;
          entity_id: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          slack_integration_id?: string;
          channel_id?: string;
          channel_name?: string;
          channel_type?: string;
          entity_type?: string;
          entity_id?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      slack_notification_settings: {
        Row: {
          id: string;
          slack_integration_id: string;
          event_type: string;
          is_enabled: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slack_integration_id: string;
          event_type: string;
          is_enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          slack_integration_id?: string;
          event_type?: string;
          is_enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}

// Define a custom type for the Profile, if not already fully defined in DB
// This ensures we have the necessary fields for joined profiles
export type Profile = DB["public"]["Tables"]["profiles"]["Row"] & {
  // Add any specific joined fields if needed, e.g., for assignee or created_by
  // For now, assuming the base Row type is sufficient
};

export type Workspace = Database["public"]["Tables"]["workspaces"]["Row"] & {
  spaces: Space[]; // Example: if workspaces can fetch spaces directly
  teams?: Team[]; // Add teams to workspace type
};

export type Team = Database["public"]["Tables"]["teams"]["Row"] & {
  members?: TeamMember[];
  memberCount?: number;
};

export type TeamMember = Database["public"]["Tables"]["team_members"]["Row"] & {
  profile?: Profile;
  name?: string;
  role?: Role;
  level?: Level;
};

export type Role = Database["public"]["Tables"]["roles"]["Row"];
export type Level = Database["public"]["Tables"]["levels"]["Row"];

export type WorkspaceMember =
  Database["public"]["Tables"]["workspace_members"]["Row"];
export type Space = Database["public"]["Tables"]["spaces"]["Row"] & {
  projects: Project[]; // Example: if spaces can fetch projects directly
  sprint_folders: SprintFolder[]; // Add sprint folders to space type
};

export type SprintFolder =
  Database["public"]["Tables"]["sprint_folders"]["Row"] & {
    sprints: Sprint[]; // Example: if sprint folders can fetch sprints directly
    sprint_start_day?: Day; // Add the day relationship
    days?: Day; // Add the days relationship for foreign key constraint
  };

export type Sprint = Database["public"]["Tables"]["sprints"]["Row"] & {
  tasks: Task[]; // Example: if sprints can fetch tasks directly
  sprint_folder?: SprintFolder; // Add the sprint folder relationship
};

export type Project = Database["public"]["Tables"]["projects"]["Row"] & {
  tasks: Task[]; // Example: if projects can fetch tasks directly
};

export type Task = DB["public"]["Tables"]["tasks"]["Row"] & {
  assignee: Profile | null;
  status: DB["public"]["Tables"]["statuses"]["Row"] | null;
  task_tags: { tag: DB["public"]["Tables"]["tags"]["Row"] }[];
  created_by_profile: Pick<
    Profile,
    "id" | "full_name" | "avatar_url" | "email"
  > | null; // Add this line
  embedding: number[] | null;
};

export type SpaceMember = Database["public"]["Tables"]["space_members"]["Row"];
export type Tag = Database["public"]["Tables"]["tags"]["Row"];
export type Status = Database["public"]["Tables"]["statuses"]["Row"] & {
  status_type?: StatusType;
};

export type StatusType = Database["public"]["Tables"]["status_types"]["Row"];
export type TaskTag = Database["public"]["Tables"]["task_tags"]["Row"];
export type Event = Database["public"]["Tables"]["events"]["Row"] & {
  user?: Profile;
};

export type Day = Database["public"]["Tables"]["days"]["Row"];

export type JiraIntegration =
  Database["public"]["Tables"]["jira_integrations"]["Row"];

export type JiraProject = Database["public"]["Tables"]["jira_projects"]["Row"];

export type SlackIntegration =
  Database["public"]["Tables"]["slack_integrations"]["Row"];

export type SlackChannelMapping =
  Database["public"]["Tables"]["slack_channel_mappings"]["Row"];

export type SlackNotificationSetting =
  Database["public"]["Tables"]["slack_notification_settings"]["Row"];

// Re-export the original Database type
export type SupabaseDatabase = DB;
