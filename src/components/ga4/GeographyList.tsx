import type { CountryData } from './types';
import { formatNumber } from './utils';

interface Props {
  countries: CountryData[];
}

const GeographyList = ({ countries }: Props) => {
  if (!countries.length) return null;

  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <p className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-4">
        Where your audience is
      </p>
      <div className="space-y-3">
        {countries.slice(0, 7).map((c, i) => (
          <div key={c.country} className="flex items-center gap-3">
            <span className="text-xs font-bold text-muted-foreground w-4">{i + 1}</span>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium text-foreground truncate">{c.country}</span>
                <span className="text-muted-foreground ml-2 shrink-0">{formatNumber(c.activeUsers)}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-1">
                <div
                  className="h-full bg-emerald-400 rounded-full opacity-60"
                  style={{ width: `${c.percentage}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GeographyList;
