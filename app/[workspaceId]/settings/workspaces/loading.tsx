import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

export default function WorkspacesLoading() {
  return (
    <div>
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-bold">Workspaces</h1>
          <p className="text-muted-foreground">
            Manage your workspaces and create new ones
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
          {/* Sidebar */}
          {Array.from({ length: 3 }).map((_, i) => (
            <Card
              key={i}
              className="relative border workspace-border bg-gray-100/50"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-200 animate-pulse" />
                    <div className="flex flex-col gap-2">
                      <div className="w-20 h-4 bg-gray-200 animate-pulse" />
                      <div className="flex gap-2">
                        <div className="w-10 h-4 bg-gray-200 animate-pulse" />
                        <div className="w-10 h-4 bg-gray-200 animate-pulse" />
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <div className="w-10 h-4 bg-gray-200 animate-pulse" />
                  <div className="w-10 h-4 bg-gray-200 animate-pulse" />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-6 h-4 bg-gray-200 animate-pulse" />
                    <div className="w-20 h-4 bg-gray-200 animate-pulse" />
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-6 h-4 bg-gray-200 animate-pulse" />
                    <div className="w-20 h-4 bg-gray-200 animate-pulse" />
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-6 h-4 bg-gray-200 animate-pulse" />
                    <div className="w-20 h-4 bg-gray-200 animate-pulse" />
                  </div>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between gap-2">
                  <div className="w-40 h-4 bg-gray-200 animate-pulse" />
                  <div className="w-20 h-4 bg-gray-200 animate-pulse" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
