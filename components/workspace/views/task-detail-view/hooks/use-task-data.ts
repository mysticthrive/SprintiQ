import { useState, useEffect } from "react";
import { createClientSupabaseClient } from "@/lib/supabase/client";
import { getTaskActivities } from "@/lib/events";
import type { Task, Workspace } from "@/lib/database.types";

export const useTaskData = (task: Task, workspace: Workspace) => {
  const [subtasks, setSubtasks] = useState<Task[]>([]);
  const [workspaceMembers, setWorkspaceMembers] = useState<any[]>([]);
  const [taskAssignees, setTaskAssignees] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);

  const supabase = createClientSupabaseClient();

  const loadSubtasks = async () => {
    if (!task.id) {
      console.error("❌ Task ID is missing:", task.id);
      return;
    }

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        console.error("❌ Auth error:", authError);
        return;
      }

      const { data: subtasksData, error } = await supabase
        .from("tasks")
        .select(
          `
          *,
          assignee:profiles!tasks_assignee_id_fkey(*),
          status:statuses(*),
          task_tags(
            tag:tags(*)
          )
        `
        )
        .eq("parent_task_id", task.id)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("❌ Query failed:", error);
        return;
      }

      setSubtasks(subtasksData || []);
    } catch (exception) {
      console.error("💥 Exception caught:", {
        message: exception instanceof Error ? exception.message : "Unknown",
        stack: exception instanceof Error ? exception.stack : "No stack",
        type: typeof exception,
      });
    }
  };

  const loadWorkspaceMembers = async () => {
    try {
      const { data: members, error: membersError } = await supabase
        .from("workspace_members")
        .select("id, user_id, email, role")
        .eq("workspace_id", workspace.id)
        .eq("status", "active");

      if (membersError) {
        console.error("Error loading workspace members:", membersError);
        return;
      }

      if (!members || members.length === 0) {
        setWorkspaceMembers([]);
        return;
      }

      const userIds = members.map((m) => m.user_id);
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name, email, avatar_url")
        .in("id", userIds);

      if (profilesError) {
        console.error("Error loading profiles:", profilesError);
        const membersWithoutProfiles = members.map((member) => ({
          id: member.user_id,
          full_name: "Unknown User",
          email: member.email || "",
          avatar_url: null,
        }));
        setWorkspaceMembers(membersWithoutProfiles);
        return;
      }

      const formattedMembers = members.map((member) => {
        const profile = profiles?.find((p) => p.id === member.user_id);
        return {
          id: member.user_id,
          full_name: profile?.full_name || "Unknown User",
          email: profile?.email || member.email || "",
          avatar_url: profile?.avatar_url || null,
        };
      });

      setWorkspaceMembers(formattedMembers);
    } catch (error) {
      console.error("Exception in loadWorkspaceMembers:", error);
    }
  };

  const loadTaskAssignees = async () => {
    try {
      if (task.assignee_id && task.assignee) {
        setTaskAssignees([task.assignee]);
      } else {
        setTaskAssignees([]);
      }
    } catch (error) {
      console.error("Error loading task assignees:", error);
    }
  };

  const loadTaskActivities = async () => {
    try {
      const activitiesData = await getTaskActivities(task.id, workspace.id);
      setActivities(activitiesData || []);
    } catch (error) {
      console.error("Error loading task activities:", error);
    }
  };

  useEffect(() => {
    console.log("Task detail view loaded with:", {
      taskId: task.id,
      workspace: { id: workspace.id, name: workspace.name },
    });

    loadSubtasks();
    loadWorkspaceMembers();
    loadTaskAssignees();
    loadTaskActivities();
  }, [task.id]);

  useEffect(() => {
    loadTaskAssignees();
  }, [task.assignee_id, task.assignee]);

  return {
    subtasks,
    setSubtasks,
    workspaceMembers,
    taskAssignees,
    setTaskAssignees,
    activities,
    loadSubtasks,
    loadWorkspaceMembers,
    loadTaskAssignees,
    loadTaskActivities,
  };
};
