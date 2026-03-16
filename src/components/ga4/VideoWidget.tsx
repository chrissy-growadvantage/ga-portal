import { Play, CheckCircle, TrendingUp } from 'lucide-react';
import { formatNumber } from './utils';

interface VideoEventRow {
  eventName: string;
  eventCount: number;
  totalUsers: number;
}

interface Props {
  data: VideoEventRow[];
}

const VideoWidget = ({ data }: Props) => {
  if (!data.length) return null;

  const starts = data.find(d => d.eventName === 'video_start');
  const completions = data.find(d => d.eventName === 'video_complete');

  if (!starts && !completions) return null;

  const startCount = starts?.eventCount ?? 0;
  const completeCount = completions?.eventCount ?? 0;
  const completionRate = startCount > 0 ? (completeCount / startCount) * 100 : 0;

  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <p className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-4">
        Video engagement
      </p>
      <div className="grid grid-cols-3 gap-3">
        <div className="text-center">
          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center mx-auto mb-2">
            <Play className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-xl font-extrabold">{formatNumber(startCount)}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Plays</p>
        </div>
        <div className="text-center">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center mx-auto mb-2">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-xl font-extrabold">{formatNumber(completeCount)}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Completed</p>
        </div>
        <div className="text-center">
          <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center mx-auto mb-2">
            <TrendingUp className="w-4 h-4 text-purple-600" />
          </div>
          <p className={`text-xl font-extrabold ${completionRate >= 50 ? 'text-emerald-600' : 'text-amber-600'}`}>
            {completionRate.toFixed(0)}%
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">Completion</p>
        </div>
      </div>
      {completionRate >= 50 && (
        <p className="text-xs text-emerald-600 font-medium mt-3 text-center">
          Strong video completion — your audience watches to the end
        </p>
      )}
    </div>
  );
};

export default VideoWidget;
