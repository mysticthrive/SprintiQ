import { Button } from "@/components/ui/button";
import { InboxItemSkeleton } from "@/components/ui/skeleton-loaders";
import { CheckCheck, Inbox } from "lucide-react";

export default function InboxLoading() {
  return (
    <div className="p-3 space-y-3">
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
        </div>
      </div>
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <InboxItemSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
