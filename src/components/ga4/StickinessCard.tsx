import { Users } from 'lucide-react';
import { formatNumber } from './utils';

interface StickinessData {
  dauPerMau: number;
  wauPerMau: number;
  dauPerWau: number;
  active7DayUsers: number;
  active28DayUsers: number;
  activeUsers: number;
}

interface Props {
  data: StickinessData | null;
}

const StickinessCard = ({ data }: Props) => {
  if (!data) return null;

  const wauMau = data.wauPerMau;
  // Benchmark: 15-30% WAU/MAU is healthy for a content site
  const isHealthy = wauMau >= 15;
  const pct = Math.min(wauMau, 40); // cap at 40% for display

  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
          <Users className="w-4 h-4 text-indigo-600" />
        </div>
        <p className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">
          Audience stickiness
        </p>
      </div>

      {/* WAU/MAU gauge */}
      <div className="mb-4">
        <div className="flex justify-between items-baseline mb-1.5">
          <span className="text-xs text-muted-foreground">Weekly return rate</span>
          <span className={`text-lg font-extrabold ${isHealthy ? 'text-emerald-600' : 'text-amber-600'}`}>
            {wauMau.toFixed(1)}%
          </span>
        </div>
        <div className="w-full bg-muted rounded-full h-2 relative">
          <div
            className={`h-full rounded-full transition-all ${isHealthy ? 'bg-emerald-500' : 'bg-amber-400'}`}
            style={{ width: `${(pct / 40) * 100}%` }}
          />
          {/* Target zone marker at 15% */}
          <div
            className="absolute top-0 h-full w-px bg-emerald-600 opacity-40"
            style={{ left: `${(15 / 40) * 100}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
          <span>0%</span>
          <span className="text-emerald-600">Target: 15-30%</span>
          <span>40%</span>
        </div>
      </div>

      {/* Active user counts */}
      <div className="grid grid-cols-3 gap-3 pt-3 border-t border-border">
        {[
          { label: 'This period', value: data.activeUsers },
          { label: 'Last 7 days', value: data.active7DayUsers },
          { label: 'Last 28 days', value: data.active28DayUsers },
        ].map(({ label, value }) => (
          <div key={label} className="text-center">
            <p className="text-base font-bold">{formatNumber(value)}</p>
            <p className="text-[10px] text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StickinessCard;
