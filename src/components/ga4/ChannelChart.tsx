import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Cell, ResponsiveContainer
} from 'recharts';
import type { SourceData } from './types';
import { formatNumber } from './utils';

interface Props {
  sources: SourceData[];
}

const ChannelChart = ({ sources }: Props) => {
  if (!sources.length) return null;

  const data = sources.slice(0, 6).map(s => ({ name: s.label, users: s.activeUsers, medium: s.medium, percentage: s.percentage }));
  const emailSource = sources.find(s => s.medium === 'email');

  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <p className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-4">
        Where visitors come from
      </p>
      <div className="h-44">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 0, right: 16, bottom: 0, left: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
            <XAxis
              type="number"
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={formatNumber}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fontSize: 12, fill: 'hsl(var(--foreground))' }}
              tickLine={false}
              axisLine={false}
              width={90}
            />
            <Tooltip
              formatter={(value: number) => [formatNumber(value), 'Visitors']}
              contentStyle={{
                background: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '12px',
                fontSize: '12px',
              }}
            />
            <Bar dataKey="users" radius={[0, 4, 4, 0]} maxBarSize={20}>
              {data.map((entry) => (
                <Cell
                  key={entry.medium}
                  fill={entry.medium === 'email' ? '#10b981' : 'hsl(var(--muted-foreground) / 0.4)'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      {emailSource && (
        <p className="text-xs text-emerald-600 font-medium mt-2">
          Email drives {emailSource.percentage.toFixed(1)}% of visitors — newsletter is working
        </p>
      )}
    </div>
  );
};

export default ChannelChart;
