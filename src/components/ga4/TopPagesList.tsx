import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { PageData } from './types';
import { formatNumber } from './utils';

interface Props {
  pages: PageData[];
}

const TopPagesList = ({ pages }: Props) => {
  const [expanded, setExpanded] = useState(false);
  const shown = expanded ? pages : pages.slice(0, 5);

  if (!pages.length) return null;

  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <p className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-4">
        Most popular pages
      </p>
      <div className="space-y-1">
        {shown.map((page, i) => (
          <div
            key={page.pagePath}
            className="flex items-center justify-between py-2.5 border-b border-border last:border-0"
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-xs font-bold text-muted-foreground w-4 shrink-0">{i + 1}</span>
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate" title={page.pageTitle}>
                  {page.pageTitle}
                </p>
                <p className="text-xs text-muted-foreground truncate">{page.pagePath}</p>
              </div>
            </div>
            <div className="text-right shrink-0 ml-3">
              <p className="text-sm font-bold">{formatNumber(page.screenPageViews)}</p>
              <p className="text-xs text-muted-foreground">views</p>
            </div>
          </div>
        ))}
      </div>
      {pages.length > 5 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-3 flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          {expanded ? (
            <><ChevronUp className="w-3 h-3" /> Show less</>
          ) : (
            <><ChevronDown className="w-3 h-3" /> Show all {pages.length} pages</>
          )}
        </button>
      )}
    </div>
  );
};

export default TopPagesList;
