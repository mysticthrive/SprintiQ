"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Inbox,
  CheckSquare,
  Plus,
  ChevronRight,
  ChevronDown,
  Hash,
  MoreHorizontal,
  Star,
  Edit,
  Copy,
  Settings,
  Trash2,
  Search,
  X,
  LayoutDashboard,
  Bookmark,
  Globe,
  FolderKanban,
  CirclePlay,
  Upload,
  MoreVertical,
  FileUp,
  Braces,
  Lock,
} from "lucide-react";
import type {
  Workspace,
  Space,
  Project,
  Status,
  Task,
  SprintFolder,
  Sprint,
} from "@/lib/database.types";
import CreateSpaceModal from "@/components/workspace/modals/create-space-modal";
import { createClientSupabaseClient } from "@/lib/supabase/client";
import CreateProjectModal from "@/components/workspace/modals/create-project-modal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
  DropdownMenuShortcut,
} from "@/components/ui/dropdown-menu";
import CreateTaskModal from "@/components/workspace/modals/create-task-modal";
import CreateSprintFolderModal from "@/components/workspace/modals/create-sprint-folder-modal";
import CreateSprintModal from "@/components/workspace/modals/create-sprint-modal";
import ExportToJiraModal from "@/components/workspace/modals/export-to-jira-modal";
import { getUnreadEventsCount } from "@/lib/events";
import { useAuth } from "@/contexts/auth-context";
import { useEnhancedToast } from "@/hooks/use-enhanced-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { getIconColor } from "@/lib/utils";
import JiraSvg from "@/components/svg/apps/JiraSvg";
import {
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { Tooltip } from "@/components/ui/tooltip";
import AzureSvg from "@/components/svg/apps/AzureSvg";

// Add helper function to detect Jira integration
const hasJiraIntegration = (
  space: Space & { projects: Project[]; sprint_folders: SprintFolder[] }
) => {
  // Check if any project in this space is Jira-integrated
  return space.projects.some((project) => project.type === "jira");
};

const isJiraProject = (project: Project) => {
  return project.type === "jira";
};

interface SecondarySidebarProps {
  workspace: Workspace;
  spaces: (Space & { projects: Project[]; sprint_folders: SprintFolder[] })[];
}

export default function SecondarySidebar({
  workspace,
  spaces: initialSpaces,
}: SecondarySidebarProps) {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const workspaceId = params.workspaceId as string;
  const [expandedSpaces, setExpandedSpaces] = useState<Set<string>>(
    new Set(["general"])
  );
  const [expandedSprintFolders, setExpandedSprintFolders] = useState<
    Set<string>
  >(new Set());
  const [createSpaceModalOpen, setCreateSpaceModalOpen] = useState(false);
  const [spaces, setSpaces] = useState(initialSpaces);
  const supabase = createClientSupabaseClient();
  const [createProjectModalOpen, setCreateProjectModalOpen] = useState(false);
  const [selectedSpaceForProject, setSelectedSpaceForProject] =
    useState<string>("");
  const [createTaskModalOpen, setCreateTaskModalOpen] = useState(false);
  const [selectedProjectForTask, setSelectedProjectForTask] = useState<{
    project: Project;
    space: Space;
  } | null>(null);
  const [createSprintFolderModalOpen, setCreateSprintFolderModalOpen] =
    useState(false);
  const [selectedSpaceForSprintFolder, setSelectedSpaceForSprintFolder] =
    useState<string>("");
  const [createSprintModalOpen, setCreateSprintModalOpen] = useState(false);
  const [selectedSprintFolderForSprint, setSelectedSprintFolderForSprint] =
    useState<{
      sprintFolder: SprintFolder;
      space: Space;
    } | null>(null);
  const [exportToJiraModalOpen, setExportToJiraModalOpen] = useState(false);
  const [selectedProjectForExport, setSelectedProjectForExport] = useState<{
    project: Project;
    space: Space;
  } | null>(null);
  const [taskCounts, setTaskCounts] = useState<Record<string, number>>({});
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [taskCountRefreshTimeout, setTaskCountRefreshTimeout] =
    useState<NodeJS.Timeout | null>(null);

  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [renameSpaceId, setRenameSpaceId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [deleteSpaceId, setDeleteSpaceId] = useState<string | null>(null);

  const [projectFavorites, setProjectFavorites] = useState<Set<string>>(
    new Set()
  );
  const [renameProjectId, setRenameProjectId] = useState<string | null>(null);
  const [deleteProjectId, setDeleteProjectId] = useState<string | null>(null);
  const [favoritesOpen, setFavoritesOpen] = useState(false);

  // Sprint Folder state
  const [sprintFolderFavorites, setSprintFolderFavorites] = useState<
    Set<string>
  >(new Set());
  const [sprintFavorites, setSprintFavorites] = useState<Set<string>>(
    new Set()
  );
  const [renameSprintFolderId, setRenameSprintFolderId] = useState<
    string | null
  >(null);
  const [deleteSprintFolderId, setDeleteSprintFolderId] = useState<
    string | null
  >(null);
  const [renameSprintId, setRenameSprintId] = useState<string | null>(null);
  const [deleteSprintId, setDeleteSprintId] = useState<string | null>(null);
  const [selectedSprintForTask, setSelectedSprintForTask] = useState<{
    sprint: Sprint;
    space: Space;
  } | null>(null);

  const { toast } = useEnhancedToast();

  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredSpaces, setFilteredSpaces] = useState(initialSpaces);
  const [isDeletingSpace, setIsDeletingSpace] = useState(false);
  const [isDeletingProject, setIsDeletingProject] = useState(false);
  const [isDeletingSprintFolder, setIsDeletingSprintFolder] = useState(false);
  const [isDeletingSprint, setIsDeletingSprint] = useState(false);

  const toggleSpace = (spaceId: string) => {
    const newExpanded = new Set(expandedSpaces);
    if (newExpanded.has(spaceId)) {
      newExpanded.delete(spaceId);
    } else {
      newExpanded.add(spaceId);
    }
    setExpandedSpaces(newExpanded);
  };

  const toggleSprintFolder = (sprintFolderId: string) => {
    const newExpanded = new Set(expandedSprintFolders);
    if (newExpanded.has(sprintFolderId)) {
      newExpanded.delete(sprintFolderId);
    } else {
      newExpanded.add(sprintFolderId);
    }
    setExpandedSprintFolders(newExpanded);
  };

  // Fetch statuses for the workspace
  const fetchStatuses = useCallback(async () => {
    try {
      const { data: statusesData, error } = await supabase
        .from("statuses")
        .select("*")
        .eq("workspace_id", workspace.id)
        .order("position", { ascending: true });

      if (error) {
        console.error("Error fetching statuses:", error);
        return;
      }

      if (statusesData) {
        setStatuses(statusesData);
      }
    } catch (error) {
      console.error("Error fetching statuses:", error);
    }
  }, [supabase, workspace.id]);

  const fetchTaskCounts = useCallback(async () => {
    try {
      const projectIds = spaces.flatMap((space) =>
        (space.projects || []).map((p) => p.id)
      );
      const sprintIds = spaces.flatMap((space) =>
        (space.sprint_folders || []).flatMap((sf) =>
          (sf.sprints || []).map((s) => s.id)
        )
      );

      if (projectIds.length === 0 && sprintIds.length === 0) {
        setTaskCounts({});
        return;
      }

      // Build the filter condition
      let filterCondition = "";
      if (projectIds.length > 0 && sprintIds.length > 0) {
        filterCondition = `or(project_id.in.(${projectIds.join(
          ","
        )}),sprint_id.in.(${sprintIds.join(",")}))`;
      } else if (projectIds.length > 0) {
        filterCondition = `project_id.in.(${projectIds.join(",")})`;
      } else if (sprintIds.length > 0) {
        filterCondition = `sprint_id.in.(${sprintIds.join(",")})`;
      }

      const { data: tasks, error } = await supabase
        .from("tasks")
        .select("project_id, sprint_id")
        .or(filterCondition);

      if (error) {
        console.error("Error fetching task counts:", error);
        return;
      }

      if (tasks) {
        const counts = tasks.reduce((acc, task) => {
          if (task.project_id) {
            acc[task.project_id] = (acc[task.project_id] || 0) + 1;
          }
          if (task.sprint_id) {
            acc[task.sprint_id] = (acc[task.sprint_id] || 0) + 1;
          }
          return acc;
        }, {} as Record<string, number>);
        setTaskCounts(counts);
      }
    } catch (error) {
      console.error("Error fetching task counts:", error);
    }
  }, [supabase, spaces]);

  // Debounced task count refresh
  const debouncedFetchTaskCounts = useCallback(() => {
    if (taskCountRefreshTimeout) {
      clearTimeout(taskCountRefreshTimeout);
    }

    const timeout = setTimeout(() => {
      fetchTaskCounts();
    }, 300); // 300ms debounce

    setTaskCountRefreshTimeout(timeout);
  }, [fetchTaskCounts, taskCountRefreshTimeout]);

  // Initial data fetch
  useEffect(() => {
    fetchStatuses();
    fetchTaskCounts();
  }, [fetchStatuses, fetchTaskCounts]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (taskCountRefreshTimeout) {
        clearTimeout(taskCountRefreshTimeout);
      }
    };
  }, [taskCountRefreshTimeout]);

  // Set up real-time subscriptions for task changes
  useEffect(() => {
    const projectIds = spaces.flatMap((space) =>
      (space.projects || []).map((p) => p.id)
    );
    const sprintIds = spaces.flatMap((space) =>
      (space.sprint_folders || []).flatMap((sf) =>
        (sf.sprints || []).map((s) => s.id)
      )
    );

    if (projectIds.length === 0 && sprintIds.length === 0) return;

    // Subscribe to task changes
    const tasksSubscription = supabase
      .channel("tasks_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tasks",
          filter: `or(project_id.in.(${projectIds.join(
            ","
          )}),sprint_id.in.(${sprintIds.join(",")}))`,
        },
        () => {
          // Refresh task counts when tasks change (debounced)
          debouncedFetchTaskCounts();
        }
      )
      .subscribe();

    return () => {
      tasksSubscription.unsubscribe();
    };
  }, [spaces, supabase, fetchTaskCounts]);

  const fetchUnreadCount = useCallback(async () => {
    if (!user) return;
    const count = await getUnreadEventsCount(user.id, workspace.id);
    setUnreadCount(count);
  }, [user, workspace.id]);

  useEffect(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  // Set up real-time subscription for events changes
  useEffect(() => {
    if (!user?.id || !workspace?.id) return;

    // Subscribe to events changes
    const eventsSubscription = supabase
      .channel("events_changes_sidebar")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "events",
          filter: `and(workspace_id=eq.${workspace.id},user_id=eq.${user.id})`,
        },
        () => {
          // Refresh unread count when events change
          fetchUnreadCount();
        }
      )
      .subscribe();

    return () => {
      eventsSubscription.unsubscribe();
    };
  }, [user?.id, workspace?.id, supabase, fetchUnreadCount]);

  // Add effect to manage expanded spaces based on current route
  useEffect(() => {
    // Extract space_id from current pathname
    const spaceMatch = pathname.match(/\/space\/([^\/]+)/);
    if (spaceMatch) {
      const currentSpaceId = spaceMatch[1];

      // Find the space object to get its internal ID
      const currentSpace = spaces.find(
        (space) => space.space_id === currentSpaceId
      );

      if (currentSpace) {
        setExpandedSpaces((prev) => {
          const newExpanded = new Set(prev);
          newExpanded.add(currentSpaceId);
          return newExpanded;
        });
      }
    }
  }, [pathname, spaces]);

  const refreshSpaces = useCallback(async () => {
    try {
      console.log("Refreshing spaces...");
      // Fetch updated spaces with their projects and sprint folders
      const { data: spacesData, error: spacesError } = await supabase
        .from("spaces")
        .select(
          `
        *,
        projects (*),
        sprint_folders (
          *,
          sprints (*)
        )
      `
        )
        .eq("workspace_id", workspace.id)
        .order("created_at", { ascending: true });

      if (spacesError) {
        console.error("Error fetching spaces:", spacesError);
        return;
      }

      if (spacesData) {
        setSpaces(spacesData);
        const spaceMatch = pathname.match(/\/space\/([^\/]+)/);
        if (spaceMatch) {
          const currentSpaceId = spaceMatch[1];
          setExpandedSpaces((prev) => {
            const newExpanded = new Set(prev);
            newExpanded.add(currentSpaceId);
            return newExpanded;
          });
        }
      }
    } catch (error) {
      console.error("Error refreshing spaces:", error);
    }
  }, [supabase, workspace.id, pathname]);

  // Add comprehensive real-time subscriptions for all entities
  useEffect(() => {
    if (!workspace?.id) return;

    // Subscribe to spaces changes
    const spacesSubscription = supabase
      .channel("spaces_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "spaces",
          filter: `workspace_id=eq.${workspace.id}`,
        },
        () => {
          // Refresh spaces when spaces change
          refreshSpaces();
        }
      )
      .subscribe();

    // Subscribe to projects changes
    const projectsSubscription = supabase
      .channel("projects_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "projects",
          filter: `workspace_id=eq.${workspace.id}`,
        },
        () => {
          // Refresh spaces (which includes projects) when projects change
          refreshSpaces();
          // Also refresh task counts (debounced)
          debouncedFetchTaskCounts();
        }
      )
      .subscribe();

    // Subscribe to sprint folders changes
    const sprintFoldersSubscription = supabase
      .channel("sprint_folders_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "sprint_folders",
          filter: `workspace_id=eq.${workspace.id}`,
        },
        () => {
          // Refresh spaces (which includes sprint folders) when sprint folders change
          refreshSpaces();
        }
      )
      .subscribe();

    // Subscribe to sprints changes
    const sprintsSubscription = supabase
      .channel("sprints_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "sprints",
          filter: `workspace_id=eq.${workspace.id}`,
        },
        () => {
          // Refresh spaces (which includes sprints) when sprints change
          refreshSpaces();
          // Also refresh task counts (debounced)
          debouncedFetchTaskCounts();
        }
      )
      .subscribe();

    // Subscribe to statuses changes
    const statusesSubscription = supabase
      .channel("statuses_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "statuses",
          filter: `workspace_id=eq.${workspace.id}`,
        },
        () => {
          // Refresh statuses when they change
          fetchStatuses();
        }
      )
      .subscribe();

    return () => {
      spacesSubscription.unsubscribe();
      projectsSubscription.unsubscribe();
      sprintFoldersSubscription.unsubscribe();
      sprintsSubscription.unsubscribe();
      statusesSubscription.unsubscribe();
    };
  }, [
    workspace?.id,
    supabase,
    refreshSpaces,
    debouncedFetchTaskCounts,
    fetchStatuses,
  ]);

  // Listen for custom events from other components
  useEffect(() => {
    const handleTaskCreated = (event: CustomEvent) => {
      console.log("Task created event received in sidebar:", event.detail);
      // Refresh task counts when a task is created from other components (debounced)
      debouncedFetchTaskCounts();
    };

    const handleProjectCreated = (event: CustomEvent) => {
      console.log("Project created event received in sidebar:", event.detail);
      // Refresh spaces when a project is created from other components
      refreshSpaces();
    };

    const handleSpaceCreated = (event: CustomEvent) => {
      console.log("Space created event received in sidebar:", event.detail);
      // Refresh spaces when a space is created from other components
      refreshSpaces();
    };

    const handleSprintCreated = (event: CustomEvent) => {
      console.log("Sprint created event received in sidebar:", event.detail);
      // Refresh spaces when a sprint is created from other components
      refreshSpaces();
    };

    const handleEventMarkedAsRead = (event: CustomEvent) => {
      console.log("Event marked as read received in sidebar:", event.detail);
      // Refresh unread count when an event is marked as read
      fetchUnreadCount();
    };

    const handleAllEventsMarkedAsRead = (event: CustomEvent) => {
      console.log(
        "All events marked as read received in sidebar:",
        event.detail
      );
      // Refresh unread count when all events are marked as read
      fetchUnreadCount();
    };

    const handleProjectRenamed = (event: CustomEvent) => {
      console.log("Project renamed event received in sidebar:", event.detail);
      // Refresh spaces when a project is renamed
      refreshSpaces();
    };

    const handleProjectDeleted = (event: CustomEvent) => {
      console.log("Project deleted event received in sidebar:", event.detail);
      // Refresh spaces when a project is deleted
      refreshSpaces();
    };

    const handleProjectFavorited = (event: CustomEvent) => {
      console.log("Project favorited event received in sidebar:", event.detail);
      // Refresh project favorites in sidebar
      const savedFavorites = localStorage.getItem(
        `project_favorites_${workspace.id}`
      );
      if (savedFavorites) {
        try {
          const favorites = JSON.parse(savedFavorites);
          setProjectFavorites(new Set(favorites));
        } catch (error) {
          console.error("Error loading project favorites:", error);
        }
      }
    };

    // Add event listeners
    window.addEventListener("taskCreated", handleTaskCreated as EventListener);
    window.addEventListener(
      "projectCreated",
      handleProjectCreated as EventListener
    );
    window.addEventListener(
      "spaceCreated",
      handleSpaceCreated as EventListener
    );
    window.addEventListener(
      "sprintCreated",
      handleSprintCreated as EventListener
    );
    window.addEventListener(
      "eventMarkedAsRead",
      handleEventMarkedAsRead as EventListener
    );
    window.addEventListener(
      "allEventsMarkedAsRead",
      handleAllEventsMarkedAsRead as EventListener
    );
    window.addEventListener(
      "projectRenamed",
      handleProjectRenamed as EventListener
    );
    window.addEventListener(
      "projectDeleted",
      handleProjectDeleted as EventListener
    );
    window.addEventListener(
      "projectFavorited",
      handleProjectFavorited as EventListener
    );

    return () => {
      // Remove event listeners
      window.removeEventListener(
        "taskCreated",
        handleTaskCreated as EventListener
      );
      window.removeEventListener(
        "projectCreated",
        handleProjectCreated as EventListener
      );
      window.removeEventListener(
        "spaceCreated",
        handleSpaceCreated as EventListener
      );
      window.removeEventListener(
        "sprintCreated",
        handleSprintCreated as EventListener
      );
      window.removeEventListener(
        "eventMarkedAsRead",
        handleEventMarkedAsRead as EventListener
      );
      window.removeEventListener(
        "allEventsMarkedAsRead",
        handleAllEventsMarkedAsRead as EventListener
      );
      window.removeEventListener(
        "projectRenamed",
        handleProjectRenamed as EventListener
      );
      window.removeEventListener(
        "projectDeleted",
        handleProjectDeleted as EventListener
      );
      window.removeEventListener(
        "projectFavorited",
        handleProjectFavorited as EventListener
      );
    };
  }, [debouncedFetchTaskCounts, refreshSpaces, fetchUnreadCount, workspace.id]);

  const handleProjectCreated = useCallback(
    async (newProject: Project) => {
      await refreshSpaces();

      setTimeout(() => {
        fetchTaskCounts();
        fetchStatuses();
      }, 100);

      if (newProject.space_id) {
        const space = spaces.find((s) => s.id === newProject.space_id);
        if (space) {
          setExpandedSpaces((prev) => new Set([...prev, space.space_id]));
        }
      }
    },
    [refreshSpaces, fetchTaskCounts, fetchStatuses, spaces]
  );

  const handleSpaceCreated = useCallback(
    async (
      newSpace: Space & { projects: Project[]; sprint_folders: SprintFolder[] }
    ) => {
      const spaceWithDefaults = {
        ...newSpace,
        projects: newSpace.projects || [],
        sprint_folders: newSpace.sprint_folders || [],
      };

      setSpaces((prev) => [...prev, spaceWithDefaults]);

      setExpandedSpaces((prev) => new Set([...prev, newSpace.space_id]));

      if (spaceWithDefaults.projects && spaceWithDefaults.projects.length > 0) {
        const firstProject = spaceWithDefaults.projects[0];
        router.push(
          `/${workspaceId}/space/${newSpace.space_id}/project/${firstProject.project_id}`
        );
      }
    },
    [workspaceId, router]
  );

  const handleTaskCreated = useCallback(
    async (task: Task) => {
      console.log("Task created in sidebar:", task);
      await fetchTaskCounts();
    },
    [fetchTaskCounts]
  );

  const handleSprintFolderCreated = useCallback(
    async (newSprintFolder: SprintFolder) => {
      console.log("Sprint folder created:", newSprintFolder);

      // Immediately refresh spaces to update the sidebar
      await refreshSpaces();

      // Refresh task counts and statuses after spaces are updated
      setTimeout(() => {
        fetchTaskCounts();
        fetchStatuses();
      }, 100);

      // Make sure the space containing the new sprint folder is expanded
      if (newSprintFolder.space_id) {
        const space = spaces.find((s) => s.id === newSprintFolder.space_id);
        if (space) {
          setExpandedSpaces((prev) => new Set([...prev, space.space_id]));
        }
      }
    },
    [refreshSpaces, fetchTaskCounts, fetchStatuses, spaces]
  );

  const handleSprintCreated = useCallback(
    async (newSprint: Sprint) => {
      console.log("Sprint created:", newSprint);

      // Immediately refresh spaces to update the sidebar
      await refreshSpaces();

      // Refresh task counts and statuses after spaces are updated
      setTimeout(() => {
        fetchTaskCounts();
        fetchStatuses();
      }, 100);

      // Make sure the space containing the new sprint is expanded
      if (newSprint.space_id) {
        const space = spaces.find((s) => s.id === newSprint.space_id);
        if (space) {
          setExpandedSpaces((prev) => new Set([...prev, space.space_id]));
        }
      }
    },
    [refreshSpaces, fetchTaskCounts, fetchStatuses, spaces]
  );

  const getStatusesForEntity = useCallback(
    (entity: Project | Sprint, space: Space) => {
      if (!statuses.length) return [];

      return statuses.filter((status) => {
        if (status.type === "space" && status.space_id === space.id) {
          return true;
        }
        if (status.type === "project" && status.project_id === entity.id) {
          return true;
        }
        if (status.type === "sprint" && status.sprint_id === entity.id) {
          return true;
        }
        return false;
      });
    },
    [statuses]
  );

  const handleAddToFavorites = useCallback(
    async (space: Space) => {
      try {
        const newFavorites = new Set(favorites);
        if (favorites.has(space.id)) {
          newFavorites.delete(space.id);
        } else {
          newFavorites.add(space.id);
        }
        setFavorites(newFavorites);

        // Store in localStorage
        localStorage.setItem(
          `favorites_${workspace.id}`,
          JSON.stringify([...newFavorites])
        );

        toast({
          title: favorites.has(space.id)
            ? "Removed from favorites"
            : "Added to favorites",
          description: `${space.name} ${
            favorites.has(space.id) ? "removed from" : "added to"
          } favorites.`,
        });
      } catch (error) {
        console.error("Error updating favorites:", error);
      }
    },
    [favorites, workspace.id, toast]
  );

  const handleRenameSpace = useCallback(
    async (spaceId: string, newName: string) => {
      if (!newName.trim()) return;

      try {
        // Find the space object using the spaceId
        const space = spaces.find((s) => s.id === spaceId);
        if (!space) return;

        // Use space_id for the database query
        const { error } = await supabase
          .from("spaces")
          .update({ name: newName.trim() })
          .eq("space_id", space.space_id);

        if (error) throw error;

        // Update local state
        setSpaces((prev) =>
          prev.map((s) =>
            s.id === spaceId ? { ...s, name: newName.trim() } : s
          )
        );

        toast({
          title: "Space renamed",
          description: `Space renamed to "${newName.trim()}".`,
        });

        setRenameSpaceId(null);
        setRenameValue("");
      } catch (error: any) {
        console.error("Error renaming space:", error);
        toast({
          title: "Error renaming space",
          description: error.message || "Something went wrong",
          variant: "destructive",
        });
      }
    },
    [supabase, toast, spaces]
  );

  const handleCopyLink = useCallback(
    async (space: Space) => {
      try {
        const url = `${window.location.origin}/${workspaceId}/space/${space.space_id}`;
        await navigator.clipboard.writeText(url);

        toast({
          title: "Link copied",
          description: "Space link copied to clipboard.",
        });
      } catch (error) {
        console.error("Error copying link:", error);
        toast({
          title: "Error copying link",
          description: "Failed to copy link to clipboard.",
          variant: "destructive",
        });
      }
    },
    [workspaceId, toast]
  );

  const handleDeleteSpace = useCallback(
    async (spaceId: string) => {
      setIsDeletingSpace(true);
      try {
        const space = spaces.find((s) => s.id === spaceId);
        if (!space) return;

        console.log("Attempting to delete space:", {
          spaceId,
          spaceUuid: space.id,
          spaceIdString: space.space_id,
        });

        // Check Supabase client configuration
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        // Test a simple select to see if we have proper access
        const { data: testData, error: testError } = await supabase
          .from("tasks")
          .select("count")
          .limit(1);

        // First, check what tasks exist
        const { data: tasksBefore, error: checkError } = await supabase
          .from("tasks")
          .select("id, name, space_id")
          .eq("space_id", space.id);

        // Now try to delete with count
        const {
          data: deleteResult,
          error: tasksError,
          count,
        } = await supabase
          .from("tasks")
          .delete({ count: "exact" })
          .eq("space_id", space.id);

        if (tasksError) {
          console.error("Error deleting tasks:", tasksError);
          throw tasksError;
        }

        // Check what tasks remain after deletion
        const { data: tasksAfter, error: afterError } = await supabase
          .from("tasks")
          .select("id, name, space_id")
          .eq("space_id", space.id);

        if (tasksAfter && tasksAfter.length > 0) {
          console.warn("WARNING: Tasks still exist after deletion attempt!");
        }

        const projectsInSpace = space.projects || [];
        const sprintsInSpace = space.sprint_folders.flatMap(
          (sf) => sf.sprints || []
        );

        // Get all status IDs that will be deleted
        const statusIdsToDelete: string[] = [];

        // Get space statuses
        const { data: spaceStatuses } = await supabase
          .from("statuses")
          .select("id")
          .eq("space_id", space.id);

        if (spaceStatuses) {
          statusIdsToDelete.push(...spaceStatuses.map((s) => s.id));
        }

        // Get project statuses
        if (projectsInSpace.length > 0) {
          const projectIds = projectsInSpace.map((p) => p.id);
          const { data: projectStatuses } = await supabase
            .from("statuses")
            .select("id")
            .in("project_id", projectIds);

          if (projectStatuses) {
            statusIdsToDelete.push(...projectStatuses.map((s) => s.id));
          }
        }

        // Get sprint statuses
        if (sprintsInSpace.length > 0) {
          const sprintIds = sprintsInSpace.map((s) => s.id);
          const { data: sprintStatuses } = await supabase
            .from("statuses")
            .select("id")
            .in("sprint_id", sprintIds);

          if (sprintStatuses) {
            statusIdsToDelete.push(...sprintStatuses.map((s) => s.id));
          }
        }

        if (statusIdsToDelete.length > 0) {
          // First, let's check what tasks are referencing these statuses
          const { data: tasksWithStatuses, error: checkError } = await supabase
            .from("tasks")
            .select("id, name, status_id, space_id")
            .in("status_id", statusIdsToDelete);

          if (checkError) {
            console.error(
              "Error checking tasks with status references:",
              checkError
            );
            throw checkError;
          }

          if (tasksWithStatuses && tasksWithStatuses.length > 0) {
            console.log(
              "Task details:",
              tasksWithStatuses.map((t) => ({
                id: t.id,
                name: t.name,
                status_id: t.status_id,
                space_id: t.space_id,
              }))
            );
          }

          // Now delete these tasks
          const { error: statusTasksError } = await supabase
            .from("tasks")
            .delete()
            .in("status_id", statusIdsToDelete);

          if (statusTasksError) {
            console.error(
              "Error deleting tasks with status references:",
              statusTasksError
            );
            throw statusTasksError;
          }
        }

        // Get all status IDs from this space (space, project, and sprint statuses)
        const allStatusIdsFromSpace: string[] = [];

        // Add space statuses
        if (spaceStatuses) {
          allStatusIdsFromSpace.push(...spaceStatuses.map((s) => s.id));
        }

        // Add project statuses
        if (projectsInSpace.length > 0) {
          const projectIds = projectsInSpace.map((p) => p.id);
          const { data: projectStatuses } = await supabase
            .from("statuses")
            .select("id")
            .in("project_id", projectIds);

          if (projectStatuses) {
            allStatusIdsFromSpace.push(...projectStatuses.map((s) => s.id));
          }
        }

        // Add sprint statuses
        if (sprintsInSpace.length > 0) {
          const sprintIds = sprintsInSpace.map((s) => s.id);
          const { data: sprintStatuses } = await supabase
            .from("statuses")
            .select("id")
            .in("sprint_id", sprintIds);

          if (sprintStatuses) {
            allStatusIdsFromSpace.push(...sprintStatuses.map((s) => s.id));
          }
        }

        // Remove duplicates
        const uniqueStatusIds = [...new Set(allStatusIdsFromSpace)];

        // Delete ALL tasks that reference ANY of these statuses
        if (uniqueStatusIds.length > 0) {
          const { data: allTasksWithStatuses, error: checkAllError } =
            await supabase
              .from("tasks")
              .select("id, name, status_id, space_id")
              .in("status_id", uniqueStatusIds);

          if (checkAllError) {
            console.error(
              "Error checking all tasks with status references:",
              checkAllError
            );
            throw checkAllError;
          }

          if (allTasksWithStatuses && allTasksWithStatuses.length > 0) {
            const taskIdsToDelete = allTasksWithStatuses.map((t) => t.id);
            const { error: deleteAllTasksError } = await supabase
              .from("tasks")
              .delete()
              .in("id", taskIdsToDelete);

            if (deleteAllTasksError) {
              console.error(
                "Error deleting all tasks with status references:",
                deleteAllTasksError
              );
              throw deleteAllTasksError;
            }
          }
        }

        // Check statuses before deletion
        const { data: statusesBefore, error: statusCheckError } = await supabase
          .from("statuses")
          .select("id, name, space_id")
          .eq("space_id", space.id);

        const {
          data: statusDeleteResult,
          error: spaceStatusesError,
          count: statusCount,
        } = await supabase
          .from("statuses")
          .delete({ count: "exact" })
          .eq("space_id", space.id);

        if (spaceStatusesError) {
          console.error("Error deleting space statuses:", spaceStatusesError);
          throw spaceStatusesError;
        }

        // Check statuses after deletion
        const { data: statusesAfter, error: statusAfterError } = await supabase
          .from("statuses")
          .select("id, name, space_id")
          .eq("space_id", space.id);

        if (statusesAfter && statusesAfter.length > 0) {
          console.warn("WARNING: Statuses still exist after deletion attempt!");
        }

        if (projectsInSpace.length > 0) {
          const projectIds = projectsInSpace.map((p) => p.id);
          const { error: projectStatusesError } = await supabase
            .from("statuses")
            .delete()
            .in("project_id", projectIds);

          if (projectStatusesError) {
            console.error(
              "Error deleting project statuses:",
              projectStatusesError
            );
            throw projectStatusesError;
          }
        }

        if (sprintsInSpace.length > 0) {
          const sprintIds = sprintsInSpace.map((s) => s.id);
          const { error: sprintStatusesError } = await supabase
            .from("statuses")
            .delete()
            .in("sprint_id", sprintIds);

          if (sprintStatusesError) {
            console.error(
              "Error deleting sprint statuses:",
              sprintStatusesError
            );
            throw sprintStatusesError;
          }
        }

        const { error: projectsError } = await supabase
          .from("projects")
          .delete()
          .eq("space_id", space.id);

        if (projectsError) {
          console.error("Error deleting projects:", projectsError);
          throw projectsError;
        }

        const { error: sprintsError } = await supabase
          .from("sprints")
          .delete()
          .eq("space_id", space.id);

        if (sprintsError) {
          console.error("Error deleting sprints:", sprintsError);
          throw sprintsError;
        }

        const { error: sprintFoldersError } = await supabase
          .from("sprint_folders")
          .delete()
          .eq("space_id", space.id);

        if (sprintFoldersError) {
          console.error("Error deleting sprint folders:", sprintFoldersError);
          throw sprintFoldersError;
        }

        const { error: spaceError } = await supabase
          .from("spaces")
          .delete()
          .eq("id", space.id);

        if (spaceError) {
          console.error("Error deleting space:", spaceError);
          throw spaceError;
        }

        // Update local state
        setSpaces((prev) => prev.filter((s) => s.id !== spaceId));

        // Remove from favorites
        setFavorites((prev) => {
          const newFavorites = new Set(prev);
          newFavorites.delete(spaceId);
          localStorage.setItem(
            `favorites_${workspace.id}`,
            JSON.stringify([...newFavorites])
          );
          return newFavorites;
        });

        toast({
          title: "Space deleted",
          description: "Space and all its related data have been deleted.",
        });

        setDeleteSpaceId(null);

        // Navigate to home if we're currently in the deleted space
        if (pathname.includes(`/space/${space.space_id}`)) {
          router.push(`/${workspaceId}/home`);
        }
      } catch (error: any) {
        toast({
          title: "Error deleting space",
          description: error.message || "Something went wrong",
          variant: "destructive",
        });
      } finally {
        setIsDeletingSpace(false);
      }
    },
    [supabase, toast, pathname, router, workspaceId, workspace.id, spaces]
  );

  // Sprint handlers
  const handleAddSprintToFavorites = useCallback(
    async (sprint: Sprint) => {
      try {
        const newFavorites = new Set(sprintFavorites);
        if (sprintFavorites.has(sprint.id)) {
          newFavorites.delete(sprint.id);
        } else {
          newFavorites.add(sprint.id);
        }
        setSprintFavorites(newFavorites);

        // Store in localStorage
        localStorage.setItem(
          `sprint_favorites_${workspace.id}`,
          JSON.stringify([...newFavorites])
        );

        toast({
          title: sprintFavorites.has(sprint.id)
            ? "Removed from favorites"
            : "Added to favorites",
          description: `${sprint.name} ${
            sprintFavorites.has(sprint.id) ? "removed from" : "added to"
          } favorites.`,
        });
      } catch (error) {
        console.error("Error updating sprint favorites:", error);
      }
    },
    [sprintFavorites, workspace.id, toast]
  );

  const handleRenameSprint = useCallback(
    async (sprintId: string, newName: string) => {
      if (!newName.trim()) return;

      try {
        // Find the sprint object
        let foundSprint: Sprint | null = null;

        for (const space of spaces) {
          for (const sprintFolder of space.sprint_folders) {
            const sprint = sprintFolder.sprints.find((s) => s.id === sprintId);
            if (sprint) {
              foundSprint = sprint;
              break;
            }
          }
          if (foundSprint) break;
        }

        if (!foundSprint) return;

        // Use sprint_id for the database query
        const { error } = await supabase
          .from("sprints")
          .update({ name: newName.trim() })
          .eq("sprint_id", foundSprint.sprint_id);

        if (error) throw error;

        // Update local state
        setSpaces((prev) =>
          prev.map((space) => ({
            ...space,
            sprint_folders: space.sprint_folders.map((sprintFolder) => ({
              ...sprintFolder,
              sprints: sprintFolder.sprints.map((sprint) =>
                sprint.id === sprintId
                  ? { ...sprint, name: newName.trim() }
                  : sprint
              ),
            })),
          }))
        );

        toast({
          title: "Sprint renamed",
          description: `Sprint renamed to "${newName.trim()}".`,
        });

        setRenameSprintId(null);
        setRenameValue("");
      } catch (error: any) {
        console.error("Error renaming sprint:", error);
        toast({
          title: "Error renaming sprint",
          description: error.message || "Something went wrong",
          variant: "destructive",
        });
      }
    },
    [supabase, toast, spaces]
  );

  const handleCopySprintLink = useCallback(
    async (sprint: Sprint, space: Space, sprintFolder: SprintFolder) => {
      try {
        const url = `${window.location.origin}/${workspaceId}/space/${space.space_id}/sf/${sprintFolder.sprint_folder_id}/s/${sprint.sprint_id}`;
        await navigator.clipboard.writeText(url);

        toast({
          title: "Link copied",
          description: "Sprint link copied to clipboard.",
        });
      } catch (error) {
        console.error("Error copying link:", error);
        toast({
          title: "Error copying link",
          description: "Failed to copy link to clipboard.",
          variant: "destructive",
        });
      }
    },
    [workspaceId, toast]
  );

  const handleDeleteSprint = useCallback(
    async (sprintId: string) => {
      setIsDeletingSprint(true);
      try {
        // Find the sprint object
        let foundSprint: Sprint | null = null;
        let foundSpace: Space | null = null;
        let foundSprintFolder: SprintFolder | null = null;

        for (const space of spaces) {
          for (const sprintFolder of space.sprint_folders) {
            const sprint = sprintFolder.sprints.find((s) => s.id === sprintId);
            if (sprint) {
              foundSprint = sprint;
              foundSpace = space;
              foundSprintFolder = sprintFolder;
              break;
            }
          }
          if (foundSprint) break;
        }

        if (!foundSprint) return;

        console.log("Attempting to delete sprint:", {
          sprintId,
          sprintUuid: foundSprint.id,
          sprintIdString: foundSprint.sprint_id,
        });

        // 1. Delete all tasks for this sprint
        const { error: tasksError } = await supabase
          .from("tasks")
          .delete()
          .eq("sprint_id", foundSprint.id);

        if (tasksError) {
          console.error("Error deleting sprint tasks:", tasksError);
          throw tasksError;
        }

        // 2. Delete all statuses for this sprint
        const { error: statusesError } = await supabase
          .from("statuses")
          .delete()
          .eq("sprint_id", foundSprint.id);

        if (statusesError) {
          console.error("Error deleting sprint statuses:", statusesError);
          throw statusesError;
        }

        // 3. Delete the sprint itself
        const { error: sprintError } = await supabase
          .from("sprints")
          .delete()
          .eq("id", foundSprint.id);

        if (sprintError) {
          console.error("Error deleting sprint:", sprintError);
          throw sprintError;
        }

        // Update local state
        setSpaces((prev) =>
          prev.map((space) => ({
            ...space,
            sprint_folders: space.sprint_folders.map((sprintFolder) => ({
              ...sprintFolder,
              sprints: sprintFolder.sprints.filter(
                (sprint) => sprint.id !== sprintId
              ),
            })),
          }))
        );

        // Remove from favorites if it was favorited
        setSprintFavorites((prev) => {
          const newFavorites = new Set(prev);
          newFavorites.delete(sprintId);
          localStorage.setItem(
            `sprint_favorites_${workspace.id}`,
            JSON.stringify([...newFavorites])
          );
          return newFavorites;
        });

        toast({
          title: "Sprint deleted",
          description: "Sprint and all its related data have been deleted.",
        });

        setDeleteSprintId(null);

        // Navigate to home if we're currently in the deleted sprint
        if (
          foundSpace &&
          foundSprintFolder &&
          pathname.includes(`/s/${foundSprint.sprint_id}`)
        ) {
          router.push(`/${workspaceId}/home`);
        }
      } catch (error: any) {
        console.error("Error deleting sprint:", error);
        toast({
          title: "Error deleting sprint",
          description: error.message || "Something went wrong",
          variant: "destructive",
        });
      } finally {
        setIsDeletingSprint(false);
      }
    },
    [supabase, toast, pathname, router, workspaceId, workspace.id, spaces]
  );

  // Load project favorites from localStorage
  useEffect(() => {
    const savedProjectFavorites = localStorage.getItem(
      `project_favorites_${workspace.id}`
    );
    if (savedProjectFavorites) {
      try {
        const favoriteIds = JSON.parse(savedProjectFavorites);
        setProjectFavorites(new Set(favoriteIds));
      } catch (error) {
        console.error("Error loading project favorites:", error);
      }
    }
  }, [workspace.id]);

  // Load sprint folder favorites from localStorage
  useEffect(() => {
    const savedSprintFolderFavorites = localStorage.getItem(
      `sprint_folder_favorites_${workspace.id}`
    );
    if (savedSprintFolderFavorites) {
      try {
        const favoriteIds = JSON.parse(savedSprintFolderFavorites);
        setSprintFolderFavorites(new Set(favoriteIds));
      } catch (error) {
        console.error("Error loading sprint folder favorites:", error);
      }
    }
  }, [workspace.id]);

  // Load sprint favorites from localStorage
  useEffect(() => {
    const savedSprintFavorites = localStorage.getItem(
      `sprint_favorites_${workspace.id}`
    );
    if (savedSprintFavorites) {
      try {
        const favoriteIds = JSON.parse(savedSprintFavorites);
        setSprintFavorites(new Set(favoriteIds));
      } catch (error) {
        console.error("Error loading sprint favorites:", error);
      }
    }
  }, [workspace.id]);

  // Add search filter effect
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredSpaces(spaces);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = spaces
      .map((space) => ({
        ...space,
        projects: space.projects.filter((project) =>
          project.name.toLowerCase().includes(query)
        ),
        // Keep sprint folders and sprints as they are (don't filter them)
        sprint_folders: space.sprint_folders,
      }))
      .filter(
        (space) =>
          space.name.toLowerCase().includes(query) ||
          space.projects.length > 0 ||
          space.sprint_folders.length > 0
      );

    setFilteredSpaces(filtered);
  }, [searchQuery, spaces]);

  const quickLinks = [
    {
      name: "Inbox",
      href: `/${workspaceId}/inbox`,
      icon: Inbox,
      count: unreadCount,
    },
    {
      name: "My Tasks",
      href: `/${workspaceId}/my-tasks`,
      icon: CheckSquare,
      count: 0,
    },
  ];

  const shouldShowSidebar =
    pathname === `/${workspaceId}/inbox` ||
    pathname === `/${workspaceId}/home` ||
    pathname === `/${workspaceId}/my-tasks` ||
    pathname.startsWith(`/${workspaceId}/space`);

  // Sprint Folder handlers
  const handleAddSprintFolderToFavorites = useCallback(
    async (sprintFolder: SprintFolder) => {
      try {
        const newFavorites = new Set(sprintFolderFavorites);
        if (sprintFolderFavorites.has(sprintFolder.id)) {
          newFavorites.delete(sprintFolder.id);
        } else {
          newFavorites.add(sprintFolder.id);
        }
        setSprintFolderFavorites(newFavorites);

        // Store in localStorage
        localStorage.setItem(
          `sprint_folder_favorites_${workspace.id}`,
          JSON.stringify([...newFavorites])
        );

        toast({
          title: sprintFolderFavorites.has(sprintFolder.id)
            ? "Removed from favorites"
            : "Added to favorites",
          description: `${sprintFolder.name} ${
            sprintFolderFavorites.has(sprintFolder.id)
              ? "removed from"
              : "added to"
          } favorites.`,
        });
      } catch (error) {
        console.error("Error updating sprint folder favorites:", error);
      }
    },
    [sprintFolderFavorites, workspace.id, toast]
  );

  const handleRenameSprintFolder = useCallback(
    async (sprintFolderId: string, newName: string) => {
      if (!newName.trim()) return;

      try {
        // Find the sprint folder object
        let foundSprintFolder: SprintFolder | null = null;

        for (const space of spaces) {
          const sprintFolder = space.sprint_folders.find(
            (sf) => sf.id === sprintFolderId
          );
          if (sprintFolder) {
            foundSprintFolder = sprintFolder;
            break;
          }
        }

        if (!foundSprintFolder) return;

        // Use sprint_folder_id for the database query
        const { error } = await supabase
          .from("sprint_folders")
          .update({ name: newName.trim() })
          .eq("sprint_folder_id", foundSprintFolder.sprint_folder_id);

        if (error) throw error;

        // Update local state
        setSpaces((prev) =>
          prev.map((space) => ({
            ...space,
            sprint_folders: space.sprint_folders.map((sprintFolder) =>
              sprintFolder.id === sprintFolderId
                ? { ...sprintFolder, name: newName.trim() }
                : sprintFolder
            ),
          }))
        );

        toast({
          title: "Sprint folder renamed",
          description: `Sprint folder renamed to "${newName.trim()}".`,
        });

        setRenameSprintFolderId(null);
        setRenameValue("");
      } catch (error: any) {
        console.error("Error renaming sprint folder:", error);
        toast({
          title: "Error renaming sprint folder",
          description: error.message || "Something went wrong",
          variant: "destructive",
        });
      }
    },
    [supabase, toast, spaces]
  );

  const handleCopySprintFolderLink = useCallback(
    async (sprintFolder: SprintFolder, space: Space) => {
      try {
        const url = `${window.location.origin}/${workspaceId}/space/${space.space_id}/sf/${sprintFolder.sprint_folder_id}`;
        await navigator.clipboard.writeText(url);

        toast({
          title: "Link copied",
          description: "Sprint folder link copied to clipboard.",
        });
      } catch (error) {
        console.error("Error copying link:", error);
        toast({
          title: "Error copying link",
          description: "Failed to copy link to clipboard.",
          variant: "destructive",
        });
      }
    },
    [workspaceId, toast]
  );

  const handleDeleteSprintFolder = useCallback(
    async (sprintFolderId: string) => {
      setIsDeletingSprintFolder(true);
      try {
        // Find the sprint folder object
        let foundSprintFolder: SprintFolder | null = null;
        let foundSpace: Space | null = null;
        for (const space of spaces) {
          const sprintFolder = space.sprint_folders.find(
            (sf) => sf.id === sprintFolderId
          );
          if (sprintFolder) {
            foundSprintFolder = sprintFolder;
            foundSpace = space;
            break;
          }
        }
        if (!foundSprintFolder) return;
        // 1. Find all sprints in this sprint folder
        const sprints = foundSprintFolder.sprints || [];
        const sprintIds = sprints.map((s) => s.id);
        // 2. Delete all tasks for these sprints
        if (sprintIds.length > 0) {
          const { error: tasksError } = await supabase
            .from("tasks")
            .delete()
            .in("sprint_id", sprintIds);
          if (tasksError) {
            console.error("Error deleting sprint folder tasks:", tasksError);
            throw tasksError;
          }
          // 3. Delete all statuses for these sprints
          const { error: statusesError } = await supabase
            .from("statuses")
            .delete()
            .in("sprint_id", sprintIds);
          if (statusesError) {
            console.error(
              "Error deleting sprint folder statuses:",
              statusesError
            );
            throw statusesError;
          }
          // 4. Delete all sprints in this sprint folder
          const { error: sprintsError } = await supabase
            .from("sprints")
            .delete()
            .in("id", sprintIds);
          if (sprintsError) {
            console.error("Error deleting sprints:", sprintsError);
            throw sprintsError;
          }
        }
        // 5. Delete the sprint folder itself
        const { error: sprintFolderError } = await supabase
          .from("sprint_folders")
          .delete()
          .eq("id", foundSprintFolder.id);
        if (sprintFolderError) {
          console.error("Error deleting sprint folder:", sprintFolderError);
          throw sprintFolderError;
        }
        // Update local state
        setSpaces((prev) =>
          prev.map((space) => ({
            ...space,
            sprint_folders: space.sprint_folders.filter(
              (sf) => sf.id !== sprintFolderId
            ),
          }))
        );
        // Remove from favorites if it was favorited
        setSprintFolderFavorites((prev) => {
          const newFavorites = new Set(prev);
          newFavorites.delete(sprintFolderId);
          localStorage.setItem(
            `sprint_folder_favorites_${workspace.id}`,
            JSON.stringify([...newFavorites])
          );
          return newFavorites;
        });
        toast({
          title: "Sprint folder deleted",
          description:
            "Sprint folder and all its related data have been deleted.",
        });
        setDeleteSprintFolderId(null);
        // Navigate to home if we're currently in the deleted sprint folder
        if (
          foundSpace &&
          pathname.includes(`/sf/${foundSprintFolder.sprint_folder_id}`)
        ) {
          router.push(`/${workspaceId}/home`);
        }
      } catch (error: any) {
        toast({
          title: "Error deleting sprint folder",
          description: error.message || "Something went wrong",
          variant: "destructive",
        });
      } finally {
        setIsDeletingSprintFolder(false);
      }
    },
    [supabase, toast, pathname, router, workspaceId, workspace.id, spaces]
  );

  const handleAddProjectToFavorites = useCallback(
    async (project: Project) => {
      try {
        const newFavorites = new Set(projectFavorites);
        if (projectFavorites.has(project.id)) {
          newFavorites.delete(project.id);
        } else {
          newFavorites.add(project.id);
        }
        setProjectFavorites(newFavorites);

        localStorage.setItem(
          `project_favorites_${workspace.id}`,
          JSON.stringify([...newFavorites])
        );

        toast({
          title: projectFavorites.has(project.id)
            ? "Removed from favorites"
            : "Added to favorites",
          description: `${project.name} ${
            projectFavorites.has(project.id) ? "removed from" : "added to"
          } favorites.`,
        });
      } catch (error) {
        console.error("Error updating project favorites:", error);
      }
    },
    [projectFavorites, workspace.id, toast]
  );

  const handleRenameProject = useCallback(
    async (projectId: string, newName: string) => {
      if (!newName.trim()) return;

      try {
        let foundProject: Project | null = null;
        let foundSpace: Space | null = null;

        for (const space of spaces) {
          const project = space.projects.find((p) => p.id === projectId);
          if (project) {
            foundProject = project;
            foundSpace = space;
            break;
          }
        }

        if (!foundProject) return;

        const { error } = await supabase
          .from("projects")
          .update({ name: newName.trim() })
          .eq("project_id", foundProject.project_id);

        if (error) throw error;

        setSpaces((prev) =>
          prev.map((space) => ({
            ...space,
            projects: space.projects.map((project) =>
              project.id === projectId
                ? { ...project, name: newName.trim() }
                : project
            ),
          }))
        );

        toast({
          title: "Project renamed",
          description: `Project renamed to "${newName.trim()}".`,
        });

        setRenameProjectId(null);
        setRenameValue("");
      } catch (error: any) {
        console.error("Error renaming project:", error);
        toast({
          title: "Error renaming project",
          description: error.message || "Something went wrong",
          variant: "destructive",
        });
      }
    },
    [supabase, toast, spaces]
  );

  const handleCopyProjectLink = useCallback(
    async (project: Project, space: Space) => {
      try {
        const url = `${window.location.origin}/${workspaceId}/space/${space.space_id}/project/${project.project_id}`;
        await navigator.clipboard.writeText(url);

        toast({
          title: "Link copied",
          description: "Project link copied to clipboard.",
        });
      } catch (error) {
        console.error("Error copying link:", error);
        toast({
          title: "Error copying link",
          description: "Failed to copy link to clipboard.",
          variant: "destructive",
        });
      }
    },
    [workspaceId, toast]
  );

  const handleDeleteProject = useCallback(
    async (projectId: string) => {
      setIsDeletingProject(true);
      try {
        // Find the project object
        let foundProject: Project | null = null;
        for (const space of spaces) {
          const project = space.projects.find((p) => p.id === projectId);
          if (project) {
            foundProject = project;
            break;
          }
        }
        if (!foundProject) return;
        // 1. Delete all tasks for this project
        const { error: tasksError } = await supabase
          .from("tasks")
          .delete()
          .eq("project_id", foundProject.id);
        if (tasksError) {
          console.error("Error deleting project tasks:", tasksError);
          throw tasksError;
        }
        // 2. Delete all statuses for this project
        const { error: statusesError } = await supabase
          .from("statuses")
          .delete()
          .eq("project_id", foundProject.id);
        if (statusesError) {
          console.error("Error deleting project statuses:", statusesError);
          throw statusesError;
        }
        // 3. Delete the project itself
        const { error: deleteError } = await supabase
          .from("projects")
          .delete()
          .eq("id", foundProject.id);
        if (deleteError) {
          console.error("Error deleting project:", deleteError);
          throw deleteError;
        }
        // Update local state
        setSpaces((prev) =>
          prev.map((space) => ({
            ...space,
            projects: space.projects.filter(
              (project) => project.id !== projectId
            ),
          }))
        );
        // Remove from favorites if it was favorited
        setProjectFavorites((prev) => {
          const newFavorites = new Set(prev);
          newFavorites.delete(projectId);
          localStorage.setItem(
            `project_favorites_${workspace.id}`,
            JSON.stringify([...newFavorites])
          );
          return newFavorites;
        });
        toast({
          title: "Project deleted",
          description: "Project and all its related data have been deleted.",
        });
        setDeleteProjectId(null);
        // Navigate to home if we're currently in the deleted project
        if (pathname.includes(`/project/${foundProject.project_id}`)) {
          router.push(`/${workspaceId}/home`);
        }
      } catch (error: any) {
        toast({
          title: "Error deleting project",
          description: error.message || "Something went wrong",
          variant: "destructive",
        });
      } finally {
        setIsDeletingProject(false);
      }
    },
    [supabase, toast, pathname, router, workspaceId, workspace.id, spaces]
  );

  const handleExportToJSON = useCallback(
    async (project: Project) => {
      try {
        const response = await fetch(
          `/api/workspace/${params.workspaceId}/export/json`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ projectId: project.id }),
          }
        );

        const result = await response.json();
        if (result.success) {
          // Create and download the JSON file
          const blob = new Blob([JSON.stringify(result.data, null, 2)], {
            type: "application/json",
          });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = result.filename;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);

          toast({
            title: "Export successful",
            description: `Exported ${result.data.summary.totalTasks} tasks to JSON`,
          });
        } else {
          throw new Error(result.error);
        }
      } catch (error: any) {
        console.error("JSON export error:", error);
        toast({
          title: "Export failed",
          description: error.message || "Failed to export to JSON",
          variant: "destructive",
        });
      }
    },
    [params.workspaceId, toast]
  );

  const handleExportToCSV = useCallback(
    async (project: Project) => {
      try {
        const response = await fetch(
          `/api/workspace/${params.workspaceId}/export/csv`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ projectId: project.id }),
          }
        );

        const result = await response.json();
        if (result.success) {
          // Create and download the CSV file
          const blob = new Blob([result.data], {
            type: "text/csv;charset=utf-8;",
          });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = result.filename;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);

          toast({
            title: "Export successful",
            description: `Exported tasks to CSV`,
          });
        } else {
          throw new Error(result.error);
        }
      } catch (error: any) {
        console.error("CSV export error:", error);
        toast({
          title: "Export failed",
          description: error.message || "Failed to export to CSV",
          variant: "destructive",
        });
      }
    },
    [params.workspaceId, toast]
  );

  if (!shouldShowSidebar) {
    return null;
  }

  return (
    <TooltipProvider>
      <div className="w-64 workspace-secondary-sidebar-bg border-r workspace-border flex flex-col">
        <div className="p-2 border-b workspace-border ">
          <div className="flex items-center justify-between">
            {isSearching ? (
              <div className="flex-1 flex items-center">
                <Input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-6 text-xs bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 focus:ring-2 focus:workspace-ring"
                  autoFocus
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 ml-1 hover:workspace-hover workspace-sidebar-text"
                  onClick={() => {
                    setIsSearching(false);
                    setSearchQuery("");
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <>
                <span className="text-sm font-medium workspace-sidebar-text pl-2">
                  Home
                </span>
                <div className="flex items-center space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 hover:workspace-hover workspace-sidebar-text"
                    onClick={() => setIsSearching(true)}
                    title="Search"
                  >
                    <Search className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 hover:workspace-hover workspace-sidebar-text"
                    onClick={() => setCreateSpaceModalOpen(true)}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Quick Links */}
        <div className="p-4 space-y-1">
          <div className="flex items-center mb-2 font-semibold workspace-text-muted px-1">
            <Bookmark className="h-4 w-4 flex-shrink-0 transform group-hover:scale-110 transition-transform duration-200" />
            <h3 className="pl-1 text-xs font-semibold workspace-text-muted uppercase tracking-wide">
              Quick Links
            </h3>
          </div>
          {quickLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link key={link.name} href={link.href}>
                <div
                  className={`flex items-center justify-between p-2 text-xs rounded-lg transition-colors group ${
                    isActive
                      ? "workspace-component-bg workspace-component-active-color "
                      : "hover:workspace-hover workspace-sidebar-text"
                  }`}
                >
                  <div className="flex items-center">
                    <link.icon className="mr-2 h-4 w-4 transform group-hover:scale-110 transition-transform duration-200" />
                    {link.name}
                  </div>
                  {link.count > 0 && (
                    <span className="w-5 h-5 workspace-component-bg workspace-component-active-color text-xs items-center flex justify-center rounded-full">
                      {link.count}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>

        {/* Favorites */}
        <div className="px-4 pb-4">
          <Collapsible open={favoritesOpen} onOpenChange={setFavoritesOpen}>
            <CollapsibleTrigger asChild>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center group font-semibold workspace-text-muted cursor-pointer w-full px-1">
                  <Star className="h-4 w-4 flex-shrink-0 transform group-hover:scale-110 transition-transform duration-200" />
                  <h3 className="pl-1 text-xs font-semibold workspace-text-muted uppercase tracking-wide">
                    Favorites
                  </h3>
                </div>
                {favoritesOpen ? (
                  <ChevronDown
                    size={16}
                    className="ml-1 workspace-text-muted cursor-pointer"
                  />
                ) : (
                  <ChevronRight
                    size={16}
                    className="ml-1 workspace-text-muted cursor-pointer"
                  />
                )}
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              {favorites.size > 0 ||
              sprintFavorites.size > 0 ||
              projectFavorites.size > 0 ? (
                <div className="space-y-2">
                  {/* Space Favorites */}
                  {favorites.size > 0 && (
                    <div className="space-y-1">
                      {spaces
                        .filter((space) => favorites.has(space.id))
                        .map((space) => (
                          <div key={`fav-space-${space.id}`} className="group">
                            <div
                              className="flex items-center px-2 py-1 text-sm rounded-lg workspace-sidebar-text hover:workspace-hover cursor-pointer"
                              onClick={() => toggleSpace(space.space_id)}
                            >
                              <div
                                className={`w-4 h-4 rounded-sm mr-2 flex-shrink-0 flex items-center justify-center ${getIconColor(
                                  space.icon
                                )}`}
                              >
                                <span className="text-[10px] font-bold text-white">
                                  {space.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <span className="text-xs font-medium workspace-sidebar-text truncate">
                                {space.name}
                              </span>
                              {space.is_private && <Lock className="w-3 h-3" />}
                              {hasJiraIntegration(space) && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="ml-2 w-3 h-3">
                                      <JiraSvg />
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="text-xs">
                                      Connected with Jira
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 ml-auto opacity-0 group-hover:opacity-100"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAddToFavorites(space);
                                }}
                                title="Remove from favorites"
                              >
                                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                              </Button>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}

                  {/* Project Favorites */}
                  {projectFavorites.size > 0 && (
                    <div className="space-y-1">
                      {spaces.map((space) =>
                        space.projects
                          .filter((project) => projectFavorites.has(project.id))
                          .map((project) => (
                            <div
                              key={`fav-project-${project.id}`}
                              className="group"
                            >
                              <Link
                                href={`/${workspaceId}/space/${space.space_id}/project/${project.project_id}`}
                                className="block"
                              >
                                <div className="flex items-center px-2 py-1 text-sm rounded-lg workspace-sidebar-text hover:workspace-hover cursor-pointer">
                                  <Hash className="w-4 h-4 mr-2 flex-shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <span className="text-xs font-medium workspace-sidebar-text truncate block">
                                      {project.name}
                                    </span>
                                  </div>
                                  {isJiraProject(project) && (
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <div className="ml-2 w-3 h-3">
                                          <JiraSvg />
                                        </div>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p className="text-xs">
                                          Connected with Jira
                                        </p>
                                      </TooltipContent>
                                    </Tooltip>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0 ml-auto opacity-0 group-hover:opacity-100"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      handleAddProjectToFavorites(project);
                                    }}
                                    title="Remove from favorites"
                                  >
                                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                  </Button>
                                </div>
                              </Link>
                            </div>
                          ))
                      )}
                    </div>
                  )}

                  {/* Sprint Favorites */}
                  {sprintFavorites.size > 0 && (
                    <div className="space-y-1">
                      {spaces.map((space) =>
                        space.sprint_folders.map((sprintFolder) =>
                          sprintFolder.sprints
                            .filter((sprint) => sprintFavorites.has(sprint.id))
                            .map((sprint) => (
                              <div
                                key={`fav-sprint-${sprint.id}`}
                                className="group"
                              >
                                <Link
                                  href={`/${workspaceId}/space/${space.space_id}/sf/${sprintFolder.sprint_folder_id}/s/${sprint.sprint_id}`}
                                  className="block"
                                >
                                  <div className="flex items-center px-2 py-1 text-sm rounded-lg workspace-sidebar-text hover:workspace-hover cursor-pointer">
                                    <CirclePlay className="w-4 h-4 mr-2 flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                      <span className="text-xs font-medium workspace-sidebar-text truncate block">
                                        {sprint.name}
                                      </span>
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 w-6 p-0 ml-auto opacity-0 group-hover:opacity-100"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleAddSprintToFavorites(sprint);
                                      }}
                                      title="Remove from favorites"
                                    >
                                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                    </Button>
                                  </div>
                                </Link>
                              </div>
                            ))
                        )
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-xs text-gray-500 py-2 w-full flex items-center justify-center">
                  No favorites yet.
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>
        </div>

        <hr className="workspace-border p-2" />

        <div className="px-4">
          <div className="flex items-center justify-between mb-2 w-full">
            <Link href={`/${workspaceId}/home`} className="w-full">
              <div
                className={`flex items-center gap-1 px-1 py-2 text-xs font-semibold uppercase tracking-wide rounded-lg transition-colors group ${
                  pathname === `/${workspaceId}/home`
                    ? "workspace-component-bg workspace-component-active-color"
                    : "workspace-text-muted "
                }`}
              >
                <LayoutDashboard className="h-4 w-4 flex-shrink-0 transform group-hover:scale-110 transition-transform duration-200" />
                {workspace.name}'s Workspace
              </div>
            </Link>
          </div>
        </div>

        {/* Spaces */}
        <div className="flex-1 px-4">
          <div className="flex items-center justify-between mb-2 font-semibold workspace-text-muted">
            <div className="flex items-center px-1">
              <Globe className="h-4 w-4 flex-shrink-0 transform group-hover:scale-110 transition-transform duration-200" />
              <h3 className="pl-1 text-xs font-semibold workspace-text-muted uppercase tracking-wide">
                Spaces
              </h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 hover:workspace-hover workspace-sidebar-text"
              onClick={() => setCreateSpaceModalOpen(true)}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>

          <div className="space-y-1">
            {filteredSpaces.map((space) => {
              const isExpanded = expandedSpaces.has(space.space_id);
              return (
                <div key={space.id}>
                  {/* Space Header */}
                  <div className="flex items-center group">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 hover:workspace-hover workspace-sidebar-text mr-1"
                      onClick={() => toggleSpace(space.space_id)}
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-3 w-3" />
                      ) : (
                        <ChevronRight className="h-3 w-3" />
                      )}
                    </Button>
                    <div className="flex items-center flex-1 min-w-0">
                      <div
                        className={`w-4 h-4 rounded-sm mr-2 flex-shrink-0 flex items-center justify-center ${getIconColor(
                          space.icon
                        )}`}
                      >
                        <span className="text-[10px] font-bold text-white">
                          {space.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span className="text-xs font-medium workspace-sidebar-text truncate">
                        {space.name}
                      </span>

                      {space.is_private && <Lock className="w-3 h-3 ml-2" />}
                      {hasJiraIntegration(space) && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="ml-2 w-3 h-3">
                              <JiraSvg />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs">Connected with Jira</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                    <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 hover:workspace-hover workspace-sidebar-text mr-1"
                        onClick={() => {
                          setSelectedSpaceForProject(space.id);
                          setCreateProjectModalOpen(true);
                        }}
                        title="Create project"
                      >
                        <Plus className="h-3 w-3" />
                      </Button>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 hover:workspace-hover workspace-sidebar-text"
                            title="More options"
                          >
                            <MoreHorizontal className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuSub>
                            <DropdownMenuSubTrigger className="text-xs hover:workspace-hover cursor-pointer">
                              <Plus className="h-3 w-3" />
                              Create new
                            </DropdownMenuSubTrigger>
                            <DropdownMenuPortal>
                              <DropdownMenuSubContent>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedSpaceForProject(space.id);
                                    setCreateProjectModalOpen(true);
                                  }}
                                  className="text-xs hover:workspace-hover cursor-pointer"
                                >
                                  <Hash className="h-3 w-3" />
                                  Create new project
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedSpaceForSprintFolder(space.id);
                                    setCreateSprintFolderModalOpen(true);
                                  }}
                                  className="text-xs hover:workspace-hover cursor-pointer"
                                >
                                  <FolderKanban className="h-3 w-3" />
                                  Create new sprint folder
                                </DropdownMenuItem>
                              </DropdownMenuSubContent>
                            </DropdownMenuPortal>
                          </DropdownMenuSub>

                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleAddToFavorites(space)}
                            className="text-xs hover:workspace-hover cursor-pointer"
                          >
                            <Star
                              className={`h-3 w-3 ${
                                favorites.has(space.id)
                                  ? "fill-yellow-400 text-yellow-400"
                                  : ""
                              }`}
                            />
                            {favorites.has(space.id)
                              ? "Remove from favorites"
                              : "Add to favorites"}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setRenameSpaceId(space.id);
                              setRenameValue(space.name);
                            }}
                            className="text-xs hover:workspace-hover cursor-pointer"
                          >
                            <Edit className="h-3 w-3" />
                            Rename
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleCopyLink(space)}
                            className="text-xs hover:workspace-hover cursor-pointer"
                          >
                            <Copy className="h-3 w-3" />
                            Copy link
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-xs hover:workspace-hover cursor-pointer">
                            <Settings className="h-3 w-3" />
                            Settings
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-xs hover:workspace-hover cursor-pointer text-red-600"
                            onClick={() => setDeleteSpaceId(space.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                            Delete space
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {/* Sprint Folders */}
                  {isExpanded && (
                    <div className="ml-6 mt-1 space-y-1">
                      {space.sprint_folders.map((sprintFolder) => {
                        const isSprintFolderExpanded =
                          expandedSprintFolders.has(
                            sprintFolder.sprint_folder_id
                          );
                        const sprintFolderPath = `/${workspaceId}/space/${space.space_id}/sf/${sprintFolder.sprint_folder_id}`;
                        const isSprintFolderActive =
                          pathname === sprintFolderPath;

                        return (
                          <div key={sprintFolder.id}>
                            {/* Sprint Folder Header */}
                            <div
                              className={`flex items-center group rounded-lg p-1 ${
                                isSprintFolderActive
                                  ? "workspace-component-bg workspace-component-active-color"
                                  : "hover:workspace-hover"
                              }`}
                            >
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 hover:workspace-hover workspace-sidebar-text mr-1"
                                onClick={() =>
                                  toggleSprintFolder(
                                    sprintFolder.sprint_folder_id
                                  )
                                }
                              >
                                {isSprintFolderExpanded ? (
                                  <ChevronDown className="h-3 w-3" />
                                ) : (
                                  <ChevronRight className="h-3 w-3" />
                                )}
                              </Button>
                              <Link
                                href={sprintFolderPath}
                                className="flex items-center flex-1 min-w-0 group"
                              >
                                <FolderKanban className="mr-2 h-[14px] w-[14px] flex-shrink-0 transform group-hover:scale-110 transition-transform duration-200" />
                                <span
                                  className={`text-xs font-medium truncate  ${
                                    isSprintFolderActive
                                      ? "workspace-component-active-color"
                                      : "workspace-sidebar-text"
                                  }`}
                                >
                                  {sprintFolder.name}
                                </span>
                              </Link>
                              <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 hover:workspace-hover workspace-sidebar-text mr-1"
                                  onClick={() => {
                                    setSelectedSprintFolderForSprint({
                                      sprintFolder,
                                      space,
                                    });
                                    setCreateSprintModalOpen(true);
                                  }}
                                  title="Create new sprint"
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>

                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 w-6 p-0 hover:workspace-hover workspace-sidebar-text"
                                      title="More options"
                                    >
                                      <MoreHorizontal className="h-3 w-3" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent
                                    align="end"
                                    className="w-48"
                                  >
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setSelectedSprintFolderForSprint({
                                          sprintFolder,
                                          space,
                                        });
                                        setCreateSprintModalOpen(true);
                                      }}
                                      className="text-xs hover:workspace-hover cursor-pointer"
                                    >
                                      <Plus className="h-3 w-3" />
                                      Create new sprint
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={() =>
                                        handleAddSprintFolderToFavorites(
                                          sprintFolder
                                        )
                                      }
                                      className="text-xs hover:workspace-hover cursor-pointer"
                                    >
                                      <Star
                                        className={`h-3 w-3 ${
                                          sprintFolderFavorites.has(
                                            sprintFolder.id
                                          )
                                            ? "fill-yellow-400 text-yellow-400"
                                            : ""
                                        }`}
                                      />
                                      {sprintFolderFavorites.has(
                                        sprintFolder.id
                                      )
                                        ? "Remove from favorites"
                                        : "Add to favorites"}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setRenameSprintFolderId(
                                          sprintFolder.id
                                        );
                                        setRenameValue(sprintFolder.name);
                                      }}
                                      className="text-xs hover:workspace-hover cursor-pointer"
                                    >
                                      <Edit className="h-3 w-3" />
                                      Rename
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() =>
                                        handleCopySprintFolderLink(
                                          sprintFolder,
                                          space
                                        )
                                      }
                                      className="text-xs hover:workspace-hover cursor-pointer"
                                    >
                                      <Copy className="h-3 w-3" />
                                      Copy link
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="text-xs hover:workspace-hover cursor-pointer">
                                      <Settings className="h-3 w-3" />
                                      Settings
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      className="text-xs hover:workspace-hover cursor-pointer text-red-600"
                                      onClick={() =>
                                        setDeleteSprintFolderId(sprintFolder.id)
                                      }
                                    >
                                      <Trash2 className="h-3 w-3" />
                                      Delete sprint folder
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>

                            {/* Sprints */}
                            {isSprintFolderExpanded && (
                              <div className="ml-6 mt-1 space-y-1">
                                {sprintFolder.sprints.map((sprint) => {
                                  const sprintPath = `/${workspaceId}/space/${space.space_id}/sf/${sprintFolder.sprint_folder_id}/s/${sprint.sprint_id}`;
                                  const isActive =
                                    pathname.startsWith(sprintPath);
                                  return (
                                    <div
                                      key={sprint.id}
                                      className="group relative"
                                    >
                                      <Link href={sprintPath}>
                                        <div
                                          className={`flex items-center justify-between p-2 text-xs rounded-lg transition-colors ${
                                            isActive
                                              ? "workspace-component-bg workspace-component-active-color"
                                              : "workspace-sidebar-text hover:workspace-hover"
                                          }`}
                                        >
                                          <div className="flex items-center min-w-0">
                                            <CirclePlay className="mr-2 h-[14px] w-[14px] flex-shrink-0 transform group-hover:scale-110 transition-transform duration-200" />
                                            <span className="truncate">
                                              {sprint.name}
                                            </span>
                                          </div>
                                          <div className="flex items-center">
                                            <span
                                              className={`text-xs group-hover:hidden ${
                                                isActive
                                                  ? "workspace-component-active-color"
                                                  : "workspace-sidebar-text"
                                              }`}
                                            >
                                              {taskCounts[sprint.id] || 0}
                                            </span>
                                          </div>
                                        </div>
                                      </Link>

                                      {/* Action Buttons */}
                                      <div className="absolute right-1 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                                        {/* Create Task Button */}
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-6 w-6 p-0 hover:workspace-hover workspace-sidebar-text"
                                          onClick={(e) => {
                                            e.preventDefault();
                                            if (sprint && space) {
                                              setSelectedSprintForTask({
                                                sprint,
                                                space,
                                              });
                                              setCreateTaskModalOpen(true);
                                            }
                                          }}
                                          title="Create new task"
                                        >
                                          <Plus className="h-3 w-3" />
                                        </Button>

                                        {/* Dropdown Menu */}
                                        <DropdownMenu>
                                          <DropdownMenuTrigger asChild>
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              className="h-6 w-6 p-0 hover:workspace-hover workspace-sidebar-text"
                                              onClick={(e) =>
                                                e.preventDefault()
                                              }
                                            >
                                              <MoreHorizontal className="h-3 w-3" />
                                            </Button>
                                          </DropdownMenuTrigger>
                                          <DropdownMenuContent
                                            align="end"
                                            className="w-48"
                                          >
                                            <DropdownMenuItem
                                              onClick={() => {
                                                if (sprint && space) {
                                                  setSelectedSprintForTask({
                                                    sprint,
                                                    space,
                                                  });
                                                  setCreateTaskModalOpen(true);
                                                }
                                              }}
                                              className="text-xs hover:workspace-hover cursor-pointer"
                                            >
                                              <Plus className="h-3 w-3" />
                                              Create new task
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                              onClick={() => {
                                                handleAddSprintToFavorites(
                                                  sprint
                                                );
                                              }}
                                              className="text-xs hover:workspace-hover cursor-pointer"
                                            >
                                              <Star
                                                className={`h-4 w-4 ${
                                                  sprintFavorites.has(sprint.id)
                                                    ? "fill-yellow-400 text-yellow-400"
                                                    : ""
                                                }`}
                                              />
                                              {sprintFavorites.has(sprint.id)
                                                ? "Remove from favorites"
                                                : "Add to favorites"}
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                              onClick={() => {
                                                setRenameSprintId(sprint.id);
                                                setRenameValue(sprint.name);
                                              }}
                                              className="text-xs hover:workspace-hover cursor-pointer"
                                            >
                                              <Edit className="h-3 w-3" />
                                              Rename
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                              onClick={() => {
                                                handleCopySprintLink(
                                                  sprint,
                                                  space,
                                                  sprintFolder
                                                );
                                              }}
                                              className="text-xs hover:workspace-hover cursor-pointer"
                                            >
                                              <Copy className="h-3 w-3" />
                                              Copy link
                                            </DropdownMenuItem>
                                            <DropdownMenuItem className="text-xs hover:workspace-hover cursor-pointer">
                                              <Settings className="h-3 w-3" />
                                              Settings
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                              className="text-xs hover:workspace-hover cursor-pointer text-red-600"
                                              onClick={() =>
                                                setDeleteSprintId(sprint.id)
                                              }
                                            >
                                              <Trash2 className="h-3 w-3" />
                                              Delete sprint
                                            </DropdownMenuItem>
                                          </DropdownMenuContent>
                                        </DropdownMenu>
                                      </div>
                                    </div>
                                  );
                                })}

                                {/* Add Sprint Button */}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="w-full flex items-center justify-start text-xs p-2 h-7 min-w-0 workspace-sidebar-text group hover:workspace-hover border border-dashed workspace-border "
                                  onClick={() => {
                                    setSelectedSprintFolderForSprint({
                                      sprintFolder,
                                      space,
                                    });
                                    setCreateSprintModalOpen(true);
                                  }}
                                >
                                  <Plus className="h-3 w-3 flex-shrink-0 transform group-hover:scale-110 transition-transform duration-200" />
                                  Add Sprint
                                </Button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {/* Projects */}
                  {isExpanded && (
                    <div className="ml-6 mt-1 space-y-1">
                      {space.projects.map((project) => {
                        const projectPath = `/${workspaceId}/space/${space.space_id}/project/${project.project_id}`;
                        const isActive = pathname.startsWith(projectPath);
                        return (
                          <div key={project.id} className="group relative">
                            <Link href={projectPath}>
                              <div
                                className={`flex items-center justify-between p-2 text-xs rounded-lg transition-colors ${
                                  isActive
                                    ? "workspace-component-bg workspace-component-active-color"
                                    : "workspace-sidebar-text hover:workspace-hover"
                                }`}
                              >
                                <div className="flex items-center min-w-0">
                                  <Hash className="mr-2 h-3 w-3 flex-shrink-0 transform group-hover:scale-110 transition-transform duration-200" />
                                  <span className="truncate">
                                    {project.name}
                                  </span>
                                  {isJiraProject(project) && (
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <div className="ml-2 w-3 h-3">
                                          <JiraSvg />
                                        </div>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p className="text-xs">
                                          Connected with Jira
                                        </p>
                                      </TooltipContent>
                                    </Tooltip>
                                  )}
                                </div>
                                <div className="flex items-center">
                                  <span
                                    className={`text-xs group-hover:hidden ${
                                      isActive
                                        ? "workspace-component-active-color"
                                        : "workspace-sidebar-text"
                                    }`}
                                  >
                                    {taskCounts[project.id] || 0}
                                  </span>
                                </div>
                              </div>
                            </Link>

                            {/* Action Buttons */}
                            <div className="absolute right-1 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                              {/* Create Task Button */}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 hover:workspace-hover workspace-sidebar-text"
                                onClick={(e) => {
                                  e.preventDefault();
                                  if (project && space) {
                                    setSelectedProjectForTask({
                                      project,
                                      space,
                                    });
                                    setCreateTaskModalOpen(true);
                                  }
                                }}
                                title="Create new task"
                              >
                                <Plus className="h-3 w-3" />
                              </Button>

                              {/* Dropdown Menu */}
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0 hover:workspace-hover workspace-sidebar-text"
                                    onClick={(e) => e.preventDefault()}
                                  >
                                    <MoreHorizontal className="h-3 w-3" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                  align="end"
                                  className="w-48"
                                >
                                  <DropdownMenuItem
                                    onClick={() => {
                                      if (project && space) {
                                        setSelectedProjectForTask({
                                          project,
                                          space,
                                        });
                                        setCreateTaskModalOpen(true);
                                      }
                                    }}
                                    className="text-xs hover:workspace-hover cursor-pointer"
                                  >
                                    <Plus className="h-3 w-3" />
                                    Create new task
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleAddProjectToFavorites(project)
                                    }
                                    className="text-xs hover:workspace-hover cursor-pointer"
                                  >
                                    <Star
                                      className={`h-4 w-4 ${
                                        projectFavorites.has(project.id)
                                          ? "fill-yellow-400 text-yellow-400"
                                          : ""
                                      }`}
                                    />
                                    {projectFavorites.has(project.id)
                                      ? "Remove from favorites"
                                      : "Add to favorites"}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setRenameProjectId(project.id);
                                      setRenameValue(project.name);
                                    }}
                                    className="text-xs hover:workspace-hover cursor-pointer"
                                  >
                                    <Edit className="h-3 w-3" />
                                    Rename
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleCopyProjectLink(project, space)
                                    }
                                    className="text-xs hover:workspace-hover cursor-pointer"
                                  >
                                    <Copy className="h-3 w-3" />
                                    Copy link
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="text-xs hover:workspace-hover cursor-pointer">
                                    <Settings className="h-3 w-3" />
                                    Settings
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuSub>
                                    <DropdownMenuSubTrigger className="p-0 text-xs hover:workspace-hover cursor-pointer">
                                      <DropdownMenuItem className="text-xs hover:workspace-hover cursor-pointer">
                                        <Upload className="h-3 w-3" />
                                        Export
                                      </DropdownMenuItem>
                                    </DropdownMenuSubTrigger>
                                    <DropdownMenuPortal>
                                      <DropdownMenuSubContent>
                                        <DropdownMenuItem
                                          className="text-xs hover:workspace-hover cursor-pointer"
                                          onClick={() => {
                                            setSelectedProjectForExport({
                                              project,
                                              space,
                                            });
                                            setExportToJiraModalOpen(true);
                                          }}
                                        >
                                          <div className="w-3 h-3 mr-2">
                                            <JiraSvg />
                                          </div>
                                          Export to Jira
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          disabled
                                          className="text-xs hover:workspace-hover cursor-pointer"
                                        >
                                          <div className="w-3 h-3 mr-2">
                                            <AzureSvg />
                                          </div>
                                          Export to Azure
                                          <DropdownMenuShortcut>
                                            <Badge
                                              variant="outline"
                                              className="text-xs"
                                            >
                                              Coming soon
                                            </Badge>
                                          </DropdownMenuShortcut>
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                          className="text-xs hover:workspace-hover cursor-pointer"
                                          onClick={() =>
                                            handleExportToJSON(project)
                                          }
                                        >
                                          <Braces className="h-3 w-3" />
                                          Export to JSON
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          className="text-xs hover:workspace-hover cursor-pointer"
                                          onClick={() =>
                                            handleExportToCSV(project)
                                          }
                                        >
                                          <FileUp className="h-3 w-3" />
                                          Export to CSV
                                        </DropdownMenuItem>
                                      </DropdownMenuSubContent>
                                    </DropdownMenuPortal>
                                  </DropdownMenuSub>
                                  <DropdownMenuItem
                                    className="text-xs hover:workspace-hover cursor-pointer text-red-600"
                                    onClick={() =>
                                      setDeleteProjectId(project.id)
                                    }
                                  >
                                    <Trash2 className="h-3 w-3" />
                                    Delete project
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        );
                      })}

                      {/* Add Project Button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full flex items-center justify-start text-xs p-2 h-7 min-w-0 workspace-sidebar-text group hover:workspace-hover border border-dashed workspace-border "
                        onClick={() => {
                          setSelectedSpaceForProject(space.id);
                          setCreateProjectModalOpen(true);
                        }}
                      >
                        <Plus className="h-3 w-3 flex-shrink-0 transform group-hover:scale-110 transition-transform duration-200" />
                        Add Project
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <CreateSpaceModal
          open={createSpaceModalOpen}
          onOpenChange={setCreateSpaceModalOpen}
          onSuccess={handleSpaceCreated}
          workspace={workspace}
          spaces={spaces}
        />
        <CreateProjectModal
          open={createProjectModalOpen}
          onOpenChange={setCreateProjectModalOpen}
          onSuccess={handleProjectCreated}
          workspace={workspace}
          spaces={spaces}
          selectedSpaceId={selectedSpaceForProject}
        />
        <CreateTaskModal
          open={createTaskModalOpen}
          onOpenChange={setCreateTaskModalOpen}
          onSuccess={handleTaskCreated}
          workspace={workspace}
          space={selectedProjectForTask?.space || selectedSprintForTask?.space}
          project={selectedProjectForTask?.project}
          sprint={selectedSprintForTask?.sprint}
          statuses={
            selectedProjectForTask
              ? getStatusesForEntity(
                  selectedProjectForTask.project,
                  selectedProjectForTask.space
                )
              : selectedSprintForTask
              ? getStatusesForEntity(
                  selectedSprintForTask.sprint,
                  selectedSprintForTask.space
                )
              : []
          }
          tags={[]} // You can fetch tags here if needed
        />
        <CreateSprintFolderModal
          open={createSprintFolderModalOpen}
          onOpenChange={setCreateSprintFolderModalOpen}
          onSuccess={handleSprintFolderCreated}
          workspace={workspace}
          spaces={spaces}
          selectedSpaceId={selectedSpaceForSprintFolder}
        />
        <CreateSprintModal
          open={createSprintModalOpen}
          onOpenChange={setCreateSprintModalOpen}
          onSuccess={handleSprintCreated}
          workspace={workspace}
          space={selectedSprintFolderForSprint?.space}
          sprintFolder={selectedSprintFolderForSprint?.sprintFolder}
        />

        <ExportToJiraModal
          open={exportToJiraModalOpen}
          onOpenChange={setExportToJiraModalOpen}
          onSuccess={() => {
            // Refresh data after successful export
            refreshSpaces();
            fetchTaskCounts();
            fetchStatuses();
          }}
          workspace={workspace}
          spaces={spaces}
          selectedProject={selectedProjectForExport?.project}
          selectedSpace={selectedProjectForExport?.space}
        />

        {/* Rename Space Dialog */}
        {renameSpaceId && (
          <Dialog
            open={!!renameSpaceId}
            onOpenChange={() => setRenameSpaceId(null)}
          >
            <DialogContent className="sm:max-w-[400px]">
              <DialogHeader>
                <DialogTitle>Rename Space</DialogTitle>
                <DialogDescription>
                  Enter a new name for this space.
                </DialogDescription>
              </DialogHeader>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleRenameSpace(renameSpaceId, renameValue);
                }}
                className="space-y-4 py-4"
              >
                <div>
                  <Label htmlFor="space-name">Space name</Label>
                  <Input
                    id="space-name"
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    placeholder="Enter space name"
                    className="mt-1"
                    required
                  />
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setRenameSpaceId(null)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={!renameValue.trim()}>
                    Rename
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}

        {/* Delete Space Confirmation Dialog */}
        {deleteSpaceId && (
          <Dialog
            open={!!deleteSpaceId}
            onOpenChange={() => setDeleteSpaceId(null)}
          >
            <DialogContent className="sm:max-w-[400px]">
              <DialogHeader>
                <DialogTitle>Delete Space</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete this space? This action cannot
                  be undone and will delete all projects and tasks within this
                  space.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDeleteSpaceId(null)}
                  disabled={isDeletingSpace}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => handleDeleteSpace(deleteSpaceId)}
                  disabled={isDeletingSpace}
                >
                  {isDeletingSpace ? "Deleting..." : "Delete Space"}{" "}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {/* Rename Project Dialog */}
        {renameProjectId && (
          <Dialog
            open={!!renameProjectId}
            onOpenChange={() => setRenameProjectId(null)}
          >
            <DialogContent className="sm:max-w-[400px]">
              <DialogHeader>
                <DialogTitle>Rename Project</DialogTitle>
                <DialogDescription>
                  Enter a new name for this project.
                </DialogDescription>
              </DialogHeader>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleRenameProject(renameProjectId, renameValue);
                }}
                className="space-y-4 py-4"
              >
                <div>
                  <Label htmlFor="project-name">Project name</Label>
                  <Input
                    id="project-name"
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    placeholder="Enter project name"
                    className="mt-1"
                    required
                  />
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setRenameProjectId(null)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={!renameValue.trim()}>
                    Rename
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}

        {/* Delete Project Confirmation Dialog */}
        {deleteProjectId && (
          <Dialog
            open={!!deleteProjectId}
            onOpenChange={() => setDeleteProjectId(null)}
          >
            <DialogContent className="sm:max-w-[400px]">
              <DialogHeader>
                <DialogTitle>Delete Project</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete this project? This action
                  cannot be undone and will delete all tasks within this
                  project.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDeleteProjectId(null)}
                  disabled={isDeletingProject}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => handleDeleteProject(deleteProjectId)}
                  disabled={isDeletingProject}
                >
                  {isDeletingProject ? "Deleting..." : "Delete Project"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {/* Rename Sprint Folder Dialog */}
        {renameSprintFolderId && (
          <Dialog
            open={!!renameSprintFolderId}
            onOpenChange={() => setRenameSprintFolderId(null)}
          >
            <DialogContent className="sm:max-w-[400px]">
              <DialogHeader>
                <DialogTitle>Rename Sprint Folder</DialogTitle>
                <DialogDescription>
                  Enter a new name for this sprint folder.
                </DialogDescription>
              </DialogHeader>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleRenameSprintFolder(renameSprintFolderId, renameValue);
                }}
                className="space-y-4 py-4"
              >
                <div>
                  <Label htmlFor="sprint-folder-name">Sprint folder name</Label>
                  <Input
                    id="sprint-folder-name"
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    placeholder="Enter sprint folder name"
                    className="mt-1"
                    required
                  />
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setRenameSprintFolderId(null)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={!renameValue.trim()}>
                    Rename
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}

        {/* Delete Sprint Folder Confirmation Dialog */}
        {deleteSprintFolderId && (
          <Dialog
            open={!!deleteSprintFolderId}
            onOpenChange={() => setDeleteSprintFolderId(null)}
          >
            <DialogContent className="sm:max-w-[400px]">
              <DialogHeader>
                <DialogTitle>Delete Sprint Folder</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete this sprint folder? This
                  action cannot be undone and will delete all sprints and tasks
                  within this sprint folder.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDeleteSprintFolderId(null)}
                  disabled={isDeletingSprintFolder}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => handleDeleteSprintFolder(deleteSprintFolderId)}
                  disabled={isDeletingSprintFolder}
                >
                  {isDeletingSprintFolder
                    ? "Deleting..."
                    : "Delete Sprint Folder"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {/* Rename Sprint Dialog */}
        {renameSprintId && (
          <Dialog
            open={!!renameSprintId}
            onOpenChange={() => setRenameSprintId(null)}
          >
            <DialogContent className="sm:max-w-[400px]">
              <DialogHeader>
                <DialogTitle>Rename Sprint</DialogTitle>
                <DialogDescription>
                  Enter a new name for this sprint.
                </DialogDescription>
              </DialogHeader>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleRenameSprint(renameSprintId, renameValue);
                }}
                className="space-y-4 py-4"
              >
                <div>
                  <Label htmlFor="sprint-name">Sprint name</Label>
                  <Input
                    id="sprint-name"
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    placeholder="Enter sprint name"
                    className="mt-1"
                    required
                  />
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setRenameSprintId(null)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={!renameValue.trim()}>
                    Rename
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}

        {/* Delete Sprint Confirmation Dialog */}
        {deleteSprintId && (
          <Dialog
            open={!!deleteSprintId}
            onOpenChange={() => setDeleteSprintId(null)}
          >
            <DialogContent className="sm:max-w-[400px]">
              <DialogHeader>
                <DialogTitle>Delete Sprint</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete this sprint? This action
                  cannot be undone and will delete all tasks within this sprint.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDeleteSprintId(null)}
                  disabled={isDeletingSprint}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => handleDeleteSprint(deleteSprintId)}
                  disabled={isDeletingSprint}
                >
                  {isDeletingSprint ? "Deleting..." : "Delete Sprint"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </TooltipProvider>
  );
}
