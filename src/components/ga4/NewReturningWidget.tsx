import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { formatNumber, formatTime } from './utils';

interface Segment {
  segment: string;
  activeUsers: number;
  sessions: number;
  engagementRate: number;
  avgSessionDuration: number;
  pagesPerSession: number;
}

interface Props {
  data: Segment[];
}

const NewReturningWidget = ({ data }: Props) => {
  if (!data.length) return null;

  const newSeg = data.find(d => d.segment === 'new');
  const returnSeg = data.find(d => d.segment === 'returning');
  const total = (newSeg?.activeUsers ?? 0) + (returnSeg?.activeUsers ?? 0);

  const pieData = [
    { name: 'New', value: newSeg?.activeUsers ?? 0, color: '#94a3b8' },
    { name: 'Returning', value: returnSeg?.activeUsers ?? 0, color: '#10b981' },
  ];

  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <p className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-4">
        New vs returning visitors
      </p>
      <div className="flex items-center gap-4">
        <div className="h-28 w-28 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={32}
                outerRadius={50}
                paddingAngle={3}
                dataKey="value"
                strokeWidth={0}
              >
                {pieData.map(entry => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(v: number) => [formatNumber(v), '']}
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
        <div className="flex-1 space-y-3">
          {[
            { label: 'New', seg: newSeg, color: 'bg-slate-400' },
            { label: 'Returning', seg: returnSeg, color: 'bg-emerald-500' },
          ].map(({ label, seg, color }) =>
            seg ? (
              <div key={label}>
                <div className="flex items-center gap-2 mb-0.5">
                  <div className={`w-2 h-2 rounded-full ${color}`} />
                  <span className="text-xs font-semibold text-foreground">{label}</span>
                  <span className="text-xs text-muted-foreground ml-auto">
                    {formatNumber(seg.activeUsers)} users
                  </span>
                </div>
                <div className="flex gap-3 text-xs text-muted-foreground pl-4">
                  <span>{seg.engagementRate.toFixed(0)}% engaged</span>
                  <span>{formatTime(seg.avgSessionDuration)} avg</span>
                </div>
              </div>
            ) : null
          )}
        </div>
      </div>
      {returnSeg && newSeg && returnSeg.avgSessionDuration > newSeg.avgSessionDuration * 1.5 && (
        <p className="text-xs text-emerald-600 font-medium mt-3">
          Returning visitors stay {(returnSeg.avgSessionDuration / newSeg.avgSessionDuration).toFixed(1)}x longer — strong loyalty signal
        </p>
      )}
      {/* Suppress unused variable warning */}
      {total > 0 && null}
    </div>
  );
};

export default NewReturningWidget;
