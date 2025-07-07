import { useState, useEffect } from "react";
import {
  sendBrowserNotification,
  isBrowserNotificationsEnabled,
} from "@/lib/events";

export function useBrowserNotifications() {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    // Check if browser notifications are supported
    setIsSupported("Notification" in window);

    // Check current permission status
    const checkPermission = () => {
      setIsEnabled(isBrowserNotificationsEnabled());
    };

    checkPermission();

    // Listen for permission changes
    if ("permissions" in navigator) {
      navigator.permissions
        .query({ name: "notifications" })
        .then((permissionStatus) => {
          permissionStatus.addEventListener("change", checkPermission);
        });
    }
  }, []);

  const requestPermission = async (): Promise<boolean> => {
    if (!isSupported) {
      console.log("Browser notifications are not supported");
      return false;
    }

    const permission = await Notification.requestPermission();
    setIsEnabled(permission === "granted");
    return permission === "granted";
  };

  const sendNotification = (title: string, body: string) => {
    if (isEnabled) {
      sendBrowserNotification(title, body);
    }
  };

  return {
    isEnabled,
    isSupported,
    requestPermission,
    sendNotification,
  };
}
