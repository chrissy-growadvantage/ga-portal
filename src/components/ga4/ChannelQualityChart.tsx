import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer } from 'recharts';
import { AlertTriangle } from 'lucide-react';
import { formatTime } from './utils';

interface ChannelRow {
  channel: string;
  activeUsers: number;
  sessions: number;
  engagementRate: number;
  avgSessionDuration: number;
  pagesPerSession: number;
}

interface Props {
  data: ChannelRow[];
}

const CHANNEL_COLORS: Record<string, string> = {
  'Organic Search': '#10b981',
  'Email': '#6366f1',
  'Organic Social': '#f59e0b',
  'Referral': '#3b82f6',
  'Direct': '#94a3b8',
  'Unassigned': '#cbd5e1',
};

const ChannelQualityChart = ({ data }: Props) => {
  if (!data.length) return null;

  // Filter out Unassigned, sort by engagement rate
  const qualityData = data
    .filter(d => d.channel !== 'Unassigned')
    .sort((a, b) => b.engagementRate - a.engagementRate);

  const directChannel = data.find(d => d.channel === 'Direct');
  const isDirectSuspicious = directChannel && directChannel.engagementRate < 20;

  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <div className="flex items-start justify-between mb-4">
        <p className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">
          Channel Quality
        </p>
        {isDirectSuspicious && (
          <div className="flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 rounded-full px-2 py-1">
            <AlertTriangle className="w-3 h-3" />
            Direct may include bots
          </div>
        )}
      </div>

      {/* Engagement rate bars */}
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={qualityData} layout="vertical" margin={{ top: 0, right: 60, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
            <XAxis
              type="number"
              domain={[0, 100]}
              tickFormatter={(v: number) => `${v}%`}
              tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              type="category"
              dataKey="channel"
              width={100}
              tick={{ fontSize: 11, fill: 'hsl(var(--foreground))' }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              formatter={(value: number) => [`${value.toFixed(1)}%`, 'Engagement rate']}
              contentStyle={{
                background: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '12px',
                fontSize: '12px',
              }}
            />
            <Bar
              dataKey="engagementRate"
              radius={[0, 4, 4, 0]}
              maxBarSize={18}
              label={{
                position: 'right',
                formatter: (v: number) => `${v.toFixed(0)}%`,
                fontSize: 11,
                fill: 'hsl(var(--muted-foreground))',
              }}
            >
              {qualityData.map(entry => (
                <Cell
                  key={entry.channel}
                  fill={CHANNEL_COLORS[entry.channel] ?? '#94a3b8'}
                  opacity={entry.channel === 'Direct' ? 0.4 : 1}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Avg session duration per channel */}
      <div className="mt-3 pt-3 border-t border-border">
        <p className="text-xs text-muted-foreground mb-2">Avg time per visit</p>
        <div className="flex flex-wrap gap-2">
          {qualityData
            .filter(d => d.channel !== 'Direct' && d.avgSessionDuration > 0)
            .map(d => (
              <span key={d.channel} className="text-xs bg-muted rounded-full px-2 py-0.5">
                <span className="font-medium">{d.channel}</span>: {formatTime(d.avgSessionDuration)}
              </span>
            ))}
        </div>
      </div>
    </div>
  );
};

export default ChannelQualityChart;
