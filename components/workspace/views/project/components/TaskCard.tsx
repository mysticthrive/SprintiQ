import React, { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Plus,
  Edit,
  MoreHorizontal,
  ChevronDown,
  ChevronRight,
  CheckSquare,
  CalendarIcon,
  Flag,
  CircleUserRound,
  GitBranch,
  CheckIcon,
  Link,
  Trash,
  Move,
  Goal,
} from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { DatePicker } from "@/components/workspace/components/date-picker";
import { getAvatarInitials } from "@/lib/utils";
import { priorityConfig } from "../types";
import type { TaskCardProps } from "../types";
import { formatDateRange, copyTaskLink } from "../utils";
import { SubtaskCard } from "./SubtaskCard";
import { tagColorClasses } from "../../task-detail-view/utils";
import { stripFormatting } from "../utils";

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  isDragging = false,
  subtasks,
  isExpanded,
  workspaceMembers,
  onToggleExpansion,
  onTaskClick,
  onRenameTask,
  onUpdatePriority,
  onUpdateDates,
  onAssignTask,
  onDeleteTask,
  onCreateSubtask,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: task.id });

  const [isRenaming, setIsRenaming] = useState(false);
  const [taskNameInput, setTaskNameInput] = useState(task.name);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging || isSortableDragging ? 0.5 : 1,
  };

  const handleRenameBlur = () => {
    if (taskNameInput.trim() !== task.name) {
      onRenameTask(task.id, taskNameInput.trim());
    }
    setIsRenaming(false);
  };

  const handleRenameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.currentTarget.blur();
    } else if (e.key === "Escape") {
      setTaskNameInput(task.name);
      setIsRenaming(false);
    }
  };

  const handleCopyLink = () => {
    copyTaskLink(task.task_id, task.workspace_id || "");
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`workspace-secondary-sidebar-bg border workspace-border rounded-lg hover:shadow-md transition-shadow ${
        isDragging ? "shadow-lg" : ""
      }`}
    >
      <div
        className="p-3 cursor-grab active:cursor-grabbing"
        onClick={(e) => {
          if (!isDragging && !isSortableDragging && !isRenaming) {
            e.stopPropagation();
            onTaskClick(task);
          }
        }}
      >
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center space-x-2 flex-grow h-6">
            <CheckSquare className="h-4 w-4 text-gray-400" />
            {isRenaming ? (
              <Input
                value={taskNameInput}
                onChange={(e) => setTaskNameInput(e.target.value)}
                onBlur={handleRenameBlur}
                onKeyDown={handleRenameKeyDown}
                autoFocus
                className="text-sm font-medium text-gray-900 h-8"
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <h4 className="font-medium workspace-sidebar-text text-sm truncate max-w-[230px]">
                {task.name}
              </h4>
            )}
          </div>
          <div className="flex items-center space-x-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <MoreHorizontal className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onCreateSubtask(task.id);
                  }}
                  className="cursor-pointer hover:workspace-hover"
                >
                  <Plus className="h-3 w-3" />
                  Create sub task
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsRenaming(true);
                  }}
                  className="cursor-pointer hover:workspace-hover"
                >
                  <Edit className="h-3 w-3" />
                  Rename
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleCopyLink}
                  className="cursor-pointer hover:workspace-hover"
                >
                  <Link className="h-3 w-3" />
                  Copy link
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer hover:workspace-hover">
                  <Move className="h-3 w-3" />
                  Move
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-red-600 cursor-pointer hover:workspace-hover"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteTask(task);
                  }}
                >
                  <Trash className="h-3 w-3" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {task.description && (
          <p className="text-xs workspace-sidebar-text mb-3 line-clamp-2">
            {stripFormatting(task.description)}
          </p>
        )}

        {task.task_tags && task.task_tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {task.task_tags.map((taskTag: any) => (
              <span
                key={taskTag.tag.id}
                className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${
                  tagColorClasses[taskTag.tag.color]
                } group relative`}
              >
                {taskTag.tag.name}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2">
          {/* Assignee */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => e.stopPropagation()}
                className="h-auto p-0 text-xs text-gray-500 hover:workspace-hover"
              >
                <div className="flex items-center justify-center">
                  {task.assignee ? (
                    <Avatar className="h-6 w-6">
                      <AvatarImage
                        src={task.assignee?.avatar_url ?? undefined}
                        alt={task.assignee?.full_name || "User"}
                      />
                      <AvatarFallback className="text-xs workspace-component-bg workspace-component-active-color">
                        {getAvatarInitials(
                          task.assignee?.full_name,
                          task.assignee?.email
                        )}
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    <div className="h-6 w-6 border workspace-border flex items-center justify-center rounded-sm">
                      <CircleUserRound className="h-3 w-3 workspace-sidebar-text" />
                    </div>
                  )}
                </div>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0">
              <Command>
                <CommandInput placeholder="Search user..." />
                <CommandList>
                  <CommandEmpty>No users found.</CommandEmpty>
                  <CommandGroup>
                    <CommandItem
                      onSelect={() => onAssignTask(task.id, null)}
                      className="flex items-center justify-between cursor-pointer"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span>Unassign</span>
                      {!task.assignee_id && (
                        <CheckIcon className="ml-auto h-4 w-4" />
                      )}
                    </CommandItem>
                    {workspaceMembers.map((member) => (
                      <CommandItem
                        key={member.id}
                        onSelect={() => onAssignTask(task.id, member.id)}
                        className="flex items-center justify-between cursor-pointer"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center space-x-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs">
                              {getAvatarInitials(
                                member.full_name,
                                member.email
                              )}
                            </AvatarFallback>
                          </Avatar>
                          <span>{member.full_name}</span>
                        </div>
                        {task.assignee_id === member.id && (
                          <CheckIcon className="ml-auto h-4 w-4" />
                        )}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          {/* Date picker */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-auto p-1 flex items-center justify-center text-xs hover:workspace-hover border workspace-border rounded-sm"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center">
                  <CalendarIcon className="h-4 w-4 workspace-sidebar-text" />
                  <span
                    className={`workspace-sidebar-text ${
                      task.due_date || task.start_date ? "ml-1" : ""
                    }`}
                  >
                    {formatDateRange(
                      task.start_date || undefined,
                      task.due_date || undefined
                    )}
                  </span>
                </div>
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-auto p-0"
              align="start"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-3">
                <div className="space-y-4">
                  <DatePicker
                    startDate={task.start_date}
                    dueDate={task.due_date}
                    onDateChange={(startDate, dueDate) =>
                      onUpdateDates(task.id, startDate, dueDate)
                    }
                  />
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Priority */}
          {task.priority ? (
            <Popover>
              <PopoverTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-1 flex items-center justify-center text-xs hover:workspace-hover border workspace-border rounded-sm"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Goal
                    className={`w-4 h-4 ${
                      priorityConfig[
                        task.priority as keyof typeof priorityConfig
                      ]?.color
                    }`}
                  />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-[200px] p-0"
                onClick={(e) => e.stopPropagation()}
              >
                <Command>
                  <CommandInput placeholder="Set priority..." />
                  <CommandList>
                    <CommandEmpty>No priority found.</CommandEmpty>
                    <CommandGroup>
                      <CommandItem
                        onSelect={() => onUpdatePriority(task.id, null)}
                        className="flex items-center justify-between cursor-pointer"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <span>No priority</span>
                        {!task.priority && (
                          <CheckIcon className="ml-auto h-4 w-4" />
                        )}
                      </CommandItem>
                      {Object.entries(priorityConfig).map(([key, config]) => (
                        <CommandItem
                          key={key}
                          onSelect={() => onUpdatePriority(task.id, key)}
                          className="flex items-center justify-between cursor-pointer"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center">
                            <Goal className={`h-4 w-4 mr-2 ${config.color}`} />
                            <span>{config.label}</span>
                          </div>
                          {task.priority === key && (
                            <CheckIcon className="ml-auto h-4 w-4" />
                          )}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-1 flex items-center justify-center text-xs hover:workspace-hover border workspace-border rounded-sm"
              onClick={() => onUpdatePriority(task.id, "medium")}
            >
              <Goal className="w-4 h-4 workspace-sidebar-text" />
            </Button>
          )}
        </div>
      </div>

      {subtasks.length > 0 && (
        <div className="border-t workspace-border px-2 py-1">
          <button
            className="w-full p-1 flex items-center rounded-md justify-between text-sm text-gray-600 hover:workspace-hover text-xs workspace-sidebar-text"
            onClick={(e) => onToggleExpansion(task.id, e)}
          >
            <div className="flex items-center gap-1">
              <GitBranch className="h-4 w-4 workspace-sidebar-text" />
              <span>{subtasks.length} subtasks</span>
            </div>
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>

          {isExpanded && (
            <div className="p-2 space-y-2">
              {subtasks.map((subtask) => (
                <SubtaskCard
                  key={subtask.id}
                  subtask={subtask}
                  workspaceMembers={workspaceMembers}
                  onTaskClick={onTaskClick}
                  onUpdatePriority={onUpdatePriority}
                  onUpdateDates={onUpdateDates}
                  onAssignTask={onAssignTask}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
