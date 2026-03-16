import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer
} from 'recharts';
import type { OverviewMetrics } from './types';
import { formatDate, formatNumber } from './utils';

interface Props {
  current: OverviewMetrics;
  previous: OverviewMetrics | null;
}

interface ChartRow {
  label: string;
  current: number;
  previous?: number;
}

const CustomTooltip = ({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ value: number; name: string; color: string }>;
  label?: string;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-xl shadow-lg px-3 py-2 text-sm">
      <p className="font-semibold text-foreground mb-1">{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color }} className="text-xs">
          {p.name}: <span className="font-bold">{formatNumber(p.value)}</span>
        </p>
      ))}
    </div>
  );
};

const TrendChart = ({ current, previous }: Props) => {
  const chartData: ChartRow[] = current.dailyData.map((d, i) => ({
    label: formatDate(d.date),
    current: d.activeUsers,
    previous: previous?.dailyData[i]?.activeUsers,
  }));

  const hasPrevious = !!previous && previous.dailyData.length > 0;

  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <p className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-4">Daily Visitors</p>
      <div className="h-52 sm:h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="gradCurrent" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={formatNumber}
              width={40}
            />
            <Tooltip content={<CustomTooltip />} />
            {hasPrevious && (
              <Area
                type="monotone"
                dataKey="previous"
                name="Prev. period"
                stroke="hsl(var(--muted-foreground))"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                fill="none"
                dot={false}
              />
            )}
            <Area
              type="monotone"
              dataKey="current"
              name="Visitors"
              stroke="#10b981"
              strokeWidth={2}
              fill="url(#gradCurrent)"
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default TrendChart;
