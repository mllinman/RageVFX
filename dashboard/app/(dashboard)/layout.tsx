'use client';

import { ReactNode } from 'react';
import { Sidebar } from '@/components/dashboard/sidebar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex h-screen overflow-hidden bg-background">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto p-6">{children}</div>
        </main>
      </div>
    </QueryClientProvider>
  );
}
