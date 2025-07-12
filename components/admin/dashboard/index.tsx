import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

export interface Metric {
  label: string;
  icon: React.ElementType;
  value: number;
  percent: number;
  sub: string;
}

interface AdminDashboardClientProps {
  metrics: Metric[];
}

const AdminDashboardClient: React.FC<AdminDashboardClientProps> = ({
  metrics,
}) => {
  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-muted-foreground text-sm">
          Platform-wide analytics overview
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {metrics.map((metric) => {
          const isPositive = metric.percent >= 0;
          const Icon = metric.icon;
          return (
            <Card
              key={metric.label}
              className="group relative overflow-hidden border shadow-sm hover:shadow-md transition-all duration-300"
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {metric.label}
                </CardTitle>
                <Icon className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <div className="text-2xl font-bold">{metric.value}</div>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground mt-1">
                    {metric.sub}
                  </p>
                  <div
                    className={
                      "flex items-center text-xs font-semibold " +
                      (isPositive ? "text-emerald-600" : "text-rose-600")
                    }
                  >
                    {isPositive ? (
                      <ArrowUpRight className="h-4 w-4" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4" />
                    )}
                    {isPositive ? "+" : ""}
                    {metric.percent}%
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </>
  );
};

export default AdminDashboardClient;
