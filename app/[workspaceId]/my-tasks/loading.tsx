import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckSquare } from "lucide-react";

export default function MyTasksLoading() {
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b workspace-border p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="workspace-component-bg w-8 h-8 flex items-center justify-center rounded-md">
              <CheckSquare className="h-4 w-4 workspace-component-active-color" />
            </div>
            <div>
              <h1 className="text-sm workspace-sidebar-text">My Tasks</h1>
              <p className="text-xs workspace-text-muted">
                Manage tasks assigned to you and tasks you've created
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="border-b workspace-border flex items-center justify-between p-3">
        <div className="flex items-center gap-2">
          <Skeleton className="w-40 h-9" />
          <Skeleton className="w-40 h-9" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="w-20 h-7" />
          <Skeleton className="w-20 h-7" />
        </div>
      </div>
      <div className="p-3">
        <Skeleton className="w-32 h-3 mb-2" />
        {Array.from({ length: 5 }).map((_, i) => (
          <Card
            key={i}
            className="hover:shadow-md transition-shadow cursor-pointer border workspace-border workspace-header-bg mb-2"
          >
            <CardContent className="p-4">
              <div className="flex flex-col gap-2">
                <div className="flex gap-2 items-center">
                  <Skeleton className="w-8 h-8" />
                  <div className="flex flex-col gap-1 flex-1">
                    <Skeleton className="w-24 h-4" />
                    <Skeleton className="w-full h-3" />
                    <Skeleton className="w-full h-3" />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Skeleton className="w-16 h-4" />
                    <Skeleton className="w-20 h-4" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Skeleton className="w-16 h-4" />
                    <Skeleton className="w-20 h-4" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
