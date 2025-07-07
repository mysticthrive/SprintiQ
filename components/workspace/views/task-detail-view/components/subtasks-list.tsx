"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Plus,
  CheckSquare,
  Square,
  Trash2,
  Flag,
  CalendarIcon,
  GitBranch,
  Goal,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { getAvatarInitials } from "@/lib/utils";
import { priorityConfig } from "../../project/types";
import { getCompletedStatus } from "../utils";
import type { SubtasksListProps } from "../types";

export function SubtasksList({
  subtasks,
  statuses,
  workspaceMembers,
  workspace,
  completedSubtasks,
  isAddingSubtask,
  newSubtaskName,
  loading,
  deleteDialogOpen,
  onAddSubtask,
  onToggleAddSubtask,
  onNewSubtaskNameChange,
  onHandleAddSubtask,
  onToggleSubtaskComplete,
  onDeleteSubtask,
  onUpdateSubtaskAssignee,
  onUpdateSubtaskPriority,
  onUpdateSubtaskDueDate,
  onSetDeleteDialogOpen,
}: SubtasksListProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium workspace-sidebar-text">
          Subtasks
          <span className="ml-2 text-sm font-normal workspace-sidebar-text">
            {completedSubtasks}/{subtasks.length}
          </span>
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={onAddSubtask}
          className="workspace-sidebar-text"
        >
          <Plus className="h-4 w-4" />
          Add Task
        </Button>
      </div>

      <div className="workspace-sidebar-bg border workspace-border rounded-lg workspace-sidebar-text">
        {/* Subtasks Header */}
        <div className="grid grid-cols-12 gap-4 p-3 border-b workspace-border text-xs font-medium workspace-sidebar-text uppercase tracking-wide">
          <div className="col-span-4">Name</div>
          <div className="col-span-3">Assignee</div>
          <div className="col-span-2">Priority</div>
          <div className="col-span-2">Due date</div>
          <div className="col-span-1">Actions</div>
        </div>

        {/* Subtasks List */}
        <div>
          {subtasks.map((subtask) => {
            const completedStatus = getCompletedStatus(statuses);
            const isCompleted = subtask.status_id === completedStatus?.id;

            return (
              <div
                key={subtask.id}
                className="grid grid-cols-12 gap-4 p-3 hover:workspace-hover border-b workspace-border last:border-b-0 cursor-pointer"
                onClick={(e) => {
                  if (
                    e.target instanceof HTMLElement &&
                    e.target.closest("button")
                  )
                    return;
                  window.location.href = `/${workspace.workspace_id}/task/${subtask.task_id}`;
                }}
              >
                <div className="col-span-4 flex items-center space-x-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleSubtaskComplete(subtask);
                    }}
                    className="flex-shrink-0"
                  >
                    {isCompleted ? (
                      <CheckSquare className="h-4 w-4 text-green-600" />
                    ) : (
                      <Square className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                  <span
                    className={`text-sm ${isCompleted ? "line-through" : ""}`}
                  >
                    {subtask.name}
                  </span>
                </div>
                <div className="col-span-3 flex items-center">
                  {subtask.assignee ? (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 p-1 workspace-sidebar-text hover:workspace-hover"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Avatar className="h-4 w-4 mr-1">
                            <AvatarImage
                              src={subtask.assignee.avatar_url ?? undefined}
                              alt={subtask.assignee.full_name || "User"}
                            />
                            <AvatarFallback className="text-xs workspace-component-bg workspace-component-active-color">
                              {getAvatarInitials(
                                subtask.assignee.full_name,
                                subtask.assignee.email
                              )}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs truncate max-w-[80px]">
                            {subtask.assignee.full_name}
                          </span>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[200px] p-0">
                        <Command>
                          <CommandInput placeholder="Search user..." />
                          <CommandList>
                            <CommandEmpty>No users found.</CommandEmpty>
                            <CommandGroup>
                              <CommandItem
                                onSelect={() =>
                                  onUpdateSubtaskAssignee(subtask.id, null)
                                }
                                className="flex items-center justify-between text-red-600"
                              >
                                <span>Remove assignee</span>
                              </CommandItem>
                              {workspaceMembers
                                .filter(
                                  (member) => member.id !== subtask.assignee_id
                                )
                                .map((member) => (
                                  <CommandItem
                                    key={member.id}
                                    onSelect={() =>
                                      onUpdateSubtaskAssignee(
                                        subtask.id,
                                        member.id
                                      )
                                    }
                                    className="flex items-center justify-between"
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
                                  </CommandItem>
                                ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  ) : (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 p-1 workspace-sidebar-text hover:workspace-hover"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[200px] p-0">
                        <Command>
                          <CommandInput placeholder="Search user..." />
                          <CommandList>
                            <CommandEmpty>No users found.</CommandEmpty>
                            <CommandGroup>
                              {workspaceMembers.map((member) => (
                                <CommandItem
                                  key={member.id}
                                  onSelect={() =>
                                    onUpdateSubtaskAssignee(
                                      subtask.id,
                                      member.id
                                    )
                                  }
                                  className="flex items-center justify-between"
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
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  )}
                </div>
                <div className="col-span-2 flex items-center">
                  <Select
                    value={subtask.priority || "none"}
                    onValueChange={(value) =>
                      onUpdateSubtaskPriority(
                        subtask.id,
                        value === "none" ? "" : value
                      )
                    }
                  >
                    <SelectTrigger
                      className="h-6 text-xs workspace-header-bg border border-transparent hover:workspace-hover"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <SelectValue>
                        {subtask.priority ? (
                          <div className="flex items-center gap-1">
                            <Goal
                              className={`w-3 h-3 ${
                                priorityConfig[
                                  subtask.priority as keyof typeof priorityConfig
                                ]?.color
                              }`}
                            />
                            <span className="text-xs">
                              {
                                priorityConfig[
                                  subtask.priority as keyof typeof priorityConfig
                                ]?.label
                              }
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-500">
                            Priority
                          </span>
                        )}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="workspace-header-bg">
                      <SelectItem
                        value="none"
                        className="hover:workspace-hover cursor-pointer"
                      >
                        <span className="text-xs text-gray-500">
                          No priority
                        </span>
                      </SelectItem>
                      {Object.entries(priorityConfig).map(([key, config]) => (
                        <SelectItem
                          key={key}
                          value={key}
                          className="hover:workspace-hover cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <Goal className={`w-3 h-3 ${config.color}`} />
                            <span className="text-xs">{config.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2 flex items-center">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="ghost"
                        className="h-6 p-1 text-xs workspace-sidebar-text hover:workspace-hover"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <CalendarIcon className="h-3 w-3 text-gray-400 mr-1" />
                        <span>
                          {subtask.due_date
                            ? format(parseISO(subtask.due_date), "MMM d")
                            : "Due date"}
                        </span>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={
                          subtask.due_date
                            ? parseISO(subtask.due_date)
                            : undefined
                        }
                        onSelect={(date) =>
                          onUpdateSubtaskDueDate(subtask.id, date)
                        }
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="col-span-1 flex items-center justify-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSetDeleteDialogOpen(subtask.id);
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            );
          })}

          {/* Add Subtask Row */}
          {isAddingSubtask && (
            <div className="grid grid-cols-12 gap-4 p-3 border-b workspace-border">
              <div className="col-span-4 flex items-center space-x-2">
                <Square className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <Input
                  value={newSubtaskName}
                  onChange={(e) => onNewSubtaskNameChange(e.target.value)}
                  placeholder="Subtask name"
                  className="border-none p-0 focus:ring-0 bg-transparent"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      onHandleAddSubtask();
                    } else if (e.key === "Escape") {
                      onToggleAddSubtask(false);
                      onNewSubtaskNameChange("");
                    }
                  }}
                  autoFocus
                />
              </div>
              <div className="col-span-8 flex items-center justify-end space-x-2">
                <Button
                  size="sm"
                  onClick={onHandleAddSubtask}
                  disabled={loading}
                >
                  Add
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    onToggleAddSubtask(false);
                    onNewSubtaskNameChange("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Empty State */}
          {subtasks.length === 0 && !isAddingSubtask && (
            <div className="p-8 text-center workspace-sidebar-text text-xs">
              <GitBranch className="h-8 w-8 mx-auto mb-4 text-gray-300" />
              <p>No subtasks yet. Add one to break down this task.</p>
            </div>
          )}
        </div>
      </div>

      {/* Delete Subtask Dialog */}
      <Dialog
        open={!!deleteDialogOpen}
        onOpenChange={(open) => !open && onSetDeleteDialogOpen(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Subtask</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "
              {deleteDialogOpen
                ? subtasks.find((st) => st.id === deleteDialogOpen)?.name
                : ""}
              "? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => onSetDeleteDialogOpen(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (deleteDialogOpen) {
                  onDeleteSubtask(deleteDialogOpen);
                  onSetDeleteDialogOpen(null);
                }
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
