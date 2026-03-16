import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import type { DeviceData } from './types';
import { formatNumber } from './utils';

interface Props {
  devices: DeviceData[];
}

const DEVICE_COLORS: Record<string, string> = {
  desktop: '#3b82f6',
  mobile: '#8b5cf6',
  tablet: '#10b981',
};

const DeviceDonut = ({ devices }: Props) => {
  if (!devices.length) return null;

  const data = devices.map(d => ({
    name: d.device,
    value: d.activeUsers,
    percentage: d.percentage,
    color: DEVICE_COLORS[d.device] ?? '#94a3b8',
  }));

  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <p className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-4">
        How they browse
      </p>
      <div className="flex items-center gap-4">
        <div className="h-32 w-32 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={38}
                outerRadius={56}
                paddingAngle={3}
                dataKey="value"
                strokeWidth={0}
              >
                {data.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => [formatNumber(value), 'Visitors']}
                contentStyle={{
                  background: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '12px',
                  fontSize: '12px',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="space-y-2 flex-1">
          {data.map(d => (
            <div key={d.name} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                <span className="capitalize text-foreground font-medium">{d.name}</span>
              </div>
              <span className="text-muted-foreground text-xs">{d.percentage.toFixed(0)}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DeviceDonut;
