'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, FileText, TrendingUp, Activity } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string | number;
  change?: string;
  icon: React.ReactNode;
  loading?: boolean;
}

function KPICard({ title, value, change, icon, loading }: KPICardProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-4 rounded" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-32 mb-2" />
          <Skeleton className="h-3 w-20" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{value}</div>
        {change && (
          <p className="text-xs text-success mt-1">
            {change}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export function DashboardKPIs({ loading = false }: { loading?: boolean }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <KPICard
        title="Total Projects"
        value={loading ? '...' : 127}
        change="+12% from last month"
        icon={<FileText className="h-4 w-4" />}
        loading={loading}
      />
      <KPICard
        title="Active Users"
        value={loading ? '...' : 2453}
        change="+8% from last month"
        icon={<Users className="h-4 w-4" />}
        loading={loading}
      />
      <KPICard
        title="Revenue"
        value={loading ? '...' : '$45,231'}
        change="+20% from last month"
        icon={<TrendingUp className="h-4 w-4" />}
        loading={loading}
      />
      <KPICard
        title="System Load"
        value={loading ? '...' : '67%'}
        change="Healthy"
        icon={<Activity className="h-4 w-4" />}
        loading={loading}
      />
    </div>
  );
}
