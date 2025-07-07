"use client";

import type React from "react";
import { useActionState, startTransition } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Inbox, Mail, Monitor, ChevronUp } from "lucide-react";
import type { Profile } from "@/lib/database.types";
import { updateProfile } from "@/app/[workspaceId]/settings/actions"; // Use the consolidated action
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import SlackSvg from "../svg/apps/SlackSvg";
import { useEnhancedToast } from "@/hooks/use-enhanced-toast";
import { useBrowserNotifications } from "@/hooks/use-browser-notifications";
import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { SlackChannelMappingModal } from "./slack-channel-mapping-modal";

interface NotificationSettingsFormProps {
  profile: Profile | null;
}

export function NotificationSettingsForm({
  profile,
}: NotificationSettingsFormProps) {
  const [state, formAction, isPending] = useActionState(
    async (
      state: { success: boolean; message: string } | null,
      formData: FormData
    ) => {
      return await updateProfile(formData);
    },
    null
  );
  const [isSaving, setIsSaving] = useState(false);

  // Use the browser notifications hook
  const { isEnabled: browserNotificationsEnabled, requestPermission } =
    useBrowserNotifications();

  // Notification settings states
  const [inboxNotifications, setInboxNotifications] = useState(
    profile?.inbox_notifications || "Default"
  );
  const [emailNotifications, setEmailNotifications] = useState(
    profile?.email_notifications || "None"
  );
  const [mobileNotifications, setMobileNotifications] = useState(
    profile?.mobile_notifications || "Default"
  );
  const [autoWatchTasks, setAutoWatchTasks] = useState<boolean>(
    profile?.auto_watch_tasks ?? true
  );
  const [autoWatchCreateTask, setAutoWatchCreateTask] = useState<boolean>(
    profile?.auto_watch_create_task ?? true
  );
  const [autoWatchNewSubtask, setAutoWatchNewSubtask] = useState<boolean>(
    profile?.auto_watch_new_subtask ?? false
  );
  const [autoWatchEditTask, setAutoWatchEditTask] = useState<boolean>(
    profile?.auto_watch_edit_task ?? true
  );
  const [autoWatchCommentTask, setAutoWatchCommentTask] = useState<boolean>(
    profile?.auto_watch_comment_task ?? true
  );
  const [smartNotificationsEnabled, setSmartNotificationsEnabled] = useState(
    profile?.smart_notifications_enabled || false
  );
  const [smartNotificationsDelay, setSmartNotificationsDelay] = useState(
    profile?.smart_notifications_delay || "5 minutes"
  );
  const [isAutoWatchOpen, setIsAutoWatchOpen] = useState(true);

  // Slack integration states
  const params = useParams();
  const workspaceId = params?.workspaceId as string;
  const [slackIntegration, setSlackIntegration] = useState<any>(null);
  const [isConnectingSlack, setIsConnectingSlack] = useState(false);
  const [slackChannels, setSlackChannels] = useState<any[]>([]);
  const [isLoadingChannels, setIsLoadingChannels] = useState(false);
  const [channelMappings, setChannelMappings] = useState<any[]>([]);
  const [isMappingModalOpen, setIsMappingModalOpen] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState<any>(null);

  const notificationOptions = ["Default", "All", "None"];
  const smartNotificationDelays = [
    "5 minutes",
    "10 minutes",
    "30 minutes",
    "1 hour",
  ];
  const { toast } = useEnhancedToast();

  // Check for URL parameters on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get("success");
    const error = urlParams.get("error");
    const message = urlParams.get("message");

    if (success === "slack_connected") {
      toast({
        title: "Slack Connected Successfully",
        description: "Your Slack workspace has been connected successfully.",
      });
      // Clear URL parameters
      window.history.replaceState({}, "", window.location.pathname);
    } else if (error) {
      let errorTitle = "Slack Connection Failed";
      let errorDescription = message || "Failed to connect Slack workspace.";

      // Provide more specific error messages
      if (error === "slack_oauth_failed") {
        if (message?.includes("non_distributed_app")) {
          errorTitle = "Slack App Configuration Issue";
          errorDescription =
            "This Slack app needs to be configured for multiple workspaces. Please contact your administrator.";
        } else if (message?.includes("access_denied")) {
          errorTitle = "Access Denied";
          errorDescription =
            "You denied access to the Slack app. Please try again and make sure to authorize it.";
        } else if (message?.includes("invalid_client")) {
          errorTitle = "Invalid App Configuration";
          errorDescription =
            "The Slack app is not configured correctly. Please check your app settings.";
        }
      } else if (error === "missing_env_vars") {
        errorTitle = "Configuration Error";
        errorDescription =
          "Slack integration is not properly configured. Please contact your administrator.";
      }

      toast({
        title: errorTitle,
        description: errorDescription,
        variant: "destructive",
      });
      // Clear URL parameters
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [toast]);

  // Check if Slack is connected
  useEffect(() => {
    if (workspaceId) {
      checkSlackConnection();
    }
  }, [workspaceId]);

  const checkSlackConnection = async () => {
    try {
      const response = await fetch(
        `/api/slack/channels?workspaceId=${workspaceId}`
      );
      if (response.ok) {
        const data = await response.json();
        setSlackIntegration({ connected: true });
        setSlackChannels(data.channels || []);
        // Load channel mappings
        loadChannelMappings();
      } else {
        setSlackIntegration(null);
      }
    } catch (error) {
      console.error("Failed to check Slack connection:", error);
      setSlackIntegration(null);
    }
  };

  const loadChannelMappings = async () => {
    try {
      const response = await fetch(
        `/api/slack/channel-mapping?workspaceId=${workspaceId}`
      );
      if (response.ok) {
        const data = await response.json();
        setChannelMappings(data.mappings || []);
      }
    } catch (error) {
      console.error("Failed to load channel mappings:", error);
    }
  };

  const handleAddChannelMapping = (
    entityType: string,
    entityId: string,
    entityName: string
  ) => {
    setSelectedEntity({ type: entityType, id: entityId, name: entityName });
    setIsMappingModalOpen(true);
  };

  const handleMappingSaved = () => {
    loadChannelMappings();
    setIsMappingModalOpen(false);
    setSelectedEntity(null);
  };

  const handleSlackConnect = async () => {
    if (!workspaceId) return;

    setIsConnectingSlack(true);
    try {
      const response = await fetch(
        `/api/slack/oauth?workspaceId=${workspaceId}`
      );
      const data = await response.json();

      if (data.success && data.oauthUrl) {
        window.location.href = data.oauthUrl;
      } else {
        toast({
          title: "Connection Failed",
          description: "Failed to initiate Slack connection.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to connect Slack:", error);
      toast({
        title: "Connection Failed",
        description: "Failed to connect to Slack.",
        variant: "destructive",
      });
    } finally {
      setIsConnectingSlack(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const formData = new FormData();
    formData.append("inboxNotifications", inboxNotifications);
    formData.append("emailNotifications", emailNotifications);
    // Remove browser notifications from form data since it's not saved to DB
    formData.append("mobileNotifications", mobileNotifications);
    formData.append("autoWatchTasks", autoWatchTasks ? "on" : "off");
    formData.append("autoWatchCreateTask", autoWatchCreateTask ? "on" : "off");
    formData.append("autoWatchNewSubtask", autoWatchNewSubtask ? "on" : "off");
    formData.append("autoWatchEditTask", autoWatchEditTask ? "on" : "off");
    formData.append(
      "autoWatchCommentTask",
      autoWatchCommentTask ? "on" : "off"
    );
    formData.append(
      "smartNotificationsEnabled",
      smartNotificationsEnabled ? "on" : "off"
    );
    formData.append("smartNotificationsDelay", smartNotificationsDelay);

    startTransition(() => {
      formAction(formData);
    });
    setIsSaving(false);
  };

  const handleBrowserNotificationToggle = async () => {
    if (!browserNotificationsEnabled) {
      // Request permission when enabling notifications
      const granted = await requestPermission();
      if (granted) {
        toast({
          title: "Browser Notifications Enabled",
          description:
            "You will now receive browser notifications for important events.",
          browserNotificationTitle: "Browser Notifications Enabled",
          browserNotificationBody:
            "You will now receive browser notifications for important events.",
        });
      } else {
        // If permission is denied, show a message
        toast({
          title: "Permission Denied",
          description:
            "Please enable browser notifications in your browser settings to receive notifications.",
          variant: "destructive",
        });
      }
    } else {
      // Cannot programmatically disable browser notifications
      // User needs to disable them in browser settings
      toast({
        title: "Browser Notifications",
        description:
          "To disable browser notifications, please go to your browser settings and disable notifications for this site.",
      });
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">Notification Settings</h2>
          <p className="text-sm text-muted-foreground">
            Learn more about customizing your notifications.
          </p>
        </div>

        <div className="grid gap-4">
          {/* Inbox Notifications */}
          <div className="flex items-center justify-between rounded-lg border workspace-border p-4">
            <div className="flex items-center gap-3">
              <Inbox className="h-5 w-5 text-gray-500" />
              <div>
                <p className="font-medium text-sm">Inbox</p>
                <p className="text-xs text-muted-foreground">
                  {inboxNotifications === "None"
                    ? "No notifications will be sent to your inbox"
                    : inboxNotifications === "Default"
                    ? "Only important notifications will be sent to your inbox"
                    : "All workspace notifications will be sent to your inbox"}
                </p>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="w-[140px] justify-between text-xs p-2 h-8"
                  disabled={isPending}
                >
                  {inboxNotifications}
                  <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-[140px]">
                {notificationOptions.map((option) => (
                  <DropdownMenuItem
                    key={option}
                    onSelect={() => setInboxNotifications(option)}
                    className="text-xs cursor-pointer"
                  >
                    {option}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Email Notifications */}
          <div className="flex items-center justify-between rounded-lg border workspace-border p-4">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-gray-500" />
              <div>
                <p className="font-medium text-sm">Email</p>
                <p className="text-xs text-muted-foreground">
                  {emailNotifications === "None"
                    ? "No notifications will be sent to your email"
                    : emailNotifications === "Default"
                    ? "Only important notifications will be sent to your email"
                    : "All workspace notifications will be sent to your email"}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-[140px] justify-between text-xs p-2 h-8"
                    disabled={isPending}
                  >
                    {emailNotifications}
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[140px]">
                  {notificationOptions.map((option) => (
                    <DropdownMenuItem
                      key={option}
                      onSelect={() => setEmailNotifications(option)}
                      className="text-xs cursor-pointer"
                    >
                      {option}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Browser Notifications */}
          <div className="flex items-center justify-between rounded-lg border workspace-border p-4">
            <div className="flex items-center gap-3">
              <Monitor className="h-5 w-5 text-gray-500" />
              <div>
                <p className="font-medium text-sm">Browser</p>
                <p className="text-xs text-muted-foreground">
                  {browserNotificationsEnabled
                    ? "Browser notifications are enabled"
                    : "Browser notifications are disabled"}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleBrowserNotificationToggle}
                disabled={isPending}
                className="text-xs p-2 h-8 w-[140px]"
              >
                {browserNotificationsEnabled
                  ? "Disable notifications"
                  : "Enable notifications"}
              </Button>
            </div>
          </div>
        </div>

        <hr className="my-8 workspace-border" />

        {/* Integrations */}
        <div className="space-y-4">
          <h3 className="text-md font-semibold">Integrations</h3>
        </div>
        <div className="flex items-center justify-between rounded-lg border workspace-border p-4">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5">
              <SlackSvg />
            </div>
            <div>
              <p className="font-medium text-sm">Slack</p>
              <p className="text-xs text-muted-foreground">
                {slackIntegration
                  ? "Connected to Slack workspace"
                  : "Sync activity that occurs in Spaces, Folders, or Lists to Slack channels of your choice."}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={handleSlackConnect}
            disabled={isPending || isConnectingSlack}
            className="text-xs p-2 h-8 w-[140px] gap-1"
          >
            <SlackSvg />
            {isConnectingSlack
              ? "Connecting..."
              : slackIntegration
              ? "Connected"
              : "Connect account"}
          </Button>
        </div>

        {/* Slack Channel Mappings */}
        {slackIntegration && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">Channel Mappings</h4>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  handleAddChannelMapping("workspace", workspaceId, "Workspace")
                }
                className="text-xs"
              >
                Add Workspace Mapping
              </Button>
            </div>

            {channelMappings.length > 0 ? (
              <div className="space-y-2">
                {channelMappings.map((mapping) => (
                  <div
                    key={mapping.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        #{mapping.channel_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {mapping.entity_type}: {mapping.entity_name}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // TODO: Implement delete mapping
                        toast({
                          title: "Delete Mapping",
                          description:
                            "Delete functionality will be implemented soon.",
                        });
                      }}
                      className="text-xs text-red-600 hover:text-red-700"
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-sm text-muted-foreground">
                No channel mappings configured. Add a mapping to start receiving
                notifications.
              </div>
            )}
          </div>
        )}

        <hr className="my-8 workspace-border" />

        {/* General settings */}
        <div>
          <h3 className="text-md font-semibold">General settings</h3>
        </div>

        <Collapsible
          open={isAutoWatchOpen}
          onOpenChange={setIsAutoWatchOpen}
          className="rounded-lg border workspace-border"
        >
          <CollapsibleTrigger asChild>
            <div className="flex items-center justify-between p-4 cursor-pointer">
              <div className="flex items-center gap-2">
                <Switch
                  id="autoWatchTasks"
                  variant="workspace"
                  checked={autoWatchTasks}
                  onCheckedChange={(checked) => setAutoWatchTasks(checked)}
                  disabled={isPending}
                  onClick={(e) => e.stopPropagation()} // Prevent collapsible from toggling when switch is clicked
                />
                <Label
                  htmlFor="autoWatchTasks"
                  className="font-medium cursor-pointer text-xs"
                >
                  Auto watch tasks I am involved in
                </Label>
              </div>
              {isAutoWatchOpen ? (
                <ChevronUp className="h-5 w-5 text-gray-500" />
              ) : (
                <ChevronDown className="h-5 w-5 text-gray-500" />
              )}
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 p-4 pt-0">
            <p className="text-xs text-muted-foreground">
              When I create a task or subtask • When I edit a task or subtask •
              When I comment on a task or subtask
            </p>
            <div className="grid gap-3 pl-8">
              <div className="flex items-center space-x-2">
                <Switch
                  id="autoWatchCreateTask"
                  variant="workspace"
                  checked={autoWatchCreateTask}
                  onCheckedChange={setAutoWatchCreateTask}
                  disabled={isPending}
                  className="h-4"
                />
                <Label htmlFor="autoWatchCreateTask" className="text-xs">
                  When I create a task or subtask
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="autoWatchNewSubtask"
                  variant="workspace"
                  checked={autoWatchNewSubtask}
                  onCheckedChange={setAutoWatchNewSubtask}
                  disabled={isPending}
                />
                <Label htmlFor="autoWatchNewSubtask" className="text-xs">
                  When a new subtask is created in a parent task I'm watching
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="autoWatchEditTask"
                  variant="workspace"
                  checked={autoWatchEditTask}
                  onCheckedChange={setAutoWatchEditTask}
                  disabled={isPending}
                />
                <Label htmlFor="autoWatchEditTask" className="text-xs">
                  When I edit a task or subtask
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="autoWatchCommentTask"
                  variant="workspace"
                  checked={autoWatchCommentTask}
                  onCheckedChange={setAutoWatchCommentTask}
                  disabled={isPending}
                />
                <Label htmlFor="autoWatchCommentTask" className="text-xs">
                  When I comment on a task or subtask
                </Label>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        <div className="flex items-center justify-between rounded-lg border workspace-border p-4">
          <div className="flex items-center gap-3">
            <Switch
              id="smartNotificationsEnabled"
              variant="workspace"
              checked={smartNotificationsEnabled}
              onCheckedChange={setSmartNotificationsEnabled}
              disabled={isPending}
            />
            <div>
              <Label
                htmlFor="smartNotificationsEnabled"
                className="font-medium text-sm"
              >
                Smart notifications
              </Label>
              <p className="text-xs text-muted-foreground">
                Delay sending notifications if I'm online
              </p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="w-[140px] justify-between text-xs p-2 h-8"
                disabled={isPending}
              >
                {smartNotificationsDelay}
                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[140px]">
              {smartNotificationDelays.map((delay) => (
                <DropdownMenuItem
                  key={delay}
                  onSelect={() => setSmartNotificationsDelay(delay)}
                  className="text-xs cursor-pointer"
                >
                  {delay}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {state && (
          <p
            className={`text-sm ${
              state.success ? "text-green-500" : "text-red-500"
            }`}
          >
            {state.message}
          </p>
        )}
        <Button
          type="submit"
          disabled={isPending || isSaving}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          {isPending || isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </form>

      {/* Slack Channel Mapping Modal */}
      {selectedEntity && (
        <SlackChannelMappingModal
          isOpen={isMappingModalOpen}
          onClose={() => {
            setIsMappingModalOpen(false);
            setSelectedEntity(null);
          }}
          workspaceId={workspaceId}
          entityType={selectedEntity.type}
          entityId={selectedEntity.id}
          entityName={selectedEntity.name}
          onMappingSaved={handleMappingSaved}
        />
      )}
    </div>
  );
}
