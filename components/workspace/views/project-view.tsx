"use client";

import React, { useCallback, useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Plus,
  Hash,
  Star,
  Edit,
  Link,
  Info,
  FolderInput,
  Trash,
  MoreHorizontal,
  List,
  LayoutGrid,
  Calendar as CalendarIcon,
  Filter,
  Settings,
  Users,
  Brain,
  CheckIcon,
  Activity,
  Clock,
  CircleUserRound,
  RefreshCw,
  GitBranch,
  RefreshCcw,
  Share2,
  Copy,
} from "lucide-react";
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  DragOverlay,
} from "@dnd-kit/core";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { getIconColor, getAvatarInitials } from "@/lib/utils";
import { useEnhancedToast } from "@/hooks/use-enhanced-toast";
import CreateTaskModal from "@/components/workspace/modals/create-task-modal";
import CreateStatusModal from "@/components/workspace/modals/create-status-modal";
import CustomizeListModal from "@/components/workspace/modals/customize-list-modal";
import FilterModal from "@/components/workspace/modals/filter-modal";
import StatusSettingsModal from "@/components/workspace/modals/status-settings-modal";

// Import our custom hooks and components
import { useProjectData } from "./project/hooks/useProjectData";
import { useTaskOperations } from "./project/hooks/useTaskOperations";
import { useRealtimeSubscriptions } from "./project/hooks/useRealtimeSubscriptions";
import { TaskCard } from "./project/components/TaskCard";
import { StatusColumn } from "./project/components/StatusColumn";
import { BoardView } from "./project/views/BoardView";
import { ListView } from "./project/views/ListView";
import type { ProjectViewProps, ViewMode } from "./project/types";
import { getSubtasksForTask, filterTasks } from "./project/utils";
import JiraSvg from "@/components/svg/apps/JiraSvg";

export default function ProjectView({
  workspace,
  space,
  project,
  tasks: initialTasks,
  statuses: initialStatuses,
  tags: initialTags,
}: ProjectViewProps) {
  const router = useRouter();
  const params = useParams();
  const { toast } = useEnhancedToast();
  const [isSyncing, setIsSyncing] = useState(false);

  // Project management state
  const [projectFavorites, setProjectFavorites] = useState<Set<string>>(
    new Set()
  );
  const [renameProjectId, setRenameProjectId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [deleteProjectId, setDeleteProjectId] = useState<string | null>(null);
  const [isDeletingProject, setIsDeletingProject] = useState(false);

  // Load project favorites from localStorage
  React.useEffect(() => {
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
  }, [workspace.id]);

  // Custom hooks
  const {
    state,
    updateState,
    supabase,
    refreshTasks,
    refreshStatuses,
    loadAllSubtasks,
    createEventLog,
  } = useProjectData({
    workspace,
    space,
    project,
    initialTasks,
    initialStatuses,
    initialTags,
  });

  const taskOperations = useTaskOperations({
    state,
    updateState,
    supabase,
    refreshTasks,
    refreshStatuses,
    loadAllSubtasks,
    createEventLog,
    workspace,
    project,
  });

  // Realtime subscriptions
  useRealtimeSubscriptions({
    supabase,
    workspace,
    project,
    refreshTasks,
    refreshStatuses,
    loadAllSubtasks,
  });

  // Sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Memoized computed values
  const getTaskSubtasks = useCallback(
    (taskId: string) => getSubtasksForTask(taskId, state.allSubtasks),
    [state.allSubtasks]
  );

  // Filtered tasks
  const filteredTasks = useMemo(() => {
    return filterTasks(state.tasks, state.filters);
  }, [state.tasks, state.filters]);

  // Count active filters
  const activeFiltersCount = useMemo(() => {
    return (
      state.filters.status.length +
      state.filters.tags.length +
      state.filters.priority.length +
      state.filters.assigned.length +
      (state.filters.sprintPoints.min > 0 ||
      state.filters.sprintPoints.max < 100
        ? 1
        : 0) +
      (state.filters.showUnassignedOnly ? 1 : 0)
    );
  }, [state.filters]);

  // Check if this is a Jira project
  const isJiraProject = project.type === "jira";

  // Sync function for Jira projects
  const handleSync = useCallback(async () => {
    if (!isJiraProject) return;

    setIsSyncing(true);
    try {
      const response = await fetch(
        `/api/workspace/${params.workspaceId}/jira/bidirectional-sync`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            projectId: project.id,
            options: {
              pushToJira: true,
              pullFromJira: true,
              resolveConflicts: "manual",
              syncTasks: true,
              syncStatuses: true,
            },
          }),
        }
      );

      const result = await response.json();

      if (response.ok && result.success) {
        const { data } = result;
        const changes = [];

        if (data.tasksPushedToJira > 0)
          changes.push(`${data.tasksPushedToJira} tasks pushed to Jira`);
        if (data.tasksPulledFromJira > 0)
          changes.push(`${data.tasksPulledFromJira} tasks pulled from Jira`);
        if (data.statusesPushedToJira > 0)
          changes.push(`${data.statusesPushedToJira} statuses pushed to Jira`);
        if (data.statusesPulledFromJira > 0)
          changes.push(
            `${data.statusesPulledFromJira} statuses pulled from Jira`
          );

        const description =
          changes.length > 0
            ? `Sync completed: ${changes.join(", ")}`
            : "No changes detected during sync";

        toast({
          title: "Bidirectional sync successful",
          description: description,
          browserNotificationTitle: "Bidirectional sync successful",
          browserNotificationBody: description,
        });

        // Refresh the data
        await Promise.all([
          refreshTasks(),
          refreshStatuses(),
          loadAllSubtasks(),
        ]);
      } else {
        throw new Error(result.error || "Failed to sync");
      }
    } catch (error: any) {
      console.error("Sync error:", error);
      toast({
        title: "Sync failed",
        description: error.message || "Failed to sync with Jira",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  }, [
    isJiraProject,
    params.workspaceId,
    project.id,
    refreshTasks,
    refreshStatuses,
    loadAllSubtasks,
    toast,
  ]);

  // Check sync status
  const [syncStatus, setSyncStatus] = useState<any>(null);

  const checkSyncStatus = useCallback(async () => {
    if (!isJiraProject) return;

    try {
      const response = await fetch(
        `/api/workspace/${params.workspaceId}/jira/bidirectional-sync?projectId=${project.id}`,
        {
          method: "GET",
        }
      );

      if (response.ok) {
        const result = await response.json();
        setSyncStatus(result.data);
      }
    } catch (error) {
      console.error("Failed to check sync status:", error);
    }
  }, [isJiraProject, params.workspaceId, project.id]);

  // Check sync status on mount and periodically
  React.useEffect(() => {
    checkSyncStatus();

    if (isJiraProject) {
      const interval = setInterval(checkSyncStatus, 30000); // Check every 30 seconds
      return () => clearInterval(interval);
    }
  }, [checkSyncStatus, isJiraProject]);

  const handleTaskClick = useCallback(
    (task: any) => {
      router.push(`/${workspace.workspace_id}/task/${task.task_id}`);
    },
    [router, workspace.workspace_id]
  );

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const { active } = event;
      console.log("ProjectView handleDragStart - active.id:", active.id);
      console.log("ProjectView handleDragStart - active:", active);

      const draggedTask = filteredTasks.find((t) => t.id === active.id);
      const draggedStatus = state.statuses.find((s) => s.id === active.id);

      console.log("ProjectView handleDragStart - draggedTask:", draggedTask);
      console.log(
        "ProjectView handleDragStart - draggedStatus:",
        draggedStatus
      );

      if (draggedTask) {
        console.log("ProjectView handleDragStart - setting activeTask");
        updateState({ activeTask: draggedTask, activeStatus: null });
      } else if (draggedStatus) {
        console.log("ProjectView handleDragStart - setting activeStatus");
        updateState({ activeStatus: draggedStatus, activeTask: null });
      } else {
        console.log("ProjectView handleDragStart - no match found");
      }
    },
    [filteredTasks, state.statuses, updateState]
  );

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;

      if (over) {
        await taskOperations.handleDragEnd(active, over);
      }

      updateState({ activeTask: null, activeStatus: null });
    },
    [taskOperations, updateState, state.activeStatus, state.activeTask]
  );

  const toggleTaskExpansion = useCallback(
    (taskId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      const newExpandedTasks = new Set(state.expandedTasks);
      if (newExpandedTasks.has(taskId)) {
        newExpandedTasks.delete(taskId);
      } else {
        newExpandedTasks.add(taskId);
      }
      updateState({ expandedTasks: newExpandedTasks });
    },
    [state.expandedTasks, updateState]
  );

  const handleCreateSubtask = useCallback(
    (parentId: string) => {
      updateState({
        subtaskParentId: parentId,
        createTaskModalOpen: true,
      });
    },
    [updateState]
  );

  const handleDeleteTask = useCallback(
    (task: any) => {
      updateState({ taskToDelete: task });
    },
    [updateState]
  );

  const handleOpenStatusSettings = useCallback(
    (status: any) => {
      updateState({ statusSettingsModalOpen: true, statusToEdit: status });
    },
    [updateState]
  );

  // Project management handlers
  const handleAddProjectToFavorites = useCallback(
    async (project: any) => {
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

        // Emit event to update secondary sidebar
        window.dispatchEvent(
          new CustomEvent("projectFavorited", {
            detail: { project, isFavorited: !projectFavorites.has(project.id) },
          })
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
        const { error } = await supabase
          .from("projects")
          .update({ name: newName.trim() })
          .eq("project_id", project.project_id);

        if (error) throw error;

        // Emit event to update secondary sidebar
        window.dispatchEvent(
          new CustomEvent("projectRenamed", {
            detail: { project, newName: newName.trim() },
          })
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
    [supabase, toast, project.project_id, project]
  );

  const handleCopyProjectLink = useCallback(
    async (project: any, space: any) => {
      try {
        const url = `${window.location.origin}/${workspace.workspace_id}/space/${space.space_id}/project/${project.project_id}`;
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
    [workspace.workspace_id, toast]
  );

  const handleDeleteProject = useCallback(
    async (projectId: string) => {
      setIsDeletingProject(true);
      try {
        // 1. Delete all tasks for this project
        const { error: tasksError } = await supabase
          .from("tasks")
          .delete()
          .eq("project_id", project.id);
        if (tasksError) {
          console.error("Error deleting project tasks:", tasksError);
          throw tasksError;
        }
        // 2. Delete all statuses for this project
        const { error: statusesError } = await supabase
          .from("statuses")
          .delete()
          .eq("project_id", project.id);
        if (statusesError) {
          console.error("Error deleting project statuses:", statusesError);
          throw statusesError;
        }
        // 3. Delete the project itself
        const { error: deleteError } = await supabase
          .from("projects")
          .delete()
          .eq("id", project.id);
        if (deleteError) {
          console.error("Error deleting project:", deleteError);
          throw deleteError;
        }

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

        // Emit event to update secondary sidebar
        window.dispatchEvent(
          new CustomEvent("projectDeleted", {
            detail: { project },
          })
        );

        toast({
          title: "Project deleted",
          description: "Project and all its related data have been deleted.",
        });
        setDeleteProjectId(null);
        // Navigate to home
        router.push(`/${workspace.workspace_id}/home`);
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
    [supabase, toast, router, workspace.workspace_id, project.id, project]
  );

  const renderCurrentView = () => {
    const commonProps = {
      state,
      updateState,
      taskOperations,
      getTaskSubtasks,
      handleTaskClick,
      toggleTaskExpansion,
      handleCreateSubtask,
      handleDeleteTask,
      tasks: filteredTasks,
      onOpenStatusSettings: handleOpenStatusSettings,
    };

    switch (state.view) {
      case "board":
        return (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <BoardView {...commonProps} />
            <DragOverlay>
              {state.activeTask ? (
                <TaskCard
                  task={state.activeTask}
                  isDragging
                  subtasks={getTaskSubtasks(state.activeTask.id)}
                  isExpanded={state.expandedTasks.has(state.activeTask.id)}
                  workspaceMembers={state.workspaceMembers}
                  onToggleExpansion={toggleTaskExpansion}
                  onTaskClick={handleTaskClick}
                  onRenameTask={taskOperations.handleRenameTask}
                  onUpdatePriority={taskOperations.handleUpdatePriority}
                  onUpdateDates={taskOperations.handleUpdateDates}
                  onAssignTask={taskOperations.handleAssignTask}
                  onDeleteTask={handleDeleteTask}
                  onCreateSubtask={handleCreateSubtask}
                />
              ) : state.activeStatus ? (
                <div className="transform rotate-2 shadow-2xl">
                  <StatusColumn
                    status={state.activeStatus}
                    tasks={filteredTasks.filter(
                      (t) =>
                        t.status_id === state.activeStatus!.id &&
                        !t.parent_task_id
                    )}
                    onCreateTask={() =>
                      updateState({ createTaskModalOpen: true })
                    }
                    onRenameStatus={taskOperations.handleRenameStatus}
                  />
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        );
      case "list":
        return (
          <ListView
            {...commonProps}
            onCreateStatus={() => updateState({ createStatusModalOpen: true })}
          />
        );
      default:
        return <BoardView {...commonProps} />;
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="workspace-header-bg border-b workspace-border">
        {/* Top section */}
        <div className="px-3 py-3 border-b workspace-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 workspace-component-bg rounded-md items-center flex justify-center">
                <Hash className="w-4 h-4 workspace-component-active-color" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm">{project.name}</span>
                  <Copy
                    className="h-3 w-3 text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(project.project_id);
                        toast({
                          title: "Project ID copied",
                          description:
                            "Project ID has been copied to clipboard",
                        });
                      } catch (error) {
                        console.error("Failed to copy project ID:", error);
                        toast({
                          title: "Failed to copy",
                          description: "Could not copy project ID to clipboard",
                          variant: "destructive",
                        });
                      }
                    }}
                  />
                  {isJiraProject && (
                    <Badge variant="secondary" className="text-xs flex gap-1">
                      <div className="w-3 h-3">
                        <JiraSvg />
                      </div>
                      <span>Jira Connected</span>
                    </Badge>
                  )}
                </div>
                <div className="flex items-center space-x-1 text-xs">
                  <span>Public ➙ in ➙</span>
                  <div
                    className={`w-4 h-4 rounded-sm mr-2 flex-shrink-0 flex items-center justify-center ${getIconColor(
                      space.icon
                    )}`}
                  >
                    <span className="text-[10px] font-bold text-white">
                      {space.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="font-medium">{space.name}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground h-7 p-2 text-xs"
                onClick={() => router.push(`/${workspace.workspace_id}/agents`)}
              >
                <Brain className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground h-7 p-2 text-xs hover:workspace-hover"
              >
                <Share2 className="h-4 w-4" />
              </Button>
              {isJiraProject && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground h-7 p-2 text-xs hover:workspace-hover relative"
                  onClick={handleSync}
                  disabled={isSyncing}
                >
                  {isSyncing ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  {syncStatus?.hasPendingChanges && !isSyncing && (
                    <Badge
                      variant="secondary"
                      className="absolute -top-1 -right-1 h-4 w-4 p-0 text-xs flex items-center justify-center bg-orange-500 text-white"
                    >
                      !
                    </Badge>
                  )}
                </Button>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground w-7 h-7 p-2"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[200px]">
                  <DropdownMenuItem
                    className="text-xs hover:workspace-hover cursor-pointer"
                    onClick={() => handleAddProjectToFavorites(project)}
                  >
                    <Star
                      className={`h-3 w-3 ${
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
                    className="text-xs hover:workspace-hover cursor-pointer"
                    onClick={() => {
                      setRenameProjectId(project.id);
                      setRenameValue(project.name);
                    }}
                  >
                    <Edit className="h-3 w-3" />
                    Rename
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-xs hover:workspace-hover cursor-pointer"
                    onClick={() => handleCopyProjectLink(project, space)}
                  >
                    <Link className="h-4 w-4" />
                    Copy link
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-xs hover:workspace-hover cursor-pointer"
                    onClick={() => updateState({ createTaskModalOpen: true })}
                  >
                    <Plus className="h-3 w-3" />
                    Create new task
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-red-600 text-xs hover:workspace-hover cursor-pointer"
                    onClick={() => setDeleteProjectId(project.id)}
                  >
                    <Trash className="h-3 w-3" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Bottom section - View switcher and controls */}
        <div className="px-3 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* View switcher */}
              <div className="flex items-center space-x-1 bg-muted rounded-lg p-1">
                {state.activeViews.map((viewType) => (
                  <Button
                    key={viewType}
                    variant={state.view === viewType ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => updateState({ view: viewType })}
                    className={`text-xs h-7 ${
                      state.view === viewType
                        ? "workspace-component-bg workspace-component-active-color hover:workspace-component-bg"
                        : "hover:workspace-component-bg"
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      {viewType === "list" && <List className="h-4 w-4" />}
                      {viewType === "board" && (
                        <LayoutGrid className="h-4 w-4" />
                      )}
                      {viewType.charAt(0).toUpperCase() + viewType.slice(1)}
                    </div>
                  </Button>
                ))}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-xs h-7">
                      <Plus className="h-4 w-4" />
                      Add View
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-[200px]">
                    {[
                      {
                        type: "list" as const,
                        icon: <List className="h-4 w-4 mr-2" />,
                      },
                      {
                        type: "board" as const,
                        icon: <LayoutGrid className="h-4 w-4 mr-2" />,
                      },
                    ].map(({ type, icon }) => (
                      <DropdownMenuItem
                        key={type}
                        onClick={() => {
                          if (state.activeViews.includes(type)) {
                            if (state.activeViews.length > 1) {
                              const newActiveViews = state.activeViews.filter(
                                (v) => v !== type
                              );
                              updateState({
                                activeViews: newActiveViews,
                                view:
                                  state.view === type
                                    ? newActiveViews[0]
                                    : state.view,
                              });
                            }
                          } else {
                            updateState({
                              activeViews: [...state.activeViews, type],
                              view: type,
                            });
                          }
                        }}
                      >
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center">
                            {icon}
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                          </div>
                          {state.activeViews.includes(type) && (
                            <CheckIcon className="h-4 w-4 ml-2" />
                          )}
                        </div>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                {state.view === "list" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      updateState({ customizeListModalOpen: true })
                    }
                    className="text-muted-foreground text-xs h-7 p-2"
                  >
                    <Settings className="h-4 w-4" />
                    Columns
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => updateState({ filterModalOpen: true })}
                  className="text-muted-foreground text-xs p-2 h-7 relative"
                >
                  <Filter className="h-4 w-4" />
                  Filter
                  {activeFiltersCount > 0 && (
                    <Badge
                      variant="secondary"
                      className="absolute -top-1 -right-1 h-4 w-4 p-0 text-xs flex items-center justify-center"
                    >
                      {activeFiltersCount}
                    </Badge>
                  )}
                </Button>
                {activeFiltersCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      updateState({
                        filters: {
                          status: [],
                          tags: [],
                          priority: [],
                          assigned: [],
                          sprintPoints: { min: 0, max: 100 },
                          showUnassignedOnly: false,
                        },
                      })
                    }
                    className="text-muted-foreground text-xs p-2 h-7"
                  >
                    Clear
                  </Button>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground text-xs p-2 h-7 relative"
                    >
                      <Users className="h-4 w-4" />
                      Assignee
                      {(state.filters.assigned.length > 0 ||
                        state.filters.showUnassignedOnly) && (
                        <Badge
                          variant="secondary"
                          className="absolute -top-1 -right-1 h-4 w-4 p-0 text-xs flex items-center justify-center"
                        >
                          {state.filters.showUnassignedOnly
                            ? 1
                            : state.filters.assigned.length}
                        </Badge>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-[200px]">
                    <DropdownMenuItem
                      onClick={() =>
                        updateState({
                          filters: {
                            ...state.filters,
                            assigned: [],
                            showUnassignedOnly: false,
                          },
                        })
                      }
                      className="text-xs"
                    >
                      <Users className="h-4 w-4 mr-2" />
                      All assignees
                      {state.filters.assigned.length === 0 &&
                        !state.filters.showUnassignedOnly && (
                          <CheckIcon className="ml-auto h-4 w-4" />
                        )}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() =>
                        updateState({
                          filters: {
                            ...state.filters,
                            assigned: state.workspaceMembers.map((m) => m.id),
                            showUnassignedOnly: false,
                          },
                        })
                      }
                      className="text-xs"
                    >
                      <Users className="h-4 w-4 mr-2" />
                      Assigned tasks
                      {state.filters.assigned.length ===
                        state.workspaceMembers.length &&
                        !state.filters.showUnassignedOnly && (
                          <CheckIcon className="ml-auto h-4 w-4" />
                        )}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() =>
                        updateState({
                          filters: {
                            ...state.filters,
                            assigned: [],
                            showUnassignedOnly: true,
                          },
                        })
                      }
                      className="text-xs"
                    >
                      <CircleUserRound className="h-4 w-4 mr-2" />
                      Unassigned
                      {state.filters.showUnassignedOnly && (
                        <CheckIcon className="ml-auto h-4 w-4" />
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {state.workspaceMembers.map((member) => (
                      <DropdownMenuItem
                        key={member.id}
                        onClick={() => {
                          const isSelected = state.filters.assigned.includes(
                            member.id
                          );
                          updateState({
                            filters: {
                              ...state.filters,
                              assigned: isSelected
                                ? state.filters.assigned.filter(
                                    (id) => id !== member.id
                                  )
                                : [...state.filters.assigned, member.id],
                              showUnassignedOnly: false,
                            },
                          });
                        }}
                        className="text-xs flex items-center justify-between"
                      >
                        <div className="flex items-center">
                          <Avatar className="h-4 w-4 mr-2">
                            <AvatarImage
                              src={member.avatar_url ?? undefined}
                              alt={member.full_name || "User"}
                            />
                            <AvatarFallback className="text-xs">
                              {getAvatarInitials(
                                member.full_name,
                                member.email
                              )}
                            </AvatarFallback>
                          </Avatar>
                          <span>{member.full_name}</span>
                        </div>
                        {state.filters.assigned.includes(member.id) && (
                          <CheckIcon className="h-4 w-4" />
                        )}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      {renderCurrentView()}

      {/* Modals */}
      <CreateTaskModal
        open={state.createTaskModalOpen}
        onOpenChange={(open) => {
          updateState({
            createTaskModalOpen: open,
            subtaskParentId: open ? state.subtaskParentId : undefined,
          });
        }}
        onSuccess={taskOperations.handleTaskCreated}
        workspace={workspace}
        space={space}
        project={project}
        statuses={state.statuses}
        tags={state.tags}
        parentTaskId={state.subtaskParentId}
      />

      <CreateStatusModal
        open={state.createStatusModalOpen}
        onOpenChange={(open) => updateState({ createStatusModalOpen: open })}
        onSuccess={taskOperations.handleStatusCreated}
        workspace={workspace}
        space={space}
        project={project}
        statusTypes={state.statusTypes}
      />

      <StatusSettingsModal
        open={state.statusSettingsModalOpen}
        onOpenChange={(open) => updateState({ statusSettingsModalOpen: open })}
        status={state.statusToEdit}
        onSave={taskOperations.handleUpdateStatusSettings}
        statusTypes={state.statusTypes}
        workspace={workspace}
        space={space}
        project={project}
      />

      <FilterModal
        open={state.filterModalOpen}
        onOpenChange={(open) => updateState({ filterModalOpen: open })}
        filters={state.filters}
        onFiltersChange={(filters) => updateState({ filters })}
        statuses={state.statuses}
        tags={state.tags}
        workspaceMembers={state.workspaceMembers}
      />

      {state.view === "list" && (
        <CustomizeListModal
          open={state.customizeListModalOpen}
          onOpenChange={(open) => updateState({ customizeListModalOpen: open })}
          currentVisibleColumns={state.visibleColumns}
          onSave={(columns) => updateState({ visibleColumns: columns })}
        />
      )}

      <AlertDialog
        open={!!state.taskToDelete}
        onOpenChange={() => updateState({ taskToDelete: null })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              task "
              <span className="font-semibold">{state.taskToDelete?.name}</span>"
              and all its subtasks.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                state.taskToDelete &&
                taskOperations.handleDeleteTask(state.taskToDelete.id)
              }
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Rename Project Dialog */}
      <AlertDialog
        open={!!renameProjectId}
        onOpenChange={() => setRenameProjectId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rename Project</AlertDialogTitle>
            <AlertDialogDescription>
              Enter a new name for the project.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <input
              type="text"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter project name"
              autoFocus
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setRenameProjectId(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleRenameProject(renameProjectId!, renameValue)}
            >
              Rename
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Project Dialog */}
      <AlertDialog
        open={!!deleteProjectId}
        onOpenChange={() => setDeleteProjectId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              project "<span className="font-semibold">{project.name}</span>"
              and all its tasks, statuses, and related data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteProjectId(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleDeleteProject(deleteProjectId!)}
              disabled={isDeletingProject}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeletingProject ? "Deleting..." : "Delete Project"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
