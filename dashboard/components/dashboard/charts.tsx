'use client';

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const lineData = [
  { month: 'Jan', projects: 45, users: 120 },
  { month: 'Feb', projects: 52, users: 145 },
  { month: 'Mar', projects: 61, users: 178 },
  { month: 'Apr', projects: 70, users: 210 },
  { month: 'May', projects: 89, users: 265 },
  { month: 'Jun', projects: 127, users: 340 },
];

const barData = [
  { category: 'VFX', count: 45 },
  { category: 'Compositing', count: 38 },
  { category: 'Rendering', count: 29 },
  { category: '3D', count: 15 },
];

export function DashboardCharts() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Line Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Growth Trend</CardTitle>
          <CardDescription>
            Projects and users over the last 6 months
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={lineData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="month"
                className="text-sm"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis
                className="text-sm"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px',
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="projects"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--primary))' }}
                name="Projects"
              />
              <Line
                type="monotone"
                dataKey="users"
                stroke="hsl(var(--success))"
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--success))' }}
                name="Users"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Project Categories</CardTitle>
          <CardDescription>
            Distribution of projects by category
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="category"
                className="text-sm"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis
                className="text-sm"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px',
                }}
              />
              <Bar
                dataKey="count"
                fill="hsl(var(--primary))"
                radius={[8, 8, 0, 0]}
                name="Count"
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
