# Browser Notifications

This document explains how browser notifications work in SprintiQ and how to use them in your components.

## Overview

Browser notifications are now handled by the browser's permission system rather than being stored in the database. This means:

- Notifications are shown even when the user is not on the SprintiQ tab
- The permission status is managed by the browser
- Users can enable/disable notifications through their browser settings

## How It Works

### 1. Permission Management

The browser notification permission is managed through the browser's native notification API:

```typescript
// Check if notifications are supported
if ("Notification" in window) {
  // Request permission
  const permission = await Notification.requestPermission();
  // permission can be 'granted', 'denied', or 'default'
}
```

### 2. Automatic Notifications

Browser notifications are automatically sent when events are created in the system (tasks, subtasks, etc.) if the user has granted permission.

### 3. Manual Notifications

You can also send browser notifications manually using the provided hooks and utilities.

## Usage

### Basic Browser Notification Hook

```typescript
import { useBrowserNotifications } from "@/hooks/use-browser-notifications";

function MyComponent() {
  const { isEnabled, isSupported, requestPermission, sendNotification } =
    useBrowserNotifications();

  const handleEnableNotifications = async () => {
    const granted = await requestPermission();
    if (granted) {
      console.log("Notifications enabled!");
    }
  };

  const handleSendNotification = () => {
    sendNotification("Hello!", "This is a test notification");
  };

  return (
    <div>
      {!isSupported && <p>Browser notifications are not supported</p>}
      {!isEnabled && (
        <button onClick={handleEnableNotifications}>
          Enable Notifications
        </button>
      )}
      {isEnabled && (
        <button onClick={handleSendNotification}>Send Test Notification</button>
      )}
    </div>
  );
}
```

### Enhanced Toast with Browser Notifications

```typescript
import { useEnhancedToast } from "@/hooks/use-enhanced-toast";

function MyComponent() {
  const { toast, browserNotificationsEnabled } = useEnhancedToast();

  const handleSuccess = () => {
    toast({
      title: "Task Created",
      description: "Your task has been created successfully",
      sendBrowserNotification: true, // This will also send a browser notification
    });
  };

  const handleCustomNotification = () => {
    toast({
      title: "Custom Title",
      description: "Custom description",
      sendBrowserNotification: true,
      browserNotificationTitle: "Custom Browser Title",
      browserNotificationBody: "Custom browser notification body",
    });
  };

  return (
    <div>
      <button onClick={handleSuccess}>Create Task</button>
      <button onClick={handleCustomNotification}>Custom Notification</button>
    </div>
  );
}
```

### Direct Utility Functions

```typescript
import {
  sendBrowserNotification,
  isBrowserNotificationsEnabled,
} from "@/lib/events";

// Check if notifications are enabled
if (isBrowserNotificationsEnabled()) {
  sendBrowserNotification("Title", "Body message");
}
```

## Settings

Users can manage browser notifications in the notification settings page:

1. **Enable Notifications**: Requests browser permission to show notifications
2. **Disable Notifications**: Directs users to browser settings (cannot be done programmatically)
3. **Status Display**: Shows current permission status

## Best Practices

1. **Always check support**: Use `isSupported` to check if the browser supports notifications
2. **Respect user choice**: Don't spam notifications - only send important ones
3. **Provide context**: Use descriptive titles and bodies
4. **Handle permission denial**: Provide clear instructions when permission is denied
5. **Test thoroughly**: Test on different browsers and devices

## Browser Compatibility

- **Chrome**: Full support
- **Firefox**: Full support
- **Safari**: Full support (requires HTTPS)
- **Edge**: Full support
- **Mobile browsers**: Limited support (varies by platform)

## Security Considerations

- Notifications only work on HTTPS in production
- Users must explicitly grant permission
- Cannot be bypassed programmatically
- Respect user privacy and preferences

## Troubleshooting

### Common Issues

1. **Notifications not showing**: Check if permission is granted
2. **Permission denied**: User needs to enable in browser settings
3. **Not working on mobile**: Mobile browsers have limited support
4. **HTTPS required**: Notifications require secure context in production

### Debug Tips

```typescript
// Check current permission status
console.log("Notification permission:", Notification.permission);

// Check if supported
console.log("Notifications supported:", "Notification" in window);

// Test notification
if (Notification.permission === "granted") {
  new Notification("Test", { body: "Test notification" });
}
```
