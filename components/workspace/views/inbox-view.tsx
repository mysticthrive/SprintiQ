"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
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
  Inbox,
  Mail,
  MailOpen,
  Goal,
} from "lucide-react";
import type { Event, Workspace } from "@/lib/database.types";

interface InboxViewProps {
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

export default function InboxView({ workspace }: InboxViewProps) {
  const { user } = useAuth();
  const supabase = createClientSupabaseClient();
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isMarkingAllRead, setIsMarkingAllRead] = useState(false);
  const [activeTab, setActiveTab] = useState("all");

  const loadEvents = useCallback(async () => {
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
        .in("type", ["created", "updated", "deleted", "reordered"])
        .order("created_at", { ascending: false })
        .limit(100);

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
  }, [supabase, workspace, user]);

  useEffect(() => {
    if (!user?.id) return;

    loadEvents();

    // Set up real-time subscription for new events
    const eventsSubscription = supabase
      .channel("events_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "events",
          filter: `and(workspace_id=eq.${workspace.id},user_id=eq.${user.id})`,
        },
        () => {
          loadEvents();
        }
      )
      .subscribe();

    return () => {
      eventsSubscription.unsubscribe();
    };
  }, [loadEvents, supabase, workspace.id, user?.id]);

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

  const unreadEvents = events.filter((event) => !event.is_read);
  const readEvents = events.filter((event) => event.is_read);

  const renderEventsList = (eventsList: Event[]) => {
    if (eventsList.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-full workspace-header-bg p-4">
          <div className="flex flex-col items-center justify-center gap-2">
            <Mail className="h-12 w-12 text-gray-300" />
            <p className="text-lg font-semibold workspace-sidebar-text">
              No events
            </p>
            <p className="text-sm workspace-text-muted max-w-sm text-center">
              {activeTab === "unread"
                ? "You're all caught up! No unread notifications."
                : "No events to display in this category."}
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {eventsList.map((event) => (
          <Card
            key={event.id}
            className={`transition-all duration-200 border cursor-pointer ${
              event.is_read
                ? "workspace-secondary-sidebar-bg"
                : "bg-white/10 hover:bg-white/10"
            } group`}
          >
            <CardContent className="p-2">
              <div className="flex items-center gap-2">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={event.user?.avatar_url || ""} />
                  <AvatarFallback className="text-sm workspace-component-bg workspace-component-active-color font-medium">
                    {event.user?.full_name?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className=" flex justify-between">
                    <div className="flex items-center flex-wrap gap-2">
                      <div className="flex items-center gap-1.5">
                        {getEntityIcon(event.entity_type)}
                        {getActionIcon(event.type)}
                        <span className="font-medium text-xs">
                          {event.user?.full_name || "Unknown User"}
                        </span>
                      </div>
                      <span className="text-xs workspace-sidebar-text">
                        {event.type}{" "}
                        {event.entity_type === "subtask"
                          ? "subtask"
                          : event.entity_type}
                      </span>
                      <Badge
                        variant="outline"
                        className="text-xs font-medium workspace-header-bg"
                      >
                        {event.entity_type}
                      </Badge>
                    </div>
                    {!event.is_read && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleMarkAsRead(event.id)}
                        className="text-xs h-7 px-3 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <MailOpen className="mr-1.5 h-3 w-3" />
                        Mark as read
                      </Button>
                    )}
                  </div>

                  <div className="flex justify-between">
                    <p className="text-xs workspace-sidebar-text leading-relaxed">
                      {event.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500 font-medium">
                        {formatDistanceToNow(new Date(event.created_at), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                {!event.is_read && (
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full workspace-header-bg">
      <div className="border-b workspace-border p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="workspace-component-bg w-8 h-8 flex items-center justify-center rounded-md">
              <Inbox className="h-4 w-4 workspace-component-active-color" />
            </div>
            <div>
              <h1 className="text-sm workspace-sidebar-text">Inbox</h1>
              <p className="text-xs workspace-text-muted">
                Stay updated with workspace activity
              </p>
            </div>
          </div>

          {unreadEvents.length > 0 && (
            <Button
              onClick={handleMarkAllAsRead}
              disabled={isMarkingAllRead}
              className="shadow-sm p-2 text-xs h-8 workspace-primary hover:workspace-primary-hover"
              variant={isMarkingAllRead ? "outline" : "default"}
            >
              {isMarkingAllRead ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Marking...
                </>
              ) : (
                <>
                  <CheckCheck className="mr-2 h-4 w-4" />
                  Mark all as read
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col min-h-0 pb-2">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex flex-col h-full"
        >
          <div className="p-2">
            <TabsList className="inline-flex h-10 items-center justify-center rounded-lg workspace-header-bg p-1">
              <TabsTrigger
                value="all"
                className="flex items-center gap-2 hover:workspace-component-bg data-[state=active]:workspace-component-bg data-[state=active]:workspace-component-active-color rounded-lg"
              >
                <Mail className="h-4 w-4" />
                All ({events.length})
              </TabsTrigger>
              <TabsTrigger
                value="unread"
                className="flex items-center gap-2 hover:workspace-component-bg data-[state=active]:workspace-component-bg data-[state=active]:workspace-component-active-color rounded-lg"
              >
                <Circle className="h-4 w-4" />
                Unread ({unreadEvents.length})
              </TabsTrigger>
              <TabsTrigger
                value="read"
                className="flex items-center gap-2 hover:workspace-component-bg data-[state=active]:workspace-component-bg data-[state=active]:workspace-component-active-color rounded-lg"
              >
                <MailOpen className="h-4 w-4" />
                Read ({readEvents.length})
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 min-h-0 px-3">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                <span className="ml-3 text-gray-600 font-medium">
                  Loading events...
                </span>
              </div>
            ) : (
              <>
                <TabsContent value="all" className="h-full m-0 outline-none">
                  <ScrollArea className="h-full">
                    <div className="pr-4">{renderEventsList(events)}</div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="unread" className="h-full m-0 outline-none">
                  <ScrollArea className="h-full">
                    <div className="pr-4">{renderEventsList(unreadEvents)}</div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="read" className="h-full m-0 outline-none">
                  <ScrollArea className="h-full">
                    <div className="pr-4">{renderEventsList(readEvents)}</div>
                  </ScrollArea>
                </TabsContent>
              </>
            )}
          </div>
        </Tabs>
      </div>
    </div>
  );
}
