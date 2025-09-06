'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

const OverviewChart = dynamic(() => import('@/components/overview-chart'), {
  ssr: false,
  loading: () => <Skeleton className="h-[200px] w-full" />,
});

export default function DashboardChart() {
  return <OverviewChart />;
}
