import { useState } from 'react';
import { ChevronDown, ChevronUp, Star, Gem, Droplets } from 'lucide-react';
import { formatNumber } from './utils';

interface LandingPage {
  landingPage: string;
  sessions: number;
  activeUsers: number;
  engagementRate: number;
  pagesPerSession: number;
  avgSessionDuration: number;
}

interface Props {
  data: LandingPage[];
}

const classifyPage = (
  sessions: number,
  engagementRate: number,
  medianSessions: number
) => {
  const highTraffic = sessions >= medianSessions;
  const highEngagement = engagementRate >= 60;
  if (highTraffic && highEngagement)
    return { label: 'Star', icon: Star, color: 'text-emerald-600 bg-emerald-50' };
  if (!highTraffic && highEngagement)
    return { label: 'Hidden gem', icon: Gem, color: 'text-blue-600 bg-blue-50' };
  if (highTraffic && !highEngagement)
    return { label: 'Leaky bucket', icon: Droplets, color: 'text-amber-600 bg-amber-50' };
  return null;
};

const LandingPagesTable = ({ data }: Props) => {
  const [expanded, setExpanded] = useState(false);

  // Filter noise: exclude cart, shop, login, product-category, (not set)
  const filtered = data.filter(
    p =>
      p.landingPage &&
      !p.landingPage.includes('/cart') &&
      !p.landingPage.includes('/shop') &&
      !p.landingPage.includes('/login') &&
      !p.landingPage.includes('/product-category') &&
      !p.landingPage.includes('/my-account') &&
      p.sessions >= 5
  );

  const shown = expanded ? filtered.slice(0, 20) : filtered.slice(0, 8);
  const sessions = filtered.map(p => p.sessions).sort((a, b) => a - b);
  const medianSessions = sessions[Math.floor(sessions.length / 2)] ?? 0;

  if (!filtered.length) return null;

  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <div className="flex items-center justify-between mb-1">
        <p className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">
          Landing page quality
        </p>
      </div>
      <p className="text-xs text-muted-foreground mb-4">
        Where visitors enter — and whether they stay
      </p>

      <div className="grid grid-cols-12 gap-2 px-1 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wide border-b border-border mb-1">
        <div className="col-span-5">Page</div>
        <div className="col-span-2 text-right">Sessions</div>
        <div className="col-span-2 text-right">Engaged</div>
        <div className="col-span-3 text-right">Type</div>
      </div>

      {shown.map(page => {
        const classification = classifyPage(page.sessions, page.engagementRate, medianSessions);
        const shortPath = page.landingPage.replace(/^\//, '').split('/')[0] || 'Home';
        return (
          <div
            key={page.landingPage}
            className="grid grid-cols-12 gap-2 px-1 py-2.5 border-b border-border/50 last:border-0 hover:bg-muted/30 rounded transition-colors"
          >
            <div className="col-span-5 min-w-0">
              <p
                className="text-xs font-medium text-foreground truncate"
                title={page.landingPage}
              >
                /{shortPath}
              </p>
            </div>
            <div className="col-span-2 text-right text-xs font-semibold">
              {formatNumber(page.sessions)}
            </div>
            <div
              className={`col-span-2 text-right text-xs font-semibold ${
                page.engagementRate >= 60 ? 'text-emerald-600' : 'text-amber-600'
              }`}
            >
              {page.engagementRate.toFixed(0)}%
            </div>
            <div className="col-span-3 flex justify-end">
              {classification && (
                <span
                  className={`inline-flex items-center gap-1 text-[10px] font-semibold rounded-full px-1.5 py-0.5 ${classification.color}`}
                >
                  <classification.icon className="w-2.5 h-2.5" />
                  {classification.label}
                </span>
              )}
            </div>
          </div>
        );
      })}

      {filtered.length > 8 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-3 flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          {expanded ? (
            <>
              <ChevronUp className="w-3 h-3" /> Show less
            </>
          ) : (
            <>
              <ChevronDown className="w-3 h-3" /> Show all {Math.min(filtered.length, 20)} pages
            </>
          )}
        </button>
      )}
    </div>
  );
};

export default LandingPagesTable;
