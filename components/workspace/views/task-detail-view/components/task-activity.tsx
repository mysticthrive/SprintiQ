"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Search,
  Brain,
  GitBranch,
  CircleDot,
  Edit,
  SendHorizonal,
  Loader2,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { getAvatarInitials } from "@/lib/utils";
import { useEnhancedToast } from "@/hooks/use-enhanced-toast";
import { filterActivities } from "../utils";
import type { TaskActivityProps } from "../types";

export function TaskActivity({
  activities,
  workspace,
  user,
  commentText,
  isSubmittingComment,
  activitySearchValue,
  showActivitySearch,
  onCommentChange,
  onSendComment,
  onSearchChange,
  onToggleSearch,
}: TaskActivityProps) {
  const { toast } = useEnhancedToast();
  const filteredActivities = filterActivities(activities, activitySearchValue);

  const handleFeatureClick = (featureName: string) => {
    toast({
      title: "Feature Coming Soon",
      description: `${featureName} feature will be available soon`,
    });
  };

  return (
    <div className="w-80 border-l workspace-border p-3 overflow-y-auto flex flex-col">
      {showActivitySearch ? (
        <div className="mb-3">
          <div className="relative">
            <Search className="absolute left-2 top-2 h-3 w-3 text-gray-400" />
            <Input
              variant="workspace"
              placeholder="Search activities..."
              value={activitySearchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  onSearchChange("");
                  onToggleSearch();
                }
              }}
              className="pl-7 h-7 text-xs workspace-sidebar-text workspace-header-bg focus-visible:ring-0 focus-visible:ring-offset-0 focus:ring-2 focus:workspace-ring"
            />
          </div>
        </div>
      ) : (
        <div className="flex justify-between mb-3">
          <h3 className="text-sm font-medium workspace-sidebar-text">
            Activity
          </h3>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={onToggleSearch}
          >
            <Search className="h-3 w-3" />
          </Button>
        </div>
      )}

      <div className="flex flex-col h-[calc(100vh-75px)] justify-between overflow-y-auto flex-1">
        <div className="space-y-4">
          {/* Activities List */}
          {filteredActivities.map((activity) => (
            <div key={activity.id} className="text-xs workspace-sidebar-text">
              <div className="flex items-start space-x-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage
                    src={activity.user?.avatar_url ?? undefined}
                    alt={activity.user?.full_name || "User"}
                  />
                  <AvatarFallback className="text-xs workspace-component-bg workspace-component-active-color">
                    {getAvatarInitials(
                      activity.user?.full_name,
                      activity.user?.email
                    )}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  {activity.type === "comment_added" ||
                  activity.type === "comment" ? (
                    <div>
                      <p className="text-xs workspace-sidebar-text">
                        <span className="font-medium">
                          {activity.user?.id === user?.id
                            ? "You"
                            : activity.user?.full_name || "Unknown User"}
                        </span>{" "}
                        commented:
                      </p>
                      <div className="mt-1 p-2 rounded text-xs workspace-sidebar-text">
                        {activity.metadata?.comment ||
                          activity.description.replace("commented: ", "")}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {format(
                          parseISO(activity.created_at),
                          "MMM d 'at' h:mm a"
                        )}
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-xs workspace-sidebar-text">
                        <span className="font-medium">
                          {activity.user?.id === user?.id
                            ? "You"
                            : activity.user?.full_name || "Unknown User"}
                        </span>{" "}
                        {activity.description}
                      </p>
                      <p className="text-xs text-gray-500">
                        {format(
                          parseISO(activity.created_at),
                          "MMM d 'at' h:mm a"
                        )}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {filteredActivities.length === 0 && (
            <div className="text-center py-4">
              <p className="text-xs text-gray-500">
                {activitySearchValue.trim()
                  ? `No activities found for "${activitySearchValue}"`
                  : "No recent activity"}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Comment Input */}
      <div className="mt-2 pt-3 border-t workspace-border text-xs relative">
        <Textarea
          placeholder="Write a comment... (Ctrl+Enter or Cmd+Enter to send)"
          className="w-full text-xs workspace-sidebar-text workspace-header-bg placeholder:text-xs resize-none focus-visible:ring-0 focus-visible:ring-offset-0 focus:ring-2 focus:workspace-ring"
          value={commentText}
          onChange={(e) => onCommentChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
              onSendComment();
            }
          }}
          rows={5}
          disabled={isSubmittingComment}
        />
        <div className="flex justify-end mt-2 absolute bottom-2 right-2 space-x-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                size="sm"
                className="text-xs workspace-sidebar-text workspace-secondary-sidebar-bg hover:workspace-hover p-1 h-6"
              >
                {isSubmittingComment ? (
                  <Loader2 className="h-2 w-2 animate-spin" />
                ) : (
                  <Brain className="h-2 w-2" />
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-1" align="end">
              <div className="space-y-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-xs h-8"
                  onClick={() => handleFeatureClick("Summarize task")}
                >
                  <Brain className="h-3 w-3" />
                  Summarize Task
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-xs h-8"
                  onClick={() => handleFeatureClick("Auto-create subtasks")}
                >
                  <GitBranch className="h-3 w-3" />
                  Create Subtasks
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-xs h-8"
                  onClick={() => handleFeatureClick("Progress update")}
                >
                  <CircleDot className="h-3 w-3" />
                  Progress Update
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-xs h-8"
                  onClick={() => handleFeatureClick("AI writing assistant")}
                >
                  <Edit className="h-3 w-3" />
                  Write
                </Button>
              </div>
            </PopoverContent>
          </Popover>
          <Button
            size="sm"
            onClick={onSendComment}
            disabled={isSubmittingComment || !commentText.trim()}
            className="text-xs workspace-primary hover:workspace-primary-hover p-1 h-6"
          >
            {isSubmittingComment ? (
              <Loader2 className="h-2 w-2 animate-spin" />
            ) : (
              <SendHorizonal className="h-2 w-2" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
