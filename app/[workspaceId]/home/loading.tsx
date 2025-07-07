import { DashboardWidgetSkeleton } from "@/components/ui/skeleton-loaders";

export default function HomeLoading() {
  return (
    <div className="p-6">
      {/* Welcome Section */}
      <div className="mb-8">
        <div className="h-8 w-64 bg-gray-200 rounded-lg animate-pulse mb-2" />
        <div className="h-4 w-96 bg-gray-100 rounded-lg animate-pulse" />
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <DashboardWidgetSkeleton />
        <DashboardWidgetSkeleton />
        <DashboardWidgetSkeleton />
        <DashboardWidgetSkeleton />
      </div>

      {/* Quick Actions and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DashboardWidgetSkeleton />
        <DashboardWidgetSkeleton />
      </div>
    </div>
  );
}
