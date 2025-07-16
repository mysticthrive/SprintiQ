"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  Bell,
  BellOff,
} from "lucide-react";
import {
  sendBrowserNotification,
  isBrowserNotificationsEnabled,
} from "@/lib/events";

interface DebugInfo {
  isSupported: boolean;
  permission: string;
  isEnabled: boolean;
  isSecure: boolean;
  userAgent: string;
  isMobile: boolean;
  isInIframe: boolean;
}

export function BrowserNotificationDebug() {
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [testResult, setTestResult] = useState<string>("");

  useEffect(() => {
    const getDebugInfo = (): DebugInfo => {
      const isSupported = "Notification" in window;
      const permission = isSupported
        ? Notification.permission
        : "not-supported";
      const isEnabled = isBrowserNotificationsEnabled();
      const isSecure =
        window.location.protocol === "https:" ||
        window.location.hostname === "localhost";
      const userAgent = navigator.userAgent;
      const isMobile =
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          userAgent
        );
      const isInIframe = window !== window.top;

      return {
        isSupported,
        permission,
        isEnabled,
        isSecure,
        userAgent,
        isMobile,
        isInIframe,
      };
    };

    setDebugInfo(getDebugInfo());

    // Listen for permission changes
    if ("permissions" in navigator) {
      navigator.permissions
        .query({ name: "notifications" })
        .then((permissionStatus) => {
          permissionStatus.addEventListener("change", () => {
            setDebugInfo(getDebugInfo());
          });
        });
    }
  }, []);

  const handleRequestPermission = async () => {
    if (!debugInfo?.isSupported) return;

    try {
      const permission = await Notification.requestPermission();
      setTestResult(`Permission request result: ${permission}`);
      setDebugInfo((prev) =>
        prev
          ? { ...prev, permission, isEnabled: permission === "granted" }
          : null
      );
    } catch (error) {
      setTestResult(`Permission request failed: ${error}`);
    }
  };

  const handleTestNotification = () => {
    if (!debugInfo?.isEnabled) {
      setTestResult("Cannot send notification: permission not granted");
      return;
    }

    try {
      sendBrowserNotification(
        "Test Notification",
        "This is a test browser notification from SprintiQ!"
      );
      setTestResult("Test notification sent successfully!");
    } catch (error) {
      setTestResult(`Failed to send notification: ${error}`);
    }
  };

  const handleDirectNotification = () => {
    if (!debugInfo?.isEnabled) {
      setTestResult("Cannot send notification: permission not granted");
      return;
    }

    try {
      new Notification("Direct Test", {
        body: "This is a direct browser notification test",
        icon: "/favicon.ico",
      });
      setTestResult("Direct notification sent successfully!");
    } catch (error) {
      setTestResult(`Failed to send direct notification: ${error}`);
    }
  };

  if (!debugInfo) {
    return <div>Loading debug info...</div>;
  }

  const getStatusIcon = (condition: boolean) => {
    return condition ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <XCircle className="h-4 w-4 text-red-500" />
    );
  };

  const getPermissionBadge = (permission: string) => {
    const variants = {
      granted: "default",
      denied: "destructive",
      default: "secondary",
      "not-supported": "outline",
    } as const;

    return (
      <Badge
        variant={variants[permission as keyof typeof variants] || "outline"}
      >
        {permission}
      </Badge>
    );
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Browser Notification Debug
          </CardTitle>
          <CardDescription>
            Diagnostic information to help troubleshoot browser notification
            issues
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status Overview */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              {getStatusIcon(debugInfo.isSupported)}
              <span className="text-sm">Supported</span>
            </div>
            <div className="flex items-center gap-2">
              {getStatusIcon(debugInfo.isEnabled)}
              <span className="text-sm">Enabled</span>
            </div>
            <div className="flex items-center gap-2">
              {getStatusIcon(debugInfo.isSecure)}
              <span className="text-sm">Secure Context</span>
            </div>
            <div className="flex items-center gap-2">
              {getStatusIcon(!debugInfo.isInIframe)}
              <span className="text-sm">Not in iframe</span>
            </div>
          </div>

          {/* Permission Status */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Permission:</span>
            {getPermissionBadge(debugInfo.permission)}
          </div>

          {/* Issues */}
          {!debugInfo.isSupported && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Browser notifications are not supported in this browser.
              </AlertDescription>
            </Alert>
          )}

          {!debugInfo.isSecure && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Browser notifications require HTTPS in production. You're
                currently on HTTP.
              </AlertDescription>
            </Alert>
          )}

          {debugInfo.isInIframe && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Browser notifications may not work properly when the app is
                embedded in an iframe.
              </AlertDescription>
            </Alert>
          )}

          {debugInfo.isMobile && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Mobile browsers have limited support for browser notifications.
              </AlertDescription>
            </Alert>
          )}

          {/* Test Actions */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Test Actions</h4>

            {!debugInfo.isEnabled && debugInfo.isSupported && (
              <Button onClick={handleRequestPermission} className="w-full">
                <Bell className="mr-2 h-4 w-4" />
                Request Permission
              </Button>
            )}

            {debugInfo.isEnabled && (
              <div className="space-y-2">
                <Button
                  onClick={handleTestNotification}
                  variant="outline"
                  className="w-full"
                >
                  Test via Utility Function
                </Button>
                <Button
                  onClick={handleDirectNotification}
                  variant="outline"
                  className="w-full"
                >
                  Test Direct Notification
                </Button>
              </div>
            )}
          </div>

          {/* Test Results */}
          {testResult && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>{testResult}</AlertDescription>
            </Alert>
          )}

          {/* Debug Info */}
          <details className="text-xs">
            <summary className="cursor-pointer font-medium">
              Debug Information
            </summary>
            <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </details>
        </CardContent>
      </Card>
    </div>
  );
}
