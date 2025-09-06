'use client';

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import type { ChartConfig } from '@/components/ui/chart';

const chartData = [
  { month: 'January', successful: 186, pending: 80 },
  { month: 'February', successful: 305, pending: 200 },
  { month: 'March', successful: 237, pending: 120 },
  { month: 'April', successful: 73, pending: 190 },
  { month: 'May', successful: 209, pending: 130 },
  { month: 'June', successful: 214, pending: 140 },
];

const chartConfig = {
  successful: {
    label: 'Successful',
    color: 'hsl(var(--accent))',
  },
  pending: {
    label: 'Pending',
    color: 'hsl(var(--primary))',
  },
} satisfies ChartConfig;

export default function OverviewChart() {
  return (
    <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
      <BarChart accessibilityLayer data={chartData}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="month"
          tickLine={false}
          tickMargin={10}
          axisLine={false}
          tickFormatter={(value) => value.slice(0, 3)}
        />
        <YAxis />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar dataKey="pending" fill="var(--color-pending)" radius={4} />
        <Bar
          dataKey="successful"
          fill="var(--color-successful)"
          radius={4}
        />
      </BarChart>
    </ChartContainer>
  );
}
