import type { Status } from "@/lib/database.types";

export const colorMap: Record<string, string> = {
  red: "bg-red-500",
  blue: "bg-blue-500",
  green: "bg-green-500",
  yellow: "bg-yellow-500",
  purple: "bg-purple-500",
  pink: "bg-pink-500",
  gray: "bg-gray-500",
  orange: "bg-orange-500",
  indigo: "bg-indigo-500",
  teal: "bg-teal-500",
};

export const tagColorClasses: Record<string, string> = {
  red: "bg-red-100 text-red-800",
  blue: "bg-blue-100 text-blue-800",
  green: "bg-green-100 text-green-800",
  yellow: "bg-yellow-100 text-yellow-800",
  purple: "bg-purple-100 text-purple-800",
  pink: "bg-pink-100 text-pink-800",
  gray: "bg-gray-100 text-gray-800",
  orange: "bg-orange-100 text-orange-800",
  indigo: "bg-indigo-100 text-indigo-800",
  teal: "bg-teal-100 text-teal-800",
};

export const getStatusColor = (status: Status): string => {
  return colorMap[status.color] || "bg-gray-500";
};

export const generateTaskId = (): string => {
  return `t${Math.floor(Math.random() * 1000000000000)
    .toString()
    .padStart(12, "0")}`;
};

export const generateTagId = (): string => {
  return `tag${Math.floor(Math.random() * 1000000000000)
    .toString()
    .padStart(12, "0")}`;
};

export const getAvailableTagColors = (): string[] => {
  return [
    "red",
    "blue",
    "green",
    "yellow",
    "purple",
    "pink",
    "gray",
    "orange",
    "indigo",
    "teal",
  ];
};

export const getRandomTagColor = (): string => {
  const colors = getAvailableTagColors();
  return colors[Math.floor(Math.random() * colors.length)];
};

export const getCompletedStatus = (statuses: Status[]): Status | null => {
  return (
    statuses.find(
      (s) =>
        s.name.toLowerCase().includes("done") ||
        s.name.toLowerCase().includes("complete")
    ) || statuses[statuses.length - 1]
  );
};

export const getTodoStatus = (statuses: Status[]): Status | null => {
  return statuses[0] || null;
};

export const filterActivities = (activities: any[], searchTerm: string) => {
  if (!searchTerm.trim()) return activities;

  const search = searchTerm.toLowerCase();
  return activities.filter((activity) => {
    const userName = activity.user?.full_name?.toLowerCase() || "";
    const description = activity.description?.toLowerCase() || "";
    const comment = activity.metadata?.comment?.toLowerCase() || "";

    return (
      userName.includes(search) ||
      description.includes(search) ||
      comment.includes(search)
    );
  });
};

export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error("Error copying to clipboard:", error);
    return false;
  }
};

export const getTaskUrl = (workspaceId: string, taskId: string): string => {
  return `${window.location.origin}/${workspaceId}/task/${taskId}`;
};
