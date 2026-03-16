import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, AlertTriangle, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { usePortalSnapshot } from '@/hooks/usePortalSnapshot';

function SnapshotField({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div className="space-y-1">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="text-sm whitespace-pre-wrap">{value}</p>
    </div>
  );
}

function ScoreBadge({ score }: { score: number | null | undefined }) {
  if (score == null) return <span className="text-muted-foreground text-sm">—</span>;
  const color = score >= 8 ? 'text-green-600' : score >= 6 ? 'text-amber-500' : 'text-red-500';
  return <span className={`text-2xl font-bold ${color}`}>{score}<span className="text-sm font-normal text-muted-foreground">/10</span></span>;
}

export default function PortalSnapshotDetail() {
  const { token, monthSlug } = useParams<{ token: string; monthSlug: string }>();
  const navigate = useNavigate();
  const { data: snapshot, isLoading, error } = usePortalSnapshot(token, monthSlug);

  const goBack = () => navigate(`/portal/${token}?section=resources`);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[hsl(var(--portal-background))] px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  if (error || !snapshot) {
    return (
      <div className="min-h-screen bg-[hsl(var(--portal-background))] px-4 py-8">
        <div className="max-w-2xl mx-auto text-center space-y-4">
          <AlertTriangle className="w-8 h-8 text-destructive mx-auto" />
          <p className="text-muted-foreground">Report not found or unavailable.</p>
          <Button variant="outline" onClick={goBack}>Back to Portal</Button>
        </div>
      </div>
    );
  }

  const hasScores = snapshot.priorities_score != null || snapshot.delivery_score != null ||
    snapshot.communication_score != null || snapshot.capacity_score != null;

  return (
    <div className="min-h-screen bg-[hsl(var(--portal-background))]">
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={goBack} aria-label="Back to portal">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            <h1 className="text-xl font-bold">{snapshot.month_label}</h1>
          </div>
        </div>

        {/* Scores */}
        {hasScores && (
          <Card>
            <CardHeader><CardTitle className="text-base">Health Scores</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              {([
                { label: 'Priorities', value: snapshot.priorities_score },
                { label: 'Delivery', value: snapshot.delivery_score },
                { label: 'Communication', value: snapshot.communication_score },
                { label: 'Capacity', value: snapshot.capacity_score },
              ] as const).map(({ label, value }) => (
                <div key={label} className="space-y-1">
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <ScoreBadge score={value} />
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Delivery */}
        <Card>
          <CardHeader><CardTitle className="text-base">Delivery</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <SnapshotField label="Wins" value={snapshot.wins} />
            <SnapshotField label="Deliverables Completed" value={snapshot.deliverables_completed} />
            <SnapshotField label="Insights" value={snapshot.insights} />
            {snapshot.upcoming_priorities?.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Upcoming Priorities</p>
                <ul className="space-y-1">
                  {snapshot.upcoming_priorities.map((p, i) => (
                    <li key={i} className="text-sm flex gap-2">
                      <span className="shrink-0 text-muted-foreground">{i + 1}.</span>
                      <span>{p.title}{p.owner ? ` — ${p.owner}` : ''}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <SnapshotField label="Risks & Constraints" value={snapshot.risks_constraints} />
          </CardContent>
        </Card>

        {/* Impact */}
        {(snapshot.time_saved || snapshot.friction_removed || snapshot.systems_implemented) && (
          <Card>
            <CardHeader><CardTitle className="text-base">Impact</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <SnapshotField label="Time Saved" value={snapshot.time_saved} />
              <SnapshotField label="Friction Removed" value={snapshot.friction_removed} />
              <SnapshotField label="Systems Implemented" value={snapshot.systems_implemented} />
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        {snapshot.decisions_actions?.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-base">Decisions & Actions</CardTitle></CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {snapshot.decisions_actions.map((item, i) => (
                  <li key={i} className="text-sm flex gap-2">
                    <span className="shrink-0 text-muted-foreground">•</span>
                    <span>{item.action}{item.owner ? ` (${item.owner})` : ''}{item.due ? ` — due ${item.due}` : ''}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
