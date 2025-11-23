"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/components/card";
import { Activity, CheckCircle, XCircle, Clock } from "lucide-react";

interface WorkflowStatsProps {
  totalRuns: number;
  successRate: number;
  averageDuration: number;
  failedRuns: number;
}

export function WorkflowStats({
  totalRuns,
  successRate,
  averageDuration,
  failedRuns,
}: WorkflowStatsProps) {
  const stats = [
    {
      title: "Total Runs",
      value: totalRuns.toLocaleString(),
      icon: Activity,
      description: "All time executions",
    },
    {
      title: "Success Rate",
      value: `${successRate.toFixed(1)}%`,
      icon: CheckCircle,
      description: "Successful executions",
      color: "text-green-500",
    },
    {
      title: "Avg Duration",
      value: `${(averageDuration / 1000).toFixed(2)}s`,
      icon: Clock,
      description: "Per execution",
      color: "text-blue-500",
    },
    {
      title: "Failed Runs",
      value: failedRuns.toLocaleString(),
      icon: XCircle,
      description: "Requires attention",
      color: "text-red-500",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {stat.title}
            </CardTitle>
            <stat.icon className={`h-4 w-4 ${stat.color || 'text-muted-foreground'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stat.color || ''}`}>
              {stat.value}
            </div>
            <p className="text-xs text-muted-foreground">
              {stat.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

