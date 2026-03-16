import { format } from 'date-fns';
import { Calendar, Send, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { ProposalWithDetails } from '@/types/database';
import { cn } from '@/lib/utils';

interface ProposalMetadataGridProps {
  proposal: ProposalWithDetails;
}

export function ProposalMetadataGrid({ proposal }: ProposalMetadataGridProps) {
  const isExpired = proposal.expires_at ? new Date(proposal.expires_at) < new Date() : false;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Created */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
              <Calendar className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-muted-foreground">Created</p>
              <p className="text-sm font-semibold text-foreground">
                {format(new Date(proposal.created_at), 'MMM d, yyyy')}
              </p>
            </div>
          </div>

          {/* Sent */}
          {proposal.sent_at && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Send className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-muted-foreground">Sent</p>
                <p className="text-sm font-semibold text-foreground">
                  {format(new Date(proposal.sent_at), 'MMM d, yyyy')}
                </p>
              </div>
            </div>
          )}

          {/* Expires */}
          {proposal.expires_at && (
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                isExpired ? "bg-amber-100" : "bg-muted"
              )}>
                <Clock className={cn(
                  "w-4 h-4",
                  isExpired ? "text-amber-600" : "text-muted-foreground"
                )} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-muted-foreground">
                  {isExpired ? 'Expired' : 'Expires'}
                </p>
                <p className={cn(
                  "text-sm font-semibold",
                  isExpired ? "text-amber-600" : "text-foreground"
                )}>
                  {format(new Date(proposal.expires_at), 'MMM d, yyyy')}
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
