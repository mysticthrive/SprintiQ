import type { Status, StatusType } from "@/lib/database.types";

export const STATUS_TYPES = {
  NOT_STARTED: "not-started",
  ACTIVE: "active",
  DONE: "done",
  CLOSED: "closed",
} as const;

export type StatusTypeName = (typeof STATUS_TYPES)[keyof typeof STATUS_TYPES];

/**
 * Get or create the "not-started" status type
 */
export const getOrCreateNotStartedStatusType = async (
  supabase: any
): Promise<string | null> => {
  try {
    // First try to get existing "not-started" status type
    const { data: existingStatusType } = await supabase
      .from("status_types")
      .select("id")
      .eq("name", "not-started")
      .single();

    if (existingStatusType) {
      return existingStatusType.id;
    }

    // If not found, create it
    const { data: newStatusType, error } = await supabase
      .from("status_types")
      .insert({
        name: "not-started",
      })
      .select("id")
      .single();

    if (error) {
      console.error("Error creating not-started status type:", error);
      return null;
    }

    return newStatusType.id;
  } catch (error) {
    console.error("Error getting or creating not-started status type:", error);
    return null;
  }
};

/**
 * Get statuses by status type name
 */
export const getStatusesByType = (
  statuses: Status[],
  statusTypeName: StatusTypeName
): Status[] => {
  return statuses.filter(
    (status) =>
      status.status_type?.name.toLowerCase() === statusTypeName.toLowerCase()
  );
};

/**
 * Get completed statuses (done and closed)
 */
export const getCompletedStatuses = (statuses: Status[]): Status[] => {
  return statuses.filter(
    (status) =>
      status.status_type &&
      [STATUS_TYPES.DONE, STATUS_TYPES.CLOSED].includes(
        status.status_type.name.toLowerCase() as any
      )
  );
};

/**
 * Get active statuses
 */
export const getActiveStatuses = (statuses: Status[]): Status[] => {
  return getStatusesByType(statuses, STATUS_TYPES.ACTIVE);
};

/**
 * Get not started statuses
 */
export const getNotStartedStatuses = (statuses: Status[]): Status[] => {
  return getStatusesByType(statuses, STATUS_TYPES.NOT_STARTED);
};

/**
 * Check if a status is completed
 */
export const isStatusCompleted = (status: Status): boolean => {
  return Boolean(
    status.status_type &&
      [STATUS_TYPES.DONE, STATUS_TYPES.CLOSED].includes(
        status.status_type.name.toLowerCase() as any
      )
  );
};

/**
 * Check if a status is active
 */
export const isStatusActive = (status: Status): boolean => {
  return status.status_type?.name.toLowerCase() === STATUS_TYPES.ACTIVE;
};

/**
 * Check if a status is not started
 */
export const isStatusNotStarted = (status: Status): boolean => {
  return status.status_type?.name.toLowerCase() === STATUS_TYPES.NOT_STARTED;
};

/**
 * Get status type color for UI
 */
export const getStatusTypeColor = (statusTypeName: StatusTypeName): string => {
  switch (statusTypeName) {
    case STATUS_TYPES.NOT_STARTED:
      return "bg-gray-500";
    case STATUS_TYPES.ACTIVE:
      return "bg-blue-500";
    case STATUS_TYPES.DONE:
      return "bg-green-500";
    case STATUS_TYPES.CLOSED:
      return "bg-purple-500";
    default:
      return "bg-gray-500";
  }
};

/**
 * Get status type icon for UI
 */
export const getStatusTypeIcon = (statusTypeName: StatusTypeName) => {
  const { Clock, Play, CheckCircle2, Archive } = require("lucide-react");

  switch (statusTypeName) {
    case STATUS_TYPES.NOT_STARTED:
      return Clock;
    case STATUS_TYPES.ACTIVE:
      return Play;
    case STATUS_TYPES.DONE:
      return CheckCircle2;
    case STATUS_TYPES.CLOSED:
      return Archive;
    default:
      return Clock;
  }
};
