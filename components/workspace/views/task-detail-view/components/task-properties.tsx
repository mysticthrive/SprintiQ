"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
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
  CalendarIcon,
  Plus,
  Flag,
  CircleDot,
  Users,
  Clock,
  Tag,
  Goal,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { getAvatarInitials } from "@/lib/utils";
import { priorityConfig } from "../../project/types";
import { getStatusColor, tagColorClasses, colorMap } from "../utils";
import type { TaskPropertiesProps } from "../types";

export function TaskProperties({
  task,
  statuses,
  tags,
  workspaceMembers,
  taskAssignees,
  workspace,
  project,
  sprint,
  space,
  loading,
  onUpdateStatus,
  onUpdatePriority,
  onUpdateStartDate,
  onUpdateDueDate,
  onUpdateTimeEstimate,
  onAddAssignee,
  onRemoveAssignee,
  onAddTag,
  onRemoveTag,
  onCreateAndAssignTag,
}: TaskPropertiesProps) {
  const [startDateOpen, setStartDateOpen] = useState(false);
  const [dueDateOpen, setDueDateOpen] = useState(false);
  const [tagSearchValue, setTagSearchValue] = useState("");
  const [isCreatingTag, setIsCreatingTag] = useState(false);

  const handleStartDateChange = async (date: Date | undefined) => {
    await onUpdateStartDate(date);
    setStartDateOpen(false);
  };

  const handleDueDateChange = async (date: Date | undefined) => {
    await onUpdateDueDate(date);
    setDueDateOpen(false);
  };

  const handleCreateTag = async (tagName: string) => {
    if (isCreatingTag) return; // Prevent multiple calls

    const trimmedName = tagName.trim();
    if (!trimmedName) return;

    // Check for existing tag (case-insensitive)
    const existingTag = tags.find(
      (tag) => tag.name.toLowerCase() === trimmedName.toLowerCase()
    );

    if (existingTag) {
      // Tag already exists, just add it
      await onAddTag(existingTag.id);
      setTagSearchValue("");
      return;
    }

    // Create new tag
    setIsCreatingTag(true);
    try {
      await onCreateAndAssignTag(trimmedName);
      setTagSearchValue("");
    } catch (error) {
      console.error("Error creating tag:", error);
    } finally {
      setIsCreatingTag(false);
    }
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && tagSearchValue.trim() && !isCreatingTag) {
      e.preventDefault();
      handleCreateTag(tagSearchValue);
    }
  };

  return (
    <div className="w-72 workspace-header-bg border-r workspace-border p-3 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center mb-3">
        <span className="text-sm font-medium workspace-sidebar-text mb-4">
          Details
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Status */}
        <div className="mb-3">
          <div className="flex items-center mb-3 gap-2">
            <CircleDot className="w-4 h-4 workspace-sidebar-text" />
            <label className="text-xs font-medium workspace-sidebar-text uppercase">
              Status
            </label>
          </div>
          <Select
            value={task.status_id}
            onValueChange={onUpdateStatus}
            disabled={loading}
          >
            <SelectTrigger className="h-8 workspace-header-bg border border-transparent hover:workspace-hover">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="workspace-header-bg">
              {statuses
                .filter(
                  (status) =>
                    (status.type === "project" &&
                      project &&
                      status.project_id === project.id) ||
                    (status.type === "space" && status.space_id === space.id) ||
                    (status.type === "sprint" &&
                      sprint &&
                      status.sprint_id === sprint.id)
                )
                .map((status) => (
                  <SelectItem
                    key={status.id}
                    value={status.id}
                    className="hover:workspace-hover cursor-pointer"
                  >
                    <div className="flex items-center gap-2 text-xs">
                      <div
                        className={`w-2 h-2 rounded-full ${getStatusColor(
                          status
                        )}`}
                      />
                      <span className="text-xs truncate">{status.name}</span>
                    </div>
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        {/* Priority */}
        <div className="mb-3">
          <div className="flex items-center mb-3 gap-2">
            <Goal className="w-4 h-4 workspace-sidebar-text" />
            <label className="text-xs font-medium workspace-sidebar-text uppercase">
              Priority
            </label>
          </div>
          <Select
            value={task.priority || "none"}
            onValueChange={(value) =>
              onUpdatePriority(value === "none" ? "" : value)
            }
            disabled={loading}
          >
            <SelectTrigger className="h-8 workspace-header-bg border border-transparent hover:workspace-hover">
              <SelectValue>
                {task.priority ? (
                  <div className="flex items-center gap-2">
                    <Goal
                      className={`w-4 h-4 ${
                        priorityConfig[
                          task.priority as keyof typeof priorityConfig
                        ]?.color
                      }`}
                    />
                    <span className="text-xs">
                      {
                        priorityConfig[
                          task.priority as keyof typeof priorityConfig
                        ]?.label
                      }
                    </span>
                  </div>
                ) : (
                  <span className="text-xs text-gray-500">No priority</span>
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="workspace-header-bg">
              <SelectItem
                value="none"
                className="hover:workspace-hover cursor-pointer"
              >
                <span className="text-xs text-gray-500">No priority</span>
              </SelectItem>
              {Object.entries(priorityConfig).map(([key, config]) => (
                <SelectItem
                  key={key}
                  value={key}
                  className="hover:workspace-hover cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Goal className={`w-4 h-4 ${config.color}`} />
                    <span className="text-xs">{config.label}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Start Date */}
        <div className="mb-3">
          <div className="flex items-center mb-3 gap-2">
            <CalendarIcon className="w-4 h-4 workspace-sidebar-text" />
            <label className="text-xs font-medium workspace-sidebar-text uppercase">
              Start Date
            </label>
          </div>
          <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-start h-8 p-2 text-xs workspace-sidebar-text hover:workspace-hover border border-transparent"
              >
                <CalendarIcon className="h-4 w-4 text-gray-400" />
                <span className="workspace-sidebar-text">
                  {task.start_date
                    ? format(parseISO(task.start_date), "MMM d")
                    : "Set start date"}
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={
                  task.start_date ? parseISO(task.start_date) : undefined
                }
                onSelect={handleStartDateChange}
                disabled={loading}
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Due Date */}
        <div className="mb-3">
          <div className="flex items-center mb-3 gap-2">
            <CalendarIcon className="w-4 h-4 workspace-sidebar-text" />
            <label className="text-xs font-medium workspace-sidebar-text uppercase">
              Due Date
            </label>
          </div>
          <Popover open={dueDateOpen} onOpenChange={setDueDateOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-start h-8 p-2 text-xs workspace-sidebar-text hover:workspace-hover border border-transparent"
              >
                <CalendarIcon className="h-4 w-4 text-gray-400" />
                <span className="workspace-sidebar-text">
                  {task.due_date
                    ? format(parseISO(task.due_date), "MMM d")
                    : "Set due date"}
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={task.due_date ? parseISO(task.due_date) : undefined}
                onSelect={handleDueDateChange}
                disabled={loading}
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Assignees */}
        <div className="mb-6">
          <div className="flex items-center mb-3 gap-2">
            <Users className="w-4 h-4 workspace-sidebar-text" />
            <label className="text-xs font-medium workspace-sidebar-text uppercase">
              Assignees
            </label>
          </div>

          <div className="space-y-2">
            {taskAssignees.length > 0 ? (
              <div className="space-y-1">
                {taskAssignees.map((assignee) => (
                  <div
                    key={assignee.id}
                    className="flex items-center justify-between"
                  >
                    <div className="*:data-[slot=avatar]:ring-background flex -space-x-2 *:data-[slot=avatar]:ring-2 *:data-[slot=avatar]:grayscale">
                      <Avatar className="h-6 w-6 relative group">
                        <AvatarImage
                          src={assignee.avatar_url ?? undefined}
                          alt={assignee.full_name || "User"}
                        />
                        <AvatarFallback className="text-xs workspace-component-bg workspace-component-active-color">
                          {getAvatarInitials(
                            assignee.full_name,
                            assignee.email
                          )}
                        </AvatarFallback>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onRemoveAssignee(assignee.id)}
                          className="h-6 w-6 p-0 rounded-full absolute right-0 top-0 cursor-pointer workspace-secondary-sidebar-bg z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-500 hover:text-white text-xs"
                        >
                          ×
                        </Button>
                      </Avatar>
                      <Popover>
                        <PopoverTrigger asChild>
                          {taskAssignees.length !== 0 && (
                            <Avatar className="h-6 w-6 cursor-pointer hover:workspace-hover">
                              <AvatarImage
                                src={undefined}
                                alt={"User"}
                                className="h-6 w-6 border border-dashed workspace-border"
                              />
                              <AvatarFallback className="text-xs workspace-sidebar-text border border-dashed workspace-border">
                                <Plus className="h-3 w-3 " />
                              </AvatarFallback>
                            </Avatar>
                          )}
                        </PopoverTrigger>
                        <PopoverContent className="w-[200px] p-0">
                          <Command>
                            <CommandInput placeholder="Search user..." />
                            <CommandList>
                              <CommandEmpty>No users found.</CommandEmpty>
                              <CommandGroup>
                                {workspaceMembers
                                  .filter(
                                    (member) =>
                                      !taskAssignees.some(
                                        (assignee) => assignee.id === member.id
                                      )
                                  )
                                  .map((member) => (
                                    <CommandItem
                                      key={member.id}
                                      onSelect={() => onAddAssignee(member.id)}
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
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="workspace-sidebar-text text-xs w-full p-2 h-8 justify-start workspace-secondary-sidebar-bg hover:workspace-hover "
                  >
                    Empty
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
                            onSelect={() => onAddAssignee(member.id)}
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
        </div>

        {/* Time Estimate */}
        <div className="mb-3">
          <div className="flex items-center mb-3 gap-2">
            <Clock className="w-4 h-4 workspace-sidebar-text" />
            <label className="text-xs font-medium workspace-sidebar-text uppercase">
              Time Estimate
            </label>
          </div>
          <Select
            value={(task as any).time_estimate || "none"}
            onValueChange={(value) =>
              onUpdateTimeEstimate(value === "none" ? "" : value)
            }
            disabled={loading}
          >
            <SelectTrigger className="h-8 workspace-header-bg border border-transparent hover:workspace-hover">
              <SelectValue>
                {(task as any).time_estimate ? (
                  <span className="text-xs">{(task as any).time_estimate}</span>
                ) : (
                  <span className="text-xs text-gray-500">No estimate</span>
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="workspace-header-bg">
              <SelectItem
                value="none"
                className="hover:workspace-hover cursor-pointer"
              >
                <span className="text-xs text-gray-500">No estimate</span>
              </SelectItem>
              <SelectItem
                value="30m"
                className="hover:workspace-hover cursor-pointer"
              >
                <span className="text-xs">30 minutes</span>
              </SelectItem>
              <SelectItem
                value="1h"
                className="hover:workspace-hover cursor-pointer"
              >
                <span className="text-xs">1 hour</span>
              </SelectItem>
              <SelectItem
                value="2h"
                className="hover:workspace-hover cursor-pointer"
              >
                <span className="text-xs">2 hours</span>
              </SelectItem>
              <SelectItem
                value="4h"
                className="hover:workspace-hover cursor-pointer"
              >
                <span className="text-xs">4 hours</span>
              </SelectItem>
              <SelectItem
                value="1d"
                className="hover:workspace-hover cursor-pointer"
              >
                <span className="text-xs">1 day</span>
              </SelectItem>
              <SelectItem
                value="2d"
                className="hover:workspace-hover cursor-pointer"
              >
                <span className="text-xs">2 days</span>
              </SelectItem>
              <SelectItem
                value="1w"
                className="hover:workspace-hover cursor-pointer"
              >
                <span className="text-xs">1 week</span>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tags */}
      <div className="mb-3">
        <div className="flex items-center mb-3 gap-2">
          <Tag className="w-4 h-4 workspace-sidebar-text" />
          <label className="text-xs font-medium workspace-sidebar-text uppercase">
            Tags
          </label>
        </div>

        <div className="space-y-2">
          {task.task_tags && task.task_tags.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {task.task_tags.map((taskTag: any) => (
                <span
                  key={taskTag.tag.id}
                  className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${
                    tagColorClasses[taskTag.tag.color]
                  } group relative`}
                >
                  {taskTag.tag.name}
                  <button
                    onClick={() => onRemoveTag(taskTag.tag.id)}
                    className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-600"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          ) : null}

          {/* Add tag button */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="workspace-sidebar-text text-xs p-2 h-8 justify-start workspace-secondary-sidebar-bg hover:workspace-hover"
              >
                <Plus className="h-3 w-3" />
                {task.task_tags && task.task_tags.length > 0
                  ? "Add tag"
                  : "Add tags"}
              </Button>
            </PopoverTrigger>

            <PopoverContent className="w-[200px] p-0">
              <Command>
                <CommandInput
                  placeholder="Search or create tags..."
                  value={tagSearchValue}
                  onValueChange={setTagSearchValue}
                  onKeyDown={handleTagKeyDown}
                />
                <CommandList>
                  <CommandEmpty>
                    {tagSearchValue.trim() ? (
                      <div className="p-2 text-center">
                        <div className="text-sm text-gray-500 mb-2">
                          {isCreatingTag ? "Creating tag..." : "No tags found"}
                        </div>
                        {!isCreatingTag && (
                          <div className="text-xs text-blue-600">
                            Press Enter to create "{tagSearchValue.trim()}"
                          </div>
                        )}
                      </div>
                    ) : (
                      "No tags found."
                    )}
                  </CommandEmpty>
                  <CommandGroup>
                    {tags
                      .filter(
                        (tag) =>
                          !task.task_tags?.some(
                            (taskTag: any) => taskTag.tag.id === tag.id
                          ) &&
                          tag.name
                            .toLowerCase()
                            .includes(tagSearchValue.toLowerCase())
                      )
                      .map((tag) => (
                        <CommandItem
                          key={tag.id}
                          onSelect={() => {
                            onAddTag(tag.id);
                            setTagSearchValue("");
                          }}
                          className="flex items-center justify-between"
                        >
                          <div className="flex items-center space-x-2">
                            <div
                              className={`w-2 h-2 rounded-full ${
                                colorMap[tag.color] || "bg-gray-500"
                              }`}
                            />
                            <span>{tag.name}</span>
                          </div>
                        </CommandItem>
                      ))}
                    {tagSearchValue.trim() &&
                      !isCreatingTag &&
                      !tags.some(
                        (tag) =>
                          tag.name.toLowerCase() ===
                          tagSearchValue.trim().toLowerCase()
                      ) && (
                        <CommandItem
                          onSelect={() => {
                            handleCreateTag(tagSearchValue.trim());
                          }}
                          className="flex items-center justify-between text-blue-600"
                        >
                          <div className="flex items-center space-x-2">
                            <Plus className="w-3 h-3" />
                            <span>Create "{tagSearchValue.trim()}"</span>
                          </div>
                        </CommandItem>
                      )}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  );
}
