"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { createClientSupabaseClient } from "@/lib/supabase/client";
import { markEventAsRead, markAllEventsAsRead } from "@/lib/events";
import { useAuth } from "@/contexts/auth-context";
import { formatDistanceToNow } from "date-fns";
import {
  CheckCheck,
  Circle,
  Plus,
  Edit,
  Trash2,
  Folder,
  Hash,
  CheckSquare,
  Flag,
  Loader2,
  Goal,
} from "lucide-react";
import type { Event, Workspace } from "@/lib/database.types";

interface InboxModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspace: Workspace;
}

const getEntityIcon = (entityType: string) => {
  switch (entityType) {
    case "workspace":
      return <Folder className="h-4 w-4" />;
    case "space":
      return <Hash className="h-4 w-4" />;
    case "project":
      return <Folder className="h-4 w-4" />;
    case "task":
    case "subtask":
      return <CheckSquare className="h-4 w-4" />;
    case "status":
      return <Goal className="h-4 w-4" />;
    default:
      return <Circle className="h-4 w-4" />;
  }
};

const getActionIcon = (type: string) => {
  switch (type) {
    case "created":
      return <Plus className="h-3 w-3 text-green-600" />;
    case "updated":
      return <Edit className="h-3 w-3 text-blue-600" />;
    case "deleted":
      return <Trash2 className="h-3 w-3 text-red-600" />;
    default:
      return <Circle className="h-3 w-3" />;
  }
};

const getActionColor = (type: string) => {
  switch (type) {
    case "created":
      return "bg-green-50 border-green-200";
    case "updated":
      return "bg-blue-50 border-blue-200";
    case "deleted":
      return "bg-red-50 border-red-200";
    default:
      return "bg-gray-50 border-gray-200";
  }
};

export default function InboxModal({
  open,
  onOpenChange,
  workspace,
}: InboxModalProps) {
  const { user } = useAuth();
  const supabase = createClientSupabaseClient();
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isMarkingAllRead, setIsMarkingAllRead] = useState(false);

  const loadEvents = async () => {
    if (!user || !workspace) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("events")
        .select(
          `
          *,
          user:profiles(*)
        `
        )
        .eq("workspace_id", workspace.id)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) {
        console.error("Failed to load events:", error);
        return;
      }

      setEvents(data || []);
    } catch (error) {
      console.error("Error loading events:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      loadEvents();
    }
  }, [open, workspace.id, user]);

  const handleMarkAsRead = async (eventId: string) => {
    const success = await markEventAsRead(eventId);
    if (success) {
      setEvents(
        events.map((event) =>
          event.id === eventId ? { ...event, is_read: true } : event
        )
      );

      // Dispatch custom event to notify other components
      window.dispatchEvent(
        new CustomEvent("eventMarkedAsRead", {
          detail: { eventId, workspaceId: workspace.id },
        })
      );
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!user) return;

    setIsMarkingAllRead(true);
    const success = await markAllEventsAsRead(user.id, workspace.id);
    if (success) {
      setEvents(events.map((event) => ({ ...event, is_read: true })));

      // Dispatch custom event to notify other components
      window.dispatchEvent(
        new CustomEvent("allEventsMarkedAsRead", {
          detail: { workspaceId: workspace.id },
        })
      );
    }
    setIsMarkingAllRead(false);
  };

  const unreadCount = events.filter((event) => !event.is_read).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              Inbox
              {unreadCount > 0 && (
                <Badge
                  variant="secondary"
                  className="bg-blue-100 text-blue-800"
                >
                  {unreadCount} unread
                </Badge>
              )}
            </DialogTitle>
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkAllAsRead}
                disabled={isMarkingAllRead}
              >
                {isMarkingAllRead ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Marking...
                  </>
                ) : (
                  <>
                    <CheckCheck className="mr-2 h-4 w-4" />
                    Mark all read
                  </>
                )}
              </Button>
            )}
          </div>
        </DialogHeader>

        <ScrollArea className="h-[500px] pr-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Loading events...</span>
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Circle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No events yet</p>
              <p className="text-sm">
                Activity in this workspace will appear here
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {events.map((event) => (
                <div
                  key={event.id}
                  className={`p-4 rounded-lg border transition-colors ${
                    event.is_read
                      ? "bg-white border-gray-200"
                      : getActionColor(event.type)
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={event.user?.avatar_url || ""} />
                      <AvatarFallback className="text-xs">
                        {event.user?.full_name?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        {getEntityIcon(event.entity_type)}
                        {getActionIcon(event.type)}
                        <span className="font-medium text-sm">
                          {event.user?.full_name || "Unknown User"}
                        </span>
                        <span className="text-sm text-gray-600">
                          {event.type}{" "}
                          {event.entity_type === "subtask"
                            ? "subtask"
                            : event.entity_type}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {event.entity_type}
                        </Badge>
                      </div>

                      <p className="text-sm text-gray-700 mb-2">
                        {event.description}
                      </p>

                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                          {formatDistanceToNow(new Date(event.created_at), {
                            addSuffix: true,
                          })}
                        </span>

                        {!event.is_read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMarkAsRead(event.id)}
                            className="text-xs h-6 px-2"
                          >
                            Mark as read
                          </Button>
                        )}
                      </div>
                    </div>

                    {!event.is_read && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
