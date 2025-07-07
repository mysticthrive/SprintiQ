"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useBrowserNotifications } from "@/hooks/use-browser-notifications";
import { useEnhancedToast } from "@/hooks/use-enhanced-toast";
import { Bell, BellOff, CheckCircle, AlertCircle } from "lucide-react";

export function BrowserNotificationDemo() {
  const { isEnabled, isSupported, requestPermission, sendNotification } =
    useBrowserNotifications();
  const { toast, browserNotificationsEnabled } = useEnhancedToast();

  const handleEnableNotifications = async () => {
    const granted = await requestPermission();
    if (granted) {
      toast({
        title: "Notifications Enabled",
        description:
          "You will now receive browser notifications for important events.",
        sendBrowserNotification: true,
      });
    } else {
      toast({
        title: "Permission Denied",
        description:
          "Please enable browser notifications in your browser settings.",
        variant: "destructive",
      });
    }
  };

  const handleSendTestNotification = () => {
    sendNotification(
      "Test Notification",
      "This is a test browser notification from SprintIQ!"
    );
  };

  const handleToastWithNotification = () => {
    toast({
      title: "Task Created",
      description: "Your task has been created successfully",
      sendBrowserNotification: true,
    });
  };

  const handleCustomNotification = () => {
    toast({
      title: "Custom Toast",
      description: "This toast also sends a browser notification",
      sendBrowserNotification: true,
      browserNotificationTitle: "Custom Browser Title",
      browserNotificationBody: "This is a custom browser notification message",
    });
  };

  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-500" />
            Browser Notifications Not Supported
          </CardTitle>
          <CardDescription>
            Your browser does not support browser notifications.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isEnabled ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <BellOff className="h-5 w-5 text-gray-500" />
            )}
            Browser Notifications Demo
          </CardTitle>
          <CardDescription>
            Test browser notifications functionality. These notifications will
            appear even when you're not on the SprintIQ tab.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Status:</span>
            <span
              className={`text-sm ${
                isEnabled ? "text-green-600" : "text-gray-600"
              }`}
            >
              {isEnabled ? "Enabled" : "Disabled"}
            </span>
          </div>

          {!isEnabled && (
            <Button onClick={handleEnableNotifications} className="w-full">
              <Bell className="mr-2 h-4 w-4" />
              Enable Browser Notifications
            </Button>
          )}

          {isEnabled && (
            <div className="space-y-2">
              <Button
                onClick={handleSendTestNotification}
                variant="outline"
                className="w-full"
              >
                Send Test Browser Notification
              </Button>

              <Button
                onClick={handleToastWithNotification}
                variant="outline"
                className="w-full"
              >
                Toast + Browser Notification
              </Button>

              <Button
                onClick={handleCustomNotification}
                variant="outline"
                className="w-full"
              >
                Custom Browser Notification
              </Button>
            </div>
          )}

          <div className="text-xs text-gray-500 space-y-1">
            <p>• Browser notifications work even when you're on other tabs</p>
            <p>• They require explicit permission from the user</p>
            <p>• Can be disabled through browser settings</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
