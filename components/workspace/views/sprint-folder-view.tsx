"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Plus,
  Calendar,
  Target,
  Users,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  BarChart3,
  ArrowRight,
  Play,
  Link as LinkIcon,
  Pause,
  Flag,
  User,
  CalendarDays,
  Zap,
  FolderKanban,
  MoreHorizontal,
  Star,
  Edit,
  Info,
  FolderInput,
  Trash,
  CirclePlay,
  CircleCheck,
  CircleAlert,
} from "lucide-react";
import type {
  Workspace,
  Space,
  Sprint,
  SprintFolder,
  Status,
  StatusType,
  Task,
} from "@/lib/database.types";
import CreateSprintModal from "@/components/workspace/modals/create-sprint-modal";
import { useEnhancedToast } from "@/hooks/use-enhanced-toast";
import {
  format,
  differenceInDays,
  isAfter,
  isBefore,
  startOfDay,
} from "date-fns";
import {
  getCompletedStatuses,
  getActiveStatuses,
  STATUS_TYPES,
} from "@/lib/status-utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface SprintFolderViewProps {
  workspace: Workspace;
  space: Space;
  sprintFolder: SprintFolder & {
    sprints: (Sprint & {
      tasks: (Task & {
        status: Status | null;
        assignee: any;
      })[];
    })[];
  };
  spaces: (Space & { projects: any[]; sprint_folders: any[] })[];
  statuses: Status[];
  statusTypes?: StatusType[];
}

export default function SprintFolderView({
  workspace,
  space,
  sprintFolder,
  spaces,
  statuses,
  statusTypes = [],
}: SprintFolderViewProps) {
  const params = useParams();
  const workspaceId = params.workspaceId as string;
  const [createSprintModalOpen, setCreateSprintModalOpen] = useState(false);
  const { toast } = useEnhancedToast();

  const handleSprintCreated = async (newSprint: Sprint) => {
    // Refresh the page to show the new sprint
    window.location.reload();

    toast({
      title: "Sprint created",
      description: `Sprint "${newSprint.name}" has been created successfully.`,
      browserNotificationTitle: "Sprint created",
      browserNotificationBody: `Sprint "${newSprint.name}" has been created successfully.`,
    });
  };

  // Calculate sprint progress and statistics
  const calculateSprintProgress = (sprint: Sprint & { tasks: Task[] }) => {
    const tasks = sprint.tasks || [];
    if (tasks.length === 0)
      return { progress: 0, completed: 0, total: 0, inProgress: 0, overdue: 0 };

    // Get completed and active statuses using utilities
    const completedStatuses = getCompletedStatuses(statuses);
    const activeStatuses = getActiveStatuses(statuses);

    const completedTasks = tasks.filter((task) =>
      completedStatuses.some((status) => status.id === task.status_id)
    );

    const inProgressTasks = tasks.filter((task) =>
      activeStatuses.some((status) => status.id === task.status_id)
    );

    const overdueTasks = tasks.filter(
      (task) =>
        task.due_date &&
        isBefore(new Date(task.due_date), startOfDay(new Date()))
    );

    const progress =
      tasks.length > 0 ? (completedTasks.length / tasks.length) * 100 : 0;

    return {
      progress: Math.round(progress),
      completed: completedTasks.length,
      total: tasks.length,
      inProgress: inProgressTasks.length,
      overdue: overdueTasks.length,
    };
  };

  // Get sprint status
  const getSprintStatus = (sprint: Sprint) => {
    if (!sprint.start_date || !sprint.end_date) return "not-started";

    const now = new Date();
    const startDate = new Date(sprint.start_date);
    const endDate = new Date(sprint.end_date);

    if (isBefore(now, startDate)) return "not-started";
    if (isAfter(now, endDate)) return "completed";
    return "in-progress";
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "not-started":
        return "bg-gray-500";
      case "in-progress":
        return "bg-blue-500";
      case "completed":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusTextColor = (status: string) => {
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

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "not-started":
        return <Clock className="h-3 w-3" />;
      case "in-progress":
        return <Play className="h-3 w-3" />;
      case "completed":
        return <CheckCircle2 className="h-3 w-3" />;
      default:
        return <Clock className="h-3 w-3" />;
    }
  };

  // Calculate overall folder statistics
  const folderStats = sprintFolder.sprints.reduce(
    (acc, sprint) => {
      const stats = calculateSprintProgress(sprint);
      return {
        totalSprints: acc.totalSprints + 1,
        totalTasks: acc.totalTasks + stats.total,
        completedTasks: acc.completedTasks + stats.completed,
        inProgressTasks: acc.inProgressTasks + stats.inProgress,
        overdueTasks: acc.overdueTasks + stats.overdue,
      };
    },
    {
      totalSprints: 0,
      totalTasks: 0,
      completedTasks: 0,
      inProgressTasks: 0,
      overdueTasks: 0,
    }
  );

  const overallProgress =
    folderStats.totalTasks > 0
      ? Math.round((folderStats.completedTasks / folderStats.totalTasks) * 100)
      : 0;

  // Calculate sprint velocity (average tasks completed per sprint)
  const calculateVelocity = () => {
    const completedSprints = sprintFolder.sprints.filter((sprint) => {
      const status = getSprintStatus(sprint);
      return status === "completed";
    });

    if (completedSprints.length === 0) return 0;

    const totalCompletedTasks = completedSprints.reduce((acc, sprint) => {
      const stats = calculateSprintProgress(sprint);
      return acc + stats.completed;
    }, 0);

    return Math.round(totalCompletedTasks / completedSprints.length);
  };

  // Calculate team workload distribution
  const calculateTeamWorkload = () => {
    const allTasks = sprintFolder.sprints.flatMap(
      (sprint) => sprint.tasks || []
    );
    const assigneeCounts = allTasks.reduce((acc, task) => {
      if (task.assignee?.full_name) {
        acc[task.assignee.full_name] = (acc[task.assignee.full_name] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(assigneeCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // Top 5 assignees
  };

  const velocity = calculateVelocity();
  const teamWorkload = calculateTeamWorkload();

  return (
    <div className="flex-1 flex flex-col">
      {/* Enhanced Header */}
      <div className="border-b workspace-border p-3">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 workspace-component-bg rounded-lg flex items-center justify-center">
                <FolderKanban className="h-4 w-4 workspace-component-active-color" />
              </div>
              <div>
                <h1 className="text-sm ">{sprintFolder.name}</h1>
                <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-3 w-3" />
                    <span className="text-xs">
                      {sprintFolder.duration_week} weeks duration
                    </span>
                  </div>
                  |
                  <div className="flex items-center gap-2">
                    <CirclePlay className="h-3 w-3" />
                    <span className="text-xs">
                      {sprintFolder.sprints.length} sprints
                    </span>
                  </div>
                  |
                  {sprintFolder.sprint_start_day_id && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3 w-3" />
                      <span>Starts on {sprintFolder.days?.name}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

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
              <DropdownMenuItem className="cursor-pointer text-xs hover:workspace-hover">
                <Star className="h-3 w-3" />
                Add to favorites
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer text-xs hover:workspace-hover">
                <Edit className="h-3 w-3" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer text-xs hover:workspace-hover">
                <LinkIcon className="h-3 w-3" />
                Copy link
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer text-xs hover:workspace-hover"
                onClick={() => setCreateSprintModalOpen(true)}
              >
                <Plus className="h-3 w-3" />
                Create new sprint
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer text-xs hover:workspace-hover">
                <Info className="h-3 w-3" />
                Sprint info
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer text-xs hover:workspace-hover">
                <FolderInput className="h-3 w-3" />
                Move
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600 cursor-pointer text-xs hover:workspace-hover">
                <Trash className="h-3 w-3" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      {/* Overall Progress Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3 p-3">
        <Card className="border shadow-sm backdrop-blur-sm lg:col-span-2 workspace-header-bg workspace-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Overall Progress
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {overallProgress}%
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-500" />
            </div>
            <Progress value={overallProgress} className="mt-2" />
          </CardContent>
        </Card>

        <Card className="border shadow-sm backdrop-blur-sm workspace-header-bg workspace-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Tasks
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {folderStats.totalTasks}
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-purple-500" />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {folderStats.completedTasks} completed
            </p>
          </CardContent>
        </Card>

        <Card className="border shadow-sm backdrop-blur-sm workspace-header-bg workspace-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  In Progress
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {folderStats.inProgressTasks}
                </p>
              </div>
              <Play className="h-8 w-8 text-blue-500" />
            </div>
            <p className="text-xs text-gray-500 mt-1">Active tasks</p>
          </CardContent>
        </Card>

        <Card className="border shadow-sm backdrop-blur-sm workspace-header-bg workspace-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Overdue
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {folderStats.overdueTasks}
                </p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
            <p className="text-xs text-gray-500 mt-1">Needs attention</p>
          </CardContent>
        </Card>

        <Card className="border shadow-sm backdrop-blur-sm workspace-header-bg workspace-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Velocity
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {velocity}
                </p>
              </div>
              <Zap className="h-8 w-8 text-green-500" />
            </div>
            <p className="text-xs text-gray-500 mt-1">Tasks/sprint avg</p>
          </CardContent>
        </Card>
      </div>

      {/* Team Workload Section */}
      {teamWorkload.length > 0 && (
        <div className="mt-4">
          <Card className="border-0 shadow-sm bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Team Workload
                </h3>
                <Users className="h-4 w-4 text-gray-400" />
              </div>
              <div className="space-y-2">
                {teamWorkload.map((member, index) => (
                  <div
                    key={member.name}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {member.name}
                      </span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {member.count} tasks
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 pb-3 px-3">
        {sprintFolder.sprints.length > 0 ? (
          <div className="space-y-3">
            {/* Sprint Timeline View */}
            <div className="workspace-header-bg rounded-lg border workspace-border p-4">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold workspace-text">
                  Sprint Timeline
                </h2>
                <Badge variant="outline" className="text-xs">
                  {sprintFolder.sprints.length} sprints
                </Badge>
              </div>

              <div className="space-y-4">
                {sprintFolder.sprints
                  .sort((a, b) => {
                    if (!a.start_date || !b.start_date) return 0;
                    return (
                      new Date(a.start_date).getTime() -
                      new Date(b.start_date).getTime()
                    );
                  })
                  .map((sprint, index) => {
                    const stats = calculateSprintProgress(sprint);
                    const sprintStatus = getSprintStatus(sprint);
                    const daysRemaining = sprint.end_date
                      ? differenceInDays(new Date(sprint.end_date), new Date())
                      : null;

                    return (
                      <div
                        key={sprint.id}
                        className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-slate-700/50 rounded-lg"
                      >
                        <div className="flex-shrink-0">
                          <CirclePlay
                            className={`w-8 h-8 ${getStatusTextColor(
                              sprintStatus
                            )} `}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h3 className="font-medium workspace-text truncate">
                              {sprint.name}
                            </h3>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {stats.progress}% complete
                              </Badge>
                              {daysRemaining !== null && (
                                <Badge
                                  variant="outline"
                                  className={`text-xs flex items-center gap-1 ${
                                    daysRemaining < 0
                                      ? "text-red-600 border-red-300"
                                      : daysRemaining <= 3
                                      ? "text-yellow-600 border-yellow-300"
                                      : "text-green-600 border-green-300"
                                  }`}
                                >
                                  <Calendar className="h-3 w-3" />
                                  {daysRemaining > 0
                                    ? `${daysRemaining}d left`
                                    : daysRemaining === 0
                                    ? "Ends today"
                                    : `${Math.abs(daysRemaining)}d overdue`}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
                            <div className="flex items-center gap-1">
                              <CircleCheck className="h-4 w-4" />
                              <span className="text-xs">
                                {stats.completed}/{stats.total} tasks done
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <CirclePlay className="h-4 w-4" />
                              <span className="text-xs">
                                {stats.inProgress} in progress
                              </span>
                            </div>
                            {stats.overdue > 0 && (
                              <div className="flex items-center gap-1">
                                <CircleAlert className="h-4 w-4 text-red-600" />
                                <span className="text-red-600 text-xs">
                                  {stats.overdue} overdue
                                </span>
                              </div>
                            )}
                          </div>
                          <Progress
                            value={stats.progress}
                            className="mt-2 h-1"
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            <Card className="border p-4 shadow-sm workspace-header-bg workspace-border">
              <CardContent className="p-0 mb-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold workspace-text">
                    Sprint Overview
                  </h2>
                  <Badge variant="outline" className="text-xs">
                    {sprintFolder.sprints.length} sprints
                  </Badge>
                </div>
              </CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
                {sprintFolder.sprints.map((sprint) => {
                  const stats = calculateSprintProgress(sprint);
                  const sprintStatus = getSprintStatus(sprint);
                  const daysRemaining = sprint.end_date
                    ? differenceInDays(new Date(sprint.end_date), new Date())
                    : null;

                  return (
                    <Link
                      key={sprint.id}
                      href={`/${workspaceId}/space/${space.space_id}/sf/${sprintFolder.sprint_folder_id}/s/${sprint.sprint_id}`}
                      className="block group"
                    >
                      <Card className="h-full transition-all cursor-pointer workspace-header-bg workspace-border">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex-1 min-w-0 flex flex-col">
                              <CardTitle className="text-lg font-semibold workspace-text">
                                {sprint.name}
                              </CardTitle>
                            </div>
                            <Badge
                              variant="outline"
                              className={`flex items-center gap-1 ${getStatusColor(
                                sprintStatus
                              )} text-white border-0`}
                            >
                              {getStatusIcon(sprintStatus)}
                              {sprintStatus.replace("-", " ")}
                            </Badge>
                          </div>
                          {sprint.goal && (
                            <div className="flex items-center gap-1 mt-1">
                              <Target className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                              <span className=" flex-1 text-sm text-gray-600 dark:text-gray-400 line-clamp-2 truncate">
                                {sprint.goal}
                              </span>
                            </div>
                          )}
                        </CardHeader>

                        <CardContent className="space-y-4">
                          {/* Progress Section */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600 dark:text-gray-400">
                                Progress
                              </span>
                              <span className="font-medium">
                                {stats.progress}%
                              </span>
                            </div>
                            <Progress value={stats.progress} className="h-2" />
                            <div className="flex items-center justify-between text-xs text-gray-500">
                              <span>
                                {stats.completed} of {stats.total} tasks
                              </span>
                              <span>{stats.inProgress} in progress</span>
                            </div>
                          </div>

                          {/* Task Statistics */}
                          <div className="grid grid-cols-3 gap-2 text-center">
                            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-2">
                              <div className="text-green-600 dark:text-green-400 font-semibold">
                                {stats.completed}
                              </div>
                              <div className="text-xs text-green-600 dark:text-green-400">
                                Done
                              </div>
                            </div>
                            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-2">
                              <div className="text-blue-600 dark:text-blue-400 font-semibold">
                                {stats.inProgress}
                              </div>
                              <div className="text-xs text-blue-600 dark:text-blue-400">
                                Active
                              </div>
                            </div>
                            <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-2">
                              <div className="text-red-600 dark:text-red-400 font-semibold">
                                {stats.overdue}
                              </div>
                              <div className="text-xs text-red-600 dark:text-red-400">
                                Overdue
                              </div>
                            </div>
                          </div>

                          {/* Date Information */}
                          <div className="space-y-2">
                            {sprint.start_date && sprint.end_date ? (
                              <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                                  <Calendar className="h-3 w-3" />
                                  <span className="text-xs">
                                    {format(
                                      new Date(sprint.start_date),
                                      "MMM d"
                                    )}{" "}
                                    -{" "}
                                    {format(
                                      new Date(sprint.end_date),
                                      "MMM d, yyyy"
                                    )}
                                  </span>
                                </div>
                                {daysRemaining !== null && (
                                  <Badge variant="outline" className="text-xs">
                                    {daysRemaining > 0
                                      ? `${daysRemaining} days left`
                                      : daysRemaining === 0
                                      ? "Ends today"
                                      : `${Math.abs(
                                          daysRemaining
                                        )} days overdue`}
                                  </Badge>
                                )}
                              </div>
                            ) : (
                              <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                <span>No dates set</span>
                              </div>
                            )}
                          </div>

                          {/* Assignees Preview */}
                          {sprint.tasks && sprint.tasks.length > 0 && (
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1">
                                <User className="h-3 w-3 text-gray-400" />
                                <span className="text-xs text-gray-500">
                                  {
                                    new Set(
                                      sprint.tasks
                                        .filter((t) => t.assignee)
                                        .map((t) => t.assignee?.full_name)
                                    ).size
                                  }{" "}
                                  assignees
                                </span>
                              </div>
                              <ArrowRight className="h-3 w-3 text-gray-400 group-hover:text-blue-500 transition-colors" />
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            </Card>
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="max-w-md mx-auto">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Plus className="h-10 w-10 text-blue-500" />
              </div>
              <h3 className="text-xl font-semibold workspace-text mb-3">
                No sprints yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                Get started by creating your first sprint in this folder.
                Sprints help you organize and track progress on your projects.
              </p>
              <Button
                onClick={() => setCreateSprintModalOpen(true)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create your first sprint
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Create Sprint Modal */}
      <CreateSprintModal
        open={createSprintModalOpen}
        onOpenChange={setCreateSprintModalOpen}
        onSuccess={handleSprintCreated}
        workspace={workspace}
        space={space}
        sprintFolder={sprintFolder}
      />
    </div>
  );
}
