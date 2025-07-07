import {
  format,
  parseISO,
  addDays,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
} from "date-fns";
import type { Status, Task } from "@/lib/database.types";
import { colorMap, colorMapStatusBoardBg, textColorMap } from "./types";

export const getStatusColor = (status: Status): string => {
  return colorMap[status.color as keyof typeof colorMap] || "bg-gray-500";
};

export const getStatusTextColor = (status: Status): string => {
  return (
    textColorMap[status.color as keyof typeof textColorMap] || "text-gray-500"
  );
};

export const getStatusBoardBgColor = (status: Status): string => {
  return (
    colorMapStatusBoardBg[status.color as keyof typeof colorMapStatusBoardBg] ||
    "bg-gray-500/10"
  );
};

export const getStatusBadge = (status: Status): string | null => {
  if (status.type === "space") return "Space";
  if (status.type === "project") return "Project";
  return null;
};

export const generateDateRange = (weeksAhead: number = 4) => {
  const today = new Date();
  const startDate = startOfMonth(today);
  const endDate = endOfMonth(addDays(today, weeksAhead * 7));
  return eachDayOfInterval({ start: startDate, end: endDate });
};

export const generateWeeks = (dateRange: Date[]) => {
  const weeks: Record<string, Date[]> = {};
  dateRange.forEach((date) => {
    const weekNum = `W${format(date, "w")}`;
    if (!weeks[weekNum]) {
      weeks[weekNum] = [];
    }
    weeks[weekNum].push(date);
  });
  return weeks;
};

export const getTaskBarPosition = (
  task: Task,
  dateRange: Date[]
): { left: number; width: number } => {
  const today = new Date();
  const startDateObj = task.start_date ? parseISO(task.start_date) : today;
  const dueDateObj = task.due_date
    ? parseISO(task.due_date)
    : addDays(startDateObj, 1);

  const startIndex = dateRange.findIndex(
    (d) => format(d, "yyyy-MM-dd") === format(startDateObj, "yyyy-MM-dd")
  );

  const endIndex = dateRange.findIndex(
    (d) => format(d, "yyyy-MM-dd") === format(dueDateObj, "yyyy-MM-dd")
  );

  const left = Math.max(0, startIndex) * 40;
  const width = Math.max(40, (endIndex - startIndex + 1) * 40);

  return { left, width };
};

export const copyTaskLink = (taskId: string, workspaceId: string): void => {
  const taskUrl = `${window.location.origin}/${workspaceId}/task/${taskId}`;
  navigator.clipboard.writeText(taskUrl);
};

export const filterTasksByStatus = (tasks: Task[]): Record<string, Task[]> => {
  return tasks
    .filter((task) => !task.parent_task_id)
    .reduce((acc, task) => {
      const statusId = task.status_id || "unknown";
      if (!acc[statusId]) acc[statusId] = [];
      acc[statusId].push(task);
      return acc;
    }, {} as Record<string, Task[]>);
};

export const getSubtasksForTask = (
  taskId: string,
  allSubtasks: Task[]
): Task[] => {
  return allSubtasks.filter((task) => task.parent_task_id === taskId);
};

export const filterTasks = (
  tasks: Task[],
  filters: {
    status: string[];
    tags: string[];
    priority: string[];
    assigned: string[];
    sprintPoints: { min: number; max: number };
    showUnassignedOnly: boolean;
  }
): Task[] => {
  return tasks.filter((task) => {
    // Status filter
    if (filters.status.length > 0 && !filters.status.includes(task.status_id)) {
      return false;
    }

    // Tags filter
    if (filters.tags.length > 0) {
      const taskTagIds = task.task_tags?.map((tt: any) => tt.tag.id) || [];
      const hasMatchingTag = filters.tags.some((tagId) =>
        taskTagIds.includes(tagId)
      );
      if (!hasMatchingTag) return false;
    }

    // Priority filter
    if (
      filters.priority.length > 0 &&
      !filters.priority.includes(task.priority)
    ) {
      return false;
    }

    // Assigned filter
    if (filters.showUnassignedOnly) {
      // Show only unassigned tasks
      if (task.assignee_id) {
        return false;
      }
    } else if (filters.assigned.length > 0) {
      // Show only tasks assigned to specific users
      if (!task.assignee_id || !filters.assigned.includes(task.assignee_id)) {
        return false;
      }
    }

    // Sprint points filter (if task has sprint_points property)
    if (typeof (task as any).sprint_points === "number") {
      const points = (task as any).sprint_points;
      if (
        points < filters.sprintPoints.min ||
        points > filters.sprintPoints.max
      ) {
        return false;
      }
    }

    return true;
  });
};

export const formatDateRange = (
  startDate?: string,
  dueDate?: string
): string => {
  if (startDate && !dueDate) {
    return `Starts ${format(parseISO(startDate), "MMM d")}`;
  }
  if (dueDate && !startDate) {
    return format(parseISO(dueDate), "MMM d");
  }
  if (startDate && dueDate) {
    return `${format(parseISO(startDate), "MMM d")} - ${format(
      parseISO(dueDate),
      "MMM d"
    )}`;
  }
  return "";
};

export const stripFormatting = (text: string): string => {
  if (!text) return "";

  // First remove markdown formatting
  const withoutMarkdown = text
    // Remove headers (# and ##)
    .replace(/^#+\s*/gm, "")
    // Remove bold/italic (**text** or *text*)
    .replace(/[*_]{1,2}([^*_]+)[*_]{1,2}/g, "$1")
    // Remove list markers
    .replace(/^[-*+]\s+/gm, "")
    // Remove numbered lists
    .replace(/^\d+\.\s+/gm, "")
    // Remove blockquotes
    .replace(/^>\s+/gm, "")
    // Remove code blocks
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`([^`]+)`/g, "$1");

  // Then remove HTML tags
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = withoutMarkdown;
  return tempDiv.textContent || tempDiv.innerText || "";
};
