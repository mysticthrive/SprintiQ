import { BrowserNotificationDebug } from "@/components/debug/browser-notification-debug";
import { BrowserNotificationDemo } from "@/components/examples/browser-notification-demo";

export default function BrowserNotificationDebugPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Browser Notification Debug</h1>
        <p className="text-muted-foreground">
          Use this page to troubleshoot browser notification issues.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <BrowserNotificationDebug />
        <BrowserNotificationDemo />
      </div>

      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-2">
          Common Issues & Solutions
        </h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>
            • <strong>Permission denied:</strong> Check browser settings and
            allow notifications for this site
          </li>
          <li>
            • <strong>Not HTTPS:</strong> Browser notifications require HTTPS in
            production
          </li>
          <li>
            • <strong>Mobile browser:</strong> Limited support on mobile devices
          </li>
          <li>
            • <strong>Browser blocked:</strong> Some browsers block
            notifications by default
          </li>
          <li>
            • <strong>Focus required:</strong> Some browsers require the tab to
            be focused
          </li>
          <li>
            • <strong>Do Not Disturb:</strong> Check if Do Not Disturb is
            enabled on your system
          </li>
        </ul>
      </div>
    </div>
  );
}
