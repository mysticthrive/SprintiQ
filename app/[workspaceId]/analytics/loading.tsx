import {
  DashboardWidgetSkeleton,
  TableSkeleton,
} from "@/components/ui/skeleton-loaders";

export default function AnalyticsLoading() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Analytics</h1>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <DashboardWidgetSkeleton />
        <DashboardWidgetSkeleton />
        <DashboardWidgetSkeleton />
      </div>

      {/* Data Tables */}
      <div className="space-y-6">
        <div className="bg-card rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Performance Metrics</h2>
          <TableSkeleton rows={5} />
        </div>

        <div className="bg-card rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Team Activity</h2>
          <TableSkeleton rows={3} />
        </div>
      </div>
    </div>
  );
}
