import { formatNumber } from './utils';

interface HeatmapRow {
  dayOfWeek: number; // 0=Sunday...6=Saturday
  hour: number;      // 0-23
  activeUsers: number;
}

interface Props {
  data: HeatmapRow[];
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOUR_LABELS = [
  '12a', '1a', '2a', '3a', '4a', '5a', '6a', '7a', '8a', '9a', '10a', '11a',
  '12p', '1p', '2p', '3p', '4p', '5p', '6p', '7p', '8p', '9p', '10p', '11p',
];

const HeatmapChart = ({ data }: Props) => {
  if (!data.length) return null;

  // Build lookup: grid[day][hour] = users
  const grid: number[][] = Array.from({ length: 7 }, () => new Array(24).fill(0));
  let maxVal = 0;
  data.forEach(({ dayOfWeek, hour, activeUsers }) => {
    grid[dayOfWeek][hour] = (grid[dayOfWeek][hour] ?? 0) + activeUsers;
    if (grid[dayOfWeek][hour] > maxVal) maxVal = grid[dayOfWeek][hour];
  });

  const getColor = (value: number) => {
    if (value === 0) return 'bg-muted opacity-30';
    const intensity = value / maxVal;
    if (intensity > 0.75) return 'bg-emerald-500';
    if (intensity > 0.5) return 'bg-emerald-400';
    if (intensity > 0.25) return 'bg-emerald-300';
    return 'bg-emerald-200';
  };

  // Show only every 3rd hour label to avoid crowding
  const hourTick = (i: number) => (i % 3 === 0 ? HOUR_LABELS[i] : '');

  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <p className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-4">
        When your audience is active
      </p>
      <div className="overflow-x-auto">
        <div className="min-w-[500px]">
          {/* Hour labels */}
          <div className="flex ml-8 mb-1">
            {Array.from({ length: 24 }, (_, i) => (
              <div key={i} className="flex-1 text-center text-[9px] text-muted-foreground">
                {hourTick(i)}
              </div>
            ))}
          </div>
          {/* Grid rows */}
          {Array.from({ length: 7 }, (_, day) => (
            <div key={day} className="flex items-center gap-0.5 mb-0.5">
              <div className="w-7 text-[10px] text-muted-foreground text-right pr-1 shrink-0">
                {DAY_LABELS[day]}
              </div>
              {Array.from({ length: 24 }, (_, hour) => {
                const val = grid[day][hour];
                return (
                  <div
                    key={hour}
                    className={`flex-1 aspect-square rounded-sm ${getColor(val)}`}
                    title={`${DAY_LABELS[day]} ${HOUR_LABELS[hour]}: ${formatNumber(val)} users`}
                  />
                );
              })}
            </div>
          ))}
          {/* Legend */}
          <div className="flex items-center gap-2 mt-3 justify-end">
            <span className="text-[10px] text-muted-foreground">Less</span>
            {['bg-emerald-200', 'bg-emerald-300', 'bg-emerald-400', 'bg-emerald-500'].map(c => (
              <div key={c} className={`w-3 h-3 rounded-sm ${c}`} />
            ))}
            <span className="text-[10px] text-muted-foreground">More</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeatmapChart;
