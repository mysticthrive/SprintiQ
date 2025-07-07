import React from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import {
  SortableContext,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { TaskCard } from "../components/TaskCard";
import { StatusColumn } from "../components/StatusColumn";

interface BoardViewProps {
  state: any;
  updateState: (updates: any) => void;
  taskOperations: any;
  getTaskSubtasks: (taskId: string) => any[];
  handleTaskClick: (task: any) => void;
  toggleTaskExpansion: (taskId: string, e: React.MouseEvent) => void;
  handleCreateSubtask: (parentId: string) => void;
  handleDeleteTask: (task: any) => void;
  tasks: any[];
  onOpenStatusSettings?: (status: any) => void;
}

export const BoardView: React.FC<BoardViewProps> = ({
  state,
  updateState,
  taskOperations,
  getTaskSubtasks,
  handleTaskClick,
  toggleTaskExpansion,
  handleCreateSubtask,
  handleDeleteTask,
  tasks,
  onOpenStatusSettings,
}) => {
  if (state.isLoading) {
    return (
      <div className="flex-1 overflow-auto p-6">
        <div className="flex space-x-6 min-w-max">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="w-80 flex-shrink-0">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 workspace-secondary-sidebar-bg rounded-full animate-pulse" />
                  <div className="h-4 w-20 workspace-secondary-sidebar-bg rounded animate-pulse" />
                  <div className="h-4 w-6 workspace-secondary-sidebar-bg rounded animate-pulse" />
                </div>
              </div>
              <div className="space-y-3">
                {[1, 2, 3].map((j) => (
                  <div
                    key={j}
                    className="border workspace-border rounded-lg p-4"
                  >
                    <div className="h-4 w-3/4 workspace-secondary-sidebar-bg rounded animate-pulse mb-2" />
                    <div className="h-3 w-full workspace-secondary-sidebar-bg rounded animate-pulse mb-2" />
                    <div className="h-3 w-2/3 workspace-secondary-sidebar-bg rounded animate-pulse mb-3" />
                    <div className="flex items-center justify-between">
                      <div className="w-6 h-6 workspace-secondary-sidebar-bg rounded-full animate-pulse" />
                      <div className="h-3 w-12 workspace-secondary-sidebar-bg rounded animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto p-3 h-full">
      <div className="flex space-x-3 min-w-max">
        <SortableContext
          items={state.statuses.map((s: any) => s.id)}
          strategy={horizontalListSortingStrategy}
        >
          {state.statuses.map((status: any) => {
            const statusTasks = tasks.filter(
              (t: any) => t.status_id === status.id && !t.parent_task_id
            );
            return (
              <StatusColumn
                key={status.id}
                status={status}
                tasks={statusTasks}
                onCreateTask={() => updateState({ createTaskModalOpen: true })}
                onRenameStatus={taskOperations.handleRenameStatus}
                onOpenStatusSettings={onOpenStatusSettings}
              >
                {statusTasks.map((task: any) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    subtasks={getTaskSubtasks(task.id)}
                    isExpanded={state.expandedTasks.has(task.id)}
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
                ))}
              </StatusColumn>
            );
          })}
        </SortableContext>

        <Button
          variant="ghost"
          className="w-80 p-2 border-2 border-dashed workspace-border hover:workspace-hover"
          onClick={() => updateState({ createStatusModalOpen: true })}
        >
          <Plus className="h-4 w-4" />
          Add Status
        </Button>
      </div>
    </div>
  );
};
