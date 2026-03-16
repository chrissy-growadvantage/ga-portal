import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CalendarDays, ExternalLink, Video } from 'lucide-react';
import { format, parseISO } from 'date-fns';

type PortalMeetingCardProps = {
  meetingAt: string;
  meetingLink: string | null;
};

export function PortalMeetingCard({ meetingAt, meetingLink }: PortalMeetingCardProps) {
  const date = parseISO(meetingAt);

  return (
    <Card className="border-border/60 overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Video className="w-5 h-5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Your Next Meeting
              </p>
              <p className="text-sm font-semibold mt-0.5 truncate">
                {format(date, 'EEEE, d MMMM yyyy')}
              </p>
              <p className="text-xs text-muted-foreground">
                {format(date, 'h:mm a')}
              </p>
            </div>
          </div>
          {meetingLink && (
            <a
              href={meetingLink}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0"
            >
              <Button size="sm" className="gap-1.5">
                Join meeting
                <ExternalLink className="w-3 h-3" aria-hidden="true" />
                <span className="sr-only">(opens in new tab)</span>
              </Button>
            </a>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
