"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ArrowLeft,
  MoreHorizontal,
  Edit,
  Move,
  Files,
  Link,
  Copy,
  Trash2,
  Building2,
  Globe,
  Hash,
  CirclePlay,
  FolderKanban,
} from "lucide-react";
import { useRouter } from "next/navigation";
import type { TaskHeaderProps } from "../types";

export function TaskHeader({
  task,
  workspace,
  space,
  project,
  sprint,
  onBack,
  onEditTaskName,
  onMoveTask,
  onDuplicateTask,
  onCopyLink,
  onCopyId,
  onDeleteTask,
}: TaskHeaderProps) {
  const router = useRouter();

  // Determine if this is a sprint task or project task
  const isSprintTask = sprint !== null;
  const isProjectTask = project !== null;

  return (
    <div className="workspace-header-bg border-b workspace-border p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="bg-transparent workspace-sidebar-text hover:bg-transparent text-xs p-0 h-6 mr-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div className="text-xs workspace-sidebar-text">
            <button
              onClick={() => router.push(`/${workspace.workspace_id}/home`)}
              className="p-1 -m-1 rounded transition-colors hover:workspace-text"
            >
              <Building2 className="w-4 h-4 inline-block mr-1" />
              {workspace.name}
            </button>
            {" / "}
            <button
              onClick={() =>
                router.push(
                  `/${workspace.workspace_id}/space/${space.space_id}`
                )
              }
              className="p-1 -m-1 rounded transition-colors hover:workspace-text"
            >
              <Globe className="w-4 h-4 inline-block mr-1" />
              {space.name}
            </button>
            {" / "}
            {isSprintTask && sprint && (
              <>
                <button
                  onClick={() =>
                    router.push(
                      `/${workspace.workspace_id}/space/${space.space_id}/sf/${sprint.sprint_folder_id}`
                    )
                  }
                  className="p-1 -m-1 rounded transition-colors hover:workspace-text"
                >
                  <FolderKanban className="w-4 h-4 inline-block mr-1" />
                  Sprint Folders
                </button>
                {" / "}
                <button
                  onClick={() =>
                    router.push(
                      `/${workspace.workspace_id}/space/${space.space_id}/sf/${sprint.sprint_folder_id}/s/${sprint.sprint_id}`
                    )
                  }
                  className="p-1 -m-1 rounded transition-colors hover:workspace-text"
                >
                  <CirclePlay className="w-4 h-4 inline-block mr-1" />
                  {sprint.name}
                </button>
              </>
            )}
            {isProjectTask && project && (
              <button
                onClick={() =>
                  router.push(
                    `/${workspace.workspace_id}/space/${space.space_id}/project/${project.project_id}`
                  )
                }
                className="p-1 -m-1 rounded transition-colors hover:workspace-text"
              >
                <Hash className="w-4 h-4 inline-block mr-1" />
                {project.name}
              </button>
            )}
          </div>
        </div>

        {/* Task Actions Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="workspace-sidebar-text hover:workspace-hover h-6 w-6 p-0"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={onEditTaskName}>
              <Edit className="h-4 w-4 mr-2" />
              Edit task name
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onMoveTask}>
              <Move className="h-4 w-4 mr-2" />
              Move
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onDuplicateTask}>
              <Files className="h-4 w-4 mr-2" />
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onCopyLink}>
              <Link className="h-4 w-4 mr-2" />
              Copy link
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onCopyId}>
              <Copy className="h-4 w-4 mr-2" />
              Copy ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={onDeleteTask}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
