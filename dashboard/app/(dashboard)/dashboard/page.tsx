'use client';

import { DashboardKPIs } from '@/components/dashboard/kpi-cards';
import { ProjectsDataTable, Project } from '@/components/dashboard/projects-table';
import { DashboardCharts } from '@/components/dashboard/charts';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useState } from 'react';

// Mock data - in production, this would come from API/database
const mockProjects: Project[] = [
  {
    id: '1',
    name: 'Action Scene VFX',
    status: 'active',
    owner: 'John Doe',
    progress: 75,
    createdAt: '2024-01-15',
  },
  {
    id: '2',
    name: 'Title Sequence',
    status: 'completed',
    owner: 'Jane Smith',
    progress: 100,
    createdAt: '2024-01-10',
  },
  {
    id: '3',
    name: 'Environment Compositing',
    status: 'active',
    owner: 'Mike Johnson',
    progress: 45,
    createdAt: '2024-01-20',
  },
  {
    id: '4',
    name: 'Character Rendering',
    status: 'pending',
    owner: 'Sarah Wilson',
    progress: 10,
    createdAt: '2024-01-25',
  },
  {
    id: '5',
    name: 'Explosion Effects',
    status: 'active',
    owner: 'Tom Brown',
    progress: 60,
    createdAt: '2024-01-18',
  },
];

export default function DashboardPage() {
  const [loading, setLoading] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back! Here's what's happening with your projects.
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Project
        </Button>
      </div>

      {/* KPI Cards */}
      <DashboardKPIs loading={loading} />

      {/* Charts */}
      <DashboardCharts />

      {/* Projects Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold tracking-tight">
            Recent Projects
          </h2>
        </div>
        <ProjectsDataTable data={mockProjects} loading={loading} />
      </div>
    </div>
  );
}
