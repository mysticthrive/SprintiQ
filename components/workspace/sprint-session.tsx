"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  CirclePlay,
  Folder,
  Globe,
  Clock,
  Play,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleAlert,
  CalendarClock,
  FolderKanban,
} from "lucide-react";
import Link from "next/link";
import { differenceInDays, isBefore, isAfter } from "date-fns";
import { useState } from "react";

interface SprintInfo {
  id: string;
  sprint_id: string;
  name: string;
  goal: string | null;
  start_date: string | null;
  end_date: string | null;
  space: {
    id: string;
    name: string;
    space_id: string;
  };
  sprint_folder: {
    id: string;
    name: string;
    sprint_folder_id: string;
  };
  taskCount: number;
  completedTasks: number;
  inProgressTasks: number;
  overdueTasks: number;
}

interface SprintSessionProps {
  sprints: SprintInfo[];
  workspaceId: string;
}

export default function SprintSession({
  sprints,
  workspaceId,
}: SprintSessionProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set()
  );

  if (sprints.length === 0) {
    return null;
  }

  // Helper functions for sprint status
  const getSprintStatus = (sprint: SprintInfo) => {
    if (!sprint.start_date || !sprint.end_date) return "not-started";

    const now = new Date();
    const startDate = new Date(sprint.start_date);
    const endDate = new Date(sprint.end_date);

    if (isBefore(now, startDate)) return "not-started";
    if (isAfter(now, endDate)) return "completed";
    return "in-progress";
  };

  const getSprintIconColor = (status: string) => {
    switch (status) {
      case "not-started":
        return "text-gray-500";
      case "in-progress":
        return "text-blue-500";
      case "completed":
        return "text-green-500";
      default:
        return "text-gray-500";
    }
  };

  // Group sprints by sprint folder
  const sprintsByFolder = sprints.reduce((acc, sprint) => {
    const folderId = sprint.sprint_folder.sprint_folder_id;
    if (!acc[folderId]) {
      acc[folderId] = {
        folder: sprint.sprint_folder,
        sprints: [],
      };
    }
    acc[folderId].sprints.push(sprint);
    return acc;
  }, {} as Record<string, { folder: any; sprints: SprintInfo[] }>);

  const toggleFolder = (folderId: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  const activeSprints = sprints.filter(
    (sprint) => getSprintStatus(sprint) === "in-progress"
  );

  return (
    <div className="mb-3">
      <Card className="workspace-header-bg border workspace-border">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-lg">Sprints</CardTitle>
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="text-xs border workspace-border"
            >
              {sprints.length} sprints
            </Badge>
            <Link href={`/${workspaceId}/sprints`}>
              <Button variant="ghost" size="sm" className="h-7 text-xs">
                View All
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {/* Sprint Folders with Dropdown Sprints */}
          <div className="space-y-2">
            {Object.values(sprintsByFolder).map(
              ({ folder, sprints: folderSprints }) => {
                const activeCount = folderSprints.filter(
                  (sprint) => getSprintStatus(sprint) === "in-progress"
                ).length;
                const completedCount = folderSprints.filter(
                  (sprint) => getSprintStatus(sprint) === "completed"
                ).length;
                const isExpanded = expandedFolders.has(folder.sprint_folder_id);

                return (
                  <div
                    key={folder.sprint_folder_id}
                    className="border workspace-border rounded-lg"
                  >
                    {/* Sprint Folder Header */}
                    <div
                      className={`flex items-center justify-between p-3 hover:workspace-hover  transition-colors ${
                        isExpanded ? "rounded-t-lg" : "rounded-lg"
                      }`}
                    >
                      <div className="flex items-center space-x-3 flex-1">
                        <button
                          onClick={() => toggleFolder(folder.sprint_folder_id)}
                          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                        >
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </button>
                        <FolderKanban className="h-5 w-5 text-gray-500" />
                        <div className="flex-1">
                          <div className="font-medium text-sm">
                            {folder.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {folderSprints.length} sprints
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          {activeCount > 0 && (
                            <span className="flex items-center gap-1">
                              <Play className="h-3 w-3 text-blue-500" />
                              {activeCount} active
                            </span>
                          )}
                          {completedCount > 0 && (
                            <span className="flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3 text-green-500" />
                              {completedCount} completed
                            </span>
                          )}
                        </div>
                        <Link
                          href={`/${workspaceId}/space/${folderSprints[0]?.space.space_id}/sf/${folder.sprint_folder_id}`}
                          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                        >
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </div>
                    </div>

                    {/* Sprint Items (Dropdown) */}
                    {isExpanded && (
                      <div className="border-t workspace-border">
                        {folderSprints.map((sprint, index) => {
                          const sprintStatus = getSprintStatus(sprint);
                          const progress =
                            sprint.taskCount > 0
                              ? Math.round(
                                  (sprint.completedTasks / sprint.taskCount) *
                                    100
                                )
                              : 0;
                          const daysRemaining = sprint.end_date
                            ? differenceInDays(
                                new Date(sprint.end_date),
                                new Date()
                              )
                            : null;
                          const isLastSprint =
                            index === folderSprints.length - 1;

                          return (
                            <Link
                              key={sprint.id}
                              href={`/${workspaceId}/space/${sprint.space.space_id}/sf/${sprint.sprint_folder.sprint_folder_id}/s/${sprint.sprint_id}`}
                              className="block"
                            >
                              <div
                                className={`flex items-center justify-between p-3 pl-8 hover:workspace-hover transition-colors ${
                                  isLastSprint ? "rounded-b-lg" : ""
                                }`}
                              >
                                <div className="flex items-center space-x-3">
                                  <CirclePlay
                                    className={`h-5 w-5 ${getSprintIconColor(
                                      sprintStatus
                                    )}`}
                                  />
                                  <div>
                                    <div className="font-medium text-sm">
                                      {sprint.name}
                                    </div>
                                    <div className="text-xs text-gray-500 flex items-center space-x-2">
                                      <span className="flex items-center gap-1">
                                        <Globe className="h-3 w-3" />
                                        {sprint.space.name}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-3">
                                  <div className="text-right">
                                    <div className="text-sm font-medium">
                                      {sprint.completedTasks}/{sprint.taskCount}{" "}
                                      tasks
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      {progress}% complete
                                    </div>
                                  </div>
                                  {daysRemaining !== null && (
                                    <div
                                      className={`text-xs px-3 py-1 rounded-full flex items-center gap-1 ${
                                        daysRemaining < 0
                                          ? "text-rose-500 font-medium bg-rose-500/10"
                                          : "text-gray-500 bg-gray-500/10"
                                      }`}
                                    >
                                      {daysRemaining < 0 ? (
                                        <CircleAlert className="h-4 w-4" />
                                      ) : (
                                        <CalendarClock className="h-4 w-4" />
                                      )}
                                      {daysRemaining < 0
                                        ? `${Math.abs(daysRemaining)}d overdue`
                                        : `${daysRemaining}d left`}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }
            )}
          </div>

          {activeSprints.length === 0 && sprints.length > 0 && (
            <div className="text-center py-4">
              <CirclePlay className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">
                No active sprints at the moment
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
