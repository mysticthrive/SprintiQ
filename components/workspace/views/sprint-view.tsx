"use client";

import React, { useCallback, useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  Target,
  Kanban,
  CirclePlay,
  FolderKanban,
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
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
import { getIconColor } from "@/lib/utils";
import CreateTaskModal from "@/components/workspace/modals/create-task-modal";
import CreateStatusModal from "@/components/workspace/modals/create-status-modal";
import CustomizeListModal from "@/components/workspace/modals/customize-list-modal";
import RenameSprintModal from "@/components/workspace/modals/rename-sprint-modal";
import MoveSprintModal from "@/components/workspace/modals/move-sprint-modal";
import SprintInfoModal from "@/components/workspace/modals/sprint-info-modal";
import FilterModal from "@/components/workspace/modals/filter-modal";
import StatusSettingsModal from "@/components/workspace/modals/status-settings-modal";

// Import our custom hooks and components
import { useSprintData } from "./sprint/hooks/useSprintData";
import { useTaskOperations } from "./sprint/hooks/useTaskOperations";
import { useRealtimeSubscriptions } from "./sprint/hooks/useRealtimeSubscriptions";
import { TaskCard } from "./sprint/components/TaskCard";
import { StatusColumn } from "./sprint/components/StatusColumn";
import { BoardView } from "./sprint/views/BoardView";
import { ListView } from "./sprint/views/ListView";
import type { SprintViewProps, ViewMode } from "./sprint/types";
import { getSubtasksForTask } from "./sprint/utils";
import { format } from "date-fns";
import { useEnhancedToast } from "@/hooks/use-enhanced-toast";

export default function SprintView({
  workspace,
  space,
  sprintFolder,
  sprint,
  tasks: initialTasks,
  statuses: initialStatuses,
  tags: initialTags,
}: SprintViewProps) {
  const router = useRouter();
  const { toast } = useEnhancedToast();
  const [isFavorited, setIsFavorited] = useState(false);
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [filters, setFilters] = useState({
    status: [] as string[],
    tags: [] as string[],
    priority: [] as string[],
    assigned: [] as string[],
    sprintPoints: { min: 0, max: 100 },
  });

  // Check if sprint is favorited on mount
  useEffect(() => {
    const savedSprintFavorites = localStorage.getItem(
      `sprint_favorites_${workspace.id}`
    );
    if (savedSprintFavorites) {
      const favorites = JSON.parse(savedSprintFavorites);
      setIsFavorited(favorites.includes(sprint.id));
    }
  }, [sprint.id, workspace.id]);

  // Custom hooks
  const {
    state,
    updateState,
    supabase,
    refreshTasks,
    refreshStatuses,
    loadAllSubtasks,
    createEventLog,
  } = useSprintData({
    workspace,
    space,
    sprintFolder,
    sprint,
    initialTasks,
    initialStatuses,
    initialTags,
  });

  // Always fetch latest statuses (with status_type) on mount
  useEffect(() => {
    refreshStatuses();
  }, [refreshStatuses]);

  const taskOperations = useTaskOperations({
    state,
    updateState,
    supabase,
    refreshTasks,
    refreshStatuses,
    loadAllSubtasks,
    createEventLog,
    workspace,
    space,
    sprint,
  });

  // Realtime subscriptions
  useRealtimeSubscriptions({
    supabase,
    workspace,
    sprint,
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

  const handleTaskClick = useCallback(
    (task: any) => {
      if (!task.task_id) {
        console.error("Task task_id is missing:", task);
        return;
      }

      router.push(`/${workspace.workspace_id}/task/${task.task_id}`);
    },
    [router, workspace.workspace_id]
  );

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const { active } = event;
      const draggedTask = state.tasks.find((t) => t.id === active.id);
      const draggedStatus = state.statuses.find((s) => s.id === active.id);

      if (draggedTask) {
        updateState({ activeTask: draggedTask, activeStatus: null });
      } else if (draggedStatus) {
        updateState({ activeStatus: draggedStatus, activeTask: null });
      }
    },
    [state.tasks, state.statuses, updateState]
  );

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      updateState({ activeTask: null, activeStatus: null });

      if (over) {
        await taskOperations.handleDragEnd(active, over);
      }
    },
    [taskOperations, updateState]
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

  // Sprint action handlers
  const handleRenameSprint = useCallback(
    (updatedSprint: any) => {
      toast({
        title: "Sprint renamed",
        description: `Sprint has been renamed to "${updatedSprint.name}".`,
        browserNotificationTitle: "Sprint renamed",
        browserNotificationBody: `Sprint has been renamed to "${updatedSprint.name}".`,
      });
      window.location.reload();
    },
    [toast]
  );

  const handleMoveSprint = useCallback(
    async (updatedSprint: any) => {
      try {
        // Fetch the target sprint folder details to get the sprint_folder_id
        const { data: targetSprintFolder, error } = await supabase
          .from("sprint_folders")
          .select("sprint_folder_id, space_id")
          .eq("id", updatedSprint.sprint_folder_id)
          .single();

        if (error) {
          throw error;
        }

        // Construct the new URL path
        const newUrl = `/${workspace.workspace_id}/space/${space.space_id}/sf/${targetSprintFolder.sprint_folder_id}/s/${sprint.sprint_id}`;

        toast({
          title: "Sprint moved",
          description: `Sprint "${updatedSprint.name}" has been moved successfully.`,
          browserNotificationTitle: "Sprint moved",
          browserNotificationBody: `Sprint "${updatedSprint.name}" has been moved successfully.`,
        });

        // Redirect to the new sprint location
        router.push(newUrl);
      } catch (error: any) {
        console.error("Error fetching sprint folder details:", error);
        toast({
          title: "Error moving sprint",
          description:
            "Sprint was moved but there was an error redirecting. Please refresh the page.",
          variant: "destructive",
        });
        // Fallback to page refresh
        window.location.reload();
      }
    },
    [
      supabase,
      workspace.workspace_id,
      space.space_id,
      sprint.sprint_id,
      router,
      toast,
    ]
  );

  const handleCopyLink = useCallback(() => {
    const sprintUrl = `${window.location.origin}/${workspace.workspace_id}/space/${space.space_id}/sf/${sprintFolder.sprint_folder_id}/s/${sprint.sprint_id}`;
    navigator.clipboard.writeText(sprintUrl);
    toast({
      title: "Link copied",
      description: "Sprint link has been copied to clipboard.",
      browserNotificationTitle: "Link copied",
      browserNotificationBody: "Sprint link has been copied to clipboard.",
    });
  }, [
    workspace.workspace_id,
    space.space_id,
    sprintFolder.sprint_folder_id,
    sprint.sprint_id,
    toast,
  ]);

  const handleAddToFavorites = useCallback(() => {
    try {
      // Get current sprint favorites from localStorage
      const savedSprintFavorites = localStorage.getItem(
        `sprint_favorites_${workspace.id}`
      );
      const currentFavorites = savedSprintFavorites
        ? new Set(JSON.parse(savedSprintFavorites))
        : new Set();

      // Toggle the sprint in favorites
      const newFavorites = new Set(currentFavorites);
      if (newFavorites.has(sprint.id)) {
        newFavorites.delete(sprint.id);
        setIsFavorited(false);
        toast({
          title: "Removed from favorites",
          description: `Sprint "${sprint.name}" has been removed from favorites.`,
          browserNotificationTitle: "Removed from favorites",
          browserNotificationBody: `Sprint "${sprint.name}" has been removed from favorites.`,
        });
      } else {
        newFavorites.add(sprint.id);
        setIsFavorited(true);
        toast({
          title: "Added to favorites",
          description: `Sprint "${sprint.name}" has been added to favorites.`,
          browserNotificationTitle: "Added to favorites",
          browserNotificationBody: `Sprint "${sprint.name}" has been added to favorites.`,
        });
      }

      // Save to localStorage
      localStorage.setItem(
        `sprint_favorites_${workspace.id}`,
        JSON.stringify([...newFavorites])
      );
    } catch (error) {
      console.error("Error updating sprint favorites:", error);
      toast({
        title: "Error updating favorites",
        description: "Failed to update favorites.",
        variant: "destructive",
      });
    }
  }, [sprint.id, sprint.name, workspace.id, toast]);

  const handleDeleteSprint = useCallback(async () => {
    try {
      const { error } = await supabase
        .from("sprints")
        .delete()
        .eq("id", sprint.id);

      if (error) {
        throw error;
      }

      toast({
        title: "Sprint deleted",
        description: `Sprint "${sprint.name}" has been deleted successfully.`,
        browserNotificationTitle: "Sprint deleted",
        browserNotificationBody: `Sprint "${sprint.name}" has been deleted successfully.`,
      });

      // Redirect to the sprint folder
      router.push(
        `/${workspace.workspace_id}/space/${space.space_id}/sf/${sprintFolder.sprint_folder_id}`
      );
    } catch (error: any) {
      console.error("Error deleting sprint:", error);
      toast({
        title: "Error deleting sprint",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    }
  }, [
    supabase,
    sprint.id,
    sprint.name,
    workspace.workspace_id,
    space.space_id,
    sprintFolder.sprint_folder_id,
    router,
    toast,
  ]);

  const handleDeleteSprintClick = useCallback(() => {
    updateState({ sprintToDelete: sprint });
  }, [sprint, updateState]);

  // Filtered tasks
  const filteredTasks = useMemo(() => {
    return state.tasks.filter((task) => {
      // Status filter
      if (
        filters.status.length &&
        !filters.status.includes(String(task.status_id))
      )
        return false;
      // Tags filter
      if (
        filters.tags.length &&
        (!task.task_tags ||
          !task.task_tags.some((tt: any) => filters.tags.includes(tt.tag.id)))
      )
        return false;
      // Priority filter
      if (filters.priority.length && !filters.priority.includes(task.priority))
        return false;
      // Assigned filter
      if (
        filters.assigned.length &&
        !filters.assigned.includes(String(task.assignee_id))
      )
        return false;
      // Sprint points filter (if present)
      if (typeof (task as any).sprint_points === "number") {
        const points = (task as any).sprint_points;
        if (
          points < filters.sprintPoints.min ||
          points > filters.sprintPoints.max
        )
          return false;
      }
      return true;
    });
  }, [state.tasks, filters]);

  // Add handler for status settings modal
  const handleOpenStatusSettings = useCallback(
    (status: any) => {
      updateState({ statusSettingsModalOpen: true, statusToEdit: status });
    },
    [updateState]
  );

  // Handler for inline rename in ListView
  const handleRenameStatus = useCallback(
    (status: any) => {
      updateState({ statusToEdit: status, renamingStatusId: status.id });
    },
    [updateState]
  );

  // Handler for opening status settings modal from ListView
  const handleEditStatus = useCallback(
    (status: any) => {
      updateState({ statusSettingsModalOpen: true, statusToEdit: status });
    },
    [updateState]
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
            <BoardView
              {...commonProps}
              filteredTasks={filteredTasks}
              onOpenStatusSettings={handleOpenStatusSettings}
            />
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
                    tasks={state.tasks.filter(
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
            filteredTasks={filteredTasks}
            handleRenameStatus={handleRenameStatus}
            handleEditStatus={handleEditStatus}
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
        <div className="p-3 border-b workspace-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 workspace-component-bg rounded-md items-center flex justify-center">
                <CirclePlay className="w-4 w-4 workspace-component-active-color" />
              </div>
              <div>
                <span className="text-sm">{sprint.name}</span>
                <div className="flex items-center space-x-1 text-xs">
                  <div
                    className={`w-4 h-4 rounded-sm flex-shrink-0 flex items-center justify-center ${getIconColor(
                      space.icon
                    )}`}
                  >
                    <span className="text-[10px] font-bold text-white">
                      {space.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="font-medium">{space.name}</span>
                  <span>➙ in ➙</span>
                  <FolderKanban className="w-4 w-4" />
                  <span className="font-medium">{sprintFolder.name}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                className="text-muted-foreground h-7 p-2 text-xs"
                onClick={() => router.push(`/${workspace.workspace_id}/agents`)}
              >
                <Brain className="h-4 w-4" />
                Agents
              </Button>
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
                    className="cursor-pointer text-xs hover:workspace-hover"
                    onClick={handleAddToFavorites}
                  >
                    <Star
                      className={`h-3 w-3 ${
                        isFavorited ? "fill-yellow-400 text-yellow-400" : ""
                      }`}
                    />
                    {isFavorited ? "Remove from favorites" : "Add to favorites"}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="cursor-pointer text-xs hover:workspace-hover"
                    onClick={() => updateState({ renameSprintModalOpen: true })}
                  >
                    <Edit className="h-3 w-3" />
                    Rename
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="cursor-pointer text-xs hover:workspace-hover"
                    onClick={handleCopyLink}
                  >
                    <Link className="h-3 w-3" />
                    Copy link
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="cursor-pointer text-xs hover:workspace-hover"
                    onClick={() => updateState({ createTaskModalOpen: true })}
                  >
                    <Plus className="h-3 w-3" />
                    Create new task
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="cursor-pointer text-xs hover:workspace-hover"
                    onClick={() => updateState({ sprintInfoModalOpen: true })}
                  >
                    <Info className="h-3 w-3" />
                    Sprint info
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="cursor-pointer text-xs hover:workspace-hover"
                    onClick={() => updateState({ moveSprintModalOpen: true })}
                  >
                    <FolderInput className="h-3 w-3" />
                    Move
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-red-600 cursor-pointer text-xs hover:workspace-hover"
                    onClick={handleDeleteSprintClick}
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
        <div className="p-3">
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
              </div>

              {/* Sprint goal */}
              {sprint.goal && (
                <div className="flex items-center text-xs text-gray-600">
                  <Target className="h-3 w-3 mr-1" />
                  <span className="max-w-xs truncate">{sprint.goal}</span>
                </div>
              )}

              {/* Sprint dates */}
              {sprint.start_date && sprint.end_date && (
                <div className="flex items-center text-xs text-gray-600">
                  <CalendarIcon className="h-3 w-3 mr-1" />
                  <span>
                    {format(new Date(sprint.start_date), "MMM d")} -{" "}
                    {format(new Date(sprint.end_date), "MMM d, yyyy")}
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2">
              {state.view === "list" && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => updateState({ customizeListModalOpen: true })}
                  className="text-muted-foreground text-xs h-7 p-2 border border-transparent"
                >
                  <Settings className="h-4 w-4" />
                  Columns
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                className="text-muted-foreground h-7 p-2 text-xs border border-transparent"
                onClick={() => updateState({ createStatusModalOpen: true })}
              >
                <Plus className="h-4 w-4" />
                Add Status
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-muted-foreground h-7 p-2 text-xs border border-transparent"
                onClick={() => setFilterModalOpen(true)}
              >
                <Filter className="h-4 w-4" />
                Filter
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">{renderCurrentView()}</div>

      {/* Modals */}
      <CreateTaskModal
        open={state.createTaskModalOpen}
        onOpenChange={(open) => updateState({ createTaskModalOpen: open })}
        onSuccess={taskOperations.handleTaskCreated}
        workspace={workspace}
        space={space}
        project={undefined}
        sprint={sprint}
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
        project={undefined}
        sprint={sprint}
        statusTypes={state.statusTypes}
      />

      {/* Sprint Action Modals */}
      <RenameSprintModal
        open={state.renameSprintModalOpen}
        onOpenChange={(open) => updateState({ renameSprintModalOpen: open })}
        onSuccess={handleRenameSprint}
        sprint={sprint}
      />

      <MoveSprintModal
        open={state.moveSprintModalOpen}
        onOpenChange={(open) => updateState({ moveSprintModalOpen: open })}
        onSuccess={handleMoveSprint}
        sprint={sprint}
        currentSprintFolder={sprintFolder}
        workspace={workspace}
      />

      <SprintInfoModal
        open={state.sprintInfoModalOpen}
        onOpenChange={(open) => updateState({ sprintInfoModalOpen: open })}
        sprint={sprint}
        sprintFolder={sprintFolder}
        space={space}
        taskCount={state.tasks.length}
      />

      {state.view === "list" && (
        <CustomizeListModal
          open={state.customizeListModalOpen}
          onOpenChange={(open) => updateState({ customizeListModalOpen: open })}
          currentVisibleColumns={state.visibleColumns}
          onSave={(columns) => updateState({ visibleColumns: columns })}
        />
      )}

      {/* Delete Task Confirmation */}
      <AlertDialog
        open={!!state.taskToDelete}
        onOpenChange={(open) => !open && updateState({ taskToDelete: null })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Task</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{state.taskToDelete?.name}"? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (state.taskToDelete) {
                  taskOperations.handleDeleteTask(state.taskToDelete);
                  updateState({ taskToDelete: null });
                }
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Sprint Confirmation */}
      <AlertDialog
        open={!!state.sprintToDelete}
        onOpenChange={(open) => !open && updateState({ sprintToDelete: null })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Sprint</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{state.sprintToDelete?.name}"?
              This action cannot be undone and will also delete all tasks in
              this sprint.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (state.sprintToDelete) {
                  handleDeleteSprint();
                  updateState({ sprintToDelete: null });
                }
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Sprint
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <FilterModal
        open={filterModalOpen}
        onOpenChange={setFilterModalOpen}
        filters={filters}
        onFiltersChange={setFilters}
        statuses={state.statuses}
        tags={state.tags}
        workspaceMembers={state.workspaceMembers}
      />

      <StatusSettingsModal
        open={state.statusSettingsModalOpen}
        onOpenChange={(open) => updateState({ statusSettingsModalOpen: open })}
        status={state.statusToEdit}
        onSave={taskOperations.handleUpdateStatusSettings}
        statusTypes={state.statusTypes}
        workspace={workspace}
        space={space}
        project={null}
      />
    </div>
  );
}
