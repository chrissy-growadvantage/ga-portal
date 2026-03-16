import { Users, Activity, TrendingUp } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area } from 'recharts';
import type { OverviewMetrics } from './types';
import { formatNumber, calcDelta } from './utils';
import DeltaPill from './DeltaPill';

interface Props {
  current: OverviewMetrics;
  previous: OverviewMetrics | null;
}

interface StatCardProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  delta: number | null;
  sparkData: Array<{ v: number }>;
  accentColor: string;
  gradientId: string;
}

const StatCard = ({ label, value, icon, delta, sparkData, accentColor, gradientId }: StatCardProps) => (
  <div className="bg-card border border-border rounded-2xl p-5 flex flex-col gap-3">
    <div className="flex items-center justify-between">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${accentColor}`}>
        {icon}
      </div>
      {delta !== null && <DeltaPill delta={delta} />}
    </div>
    <div>
      <p className="text-3xl font-extrabold text-foreground tracking-tight">{value}</p>
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mt-0.5">{label}</p>
    </div>
    {sparkData.length > 1 && (
      <div className="h-10 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={sparkData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="v"
              stroke="#10b981"
              strokeWidth={1.5}
              fill={`url(#${gradientId})`}
              dot={false}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    )}
  </div>
);

const HeroStats = ({ current, previous }: Props) => {
  const visitorsDelta = previous ? calcDelta(current.totalActiveUsers, previous.totalActiveUsers) : null;
  const sessionsDelta = previous ? calcDelta(current.totalSessions, previous.totalSessions) : null;
  const engagementDelta = previous ? calcDelta(current.avgEngagementRate, previous.avgEngagementRate) : null;

  const visitorSpark = current.dailyData.map(d => ({ v: d.activeUsers }));
  const sessionSpark = current.dailyData.map(d => ({ v: d.sessions }));

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <StatCard
        label="Visitors"
        value={formatNumber(current.totalActiveUsers)}
        icon={<Users className="w-4 h-4 text-emerald-600" />}
        delta={visitorsDelta}
        sparkData={visitorSpark}
        accentColor="bg-emerald-50"
        gradientId="spark-visitors"
      />
      <StatCard
        label="Sessions"
        value={formatNumber(current.totalSessions)}
        icon={<Activity className="w-4 h-4 text-blue-600" />}
        delta={sessionsDelta}
        sparkData={sessionSpark}
        accentColor="bg-blue-50"
        gradientId="spark-sessions"
      />
      <StatCard
        label="Engaged"
        value={`${current.avgEngagementRate.toFixed(1)}%`}
        icon={<TrendingUp className="w-4 h-4 text-purple-600" />}
        delta={engagementDelta}
        sparkData={[]}
        accentColor="bg-purple-50"
        gradientId="spark-engagement"
      />
    </div>
  );
};

export default HeroStats;
