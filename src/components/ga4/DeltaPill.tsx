import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface Props {
  delta: number;
  className?: string;
}

const DeltaPill = ({ delta, className = '' }: Props) => {
  const isNeutral = Math.abs(delta) < 2;
  const isPositive = delta >= 2;

  if (isNeutral) {
    return (
      <span className={`inline-flex items-center gap-1 text-xs font-medium text-muted-foreground ${className}`}>
        <Minus className="w-3 h-3" />
        {Math.abs(delta).toFixed(1)}%
      </span>
    );
  }

  if (isPositive) {
    return (
      <span className={`inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 rounded-full px-2 py-0.5 ${className}`}>
        <TrendingUp className="w-3 h-3" />
        +{delta.toFixed(1)}%
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 rounded-full px-2 py-0.5 ${className}`}>
      <TrendingDown className="w-3 h-3" />
      {delta.toFixed(1)}%
    </span>
  );
};

export default DeltaPill;
