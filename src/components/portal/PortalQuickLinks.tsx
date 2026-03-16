import { MessageSquare, FolderOpen, PlusCircle, ExternalLink, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

type PortalQuickLinksProps = {
  slackUrl: string | null;
  driveUrl: string | null;
  bookingUrl: string | null;
  onRequestSomething: () => void;
};

type LinkCard = {
  id: string;
  label: string;
  icon: React.ElementType;
  href: string | null;
  onClick?: () => void;
  external: boolean;
};

export function PortalQuickLinks({
  slackUrl,
  driveUrl,
  bookingUrl,
  onRequestSomething,
}: PortalQuickLinksProps) {
  const links: LinkCard[] = [
    {
      id: 'slack',
      label: 'Slack',
      icon: MessageSquare,
      href: slackUrl,
      external: true,
    },
    {
      id: 'drive',
      label: 'Google Drive',
      icon: FolderOpen,
      href: driveUrl,
      external: true,
    },
    {
      id: 'meetings',
      label: 'Book a Meeting',
      icon: Calendar,
      href: bookingUrl,
      external: true,
    },
    {
      id: 'request',
      label: 'Request Something',
      icon: PlusCircle,
      href: null,
      onClick: onRequestSomething,
      external: false,
    },
  ].filter((link) => link.href !== null || link.onClick !== undefined);

  // For external links only show if href is non-null; always show request button
  const visibleLinks = links.filter(
    (link) => link.id === 'request' || link.href !== null,
  );

  if (visibleLinks.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2" role="navigation" aria-label="Quick links">
      {visibleLinks.map((link) => {
        const Icon = link.icon;
        const baseClass = cn(
          'inline-flex items-center gap-2 rounded-lg border border-border/60 bg-background px-3 py-2 min-h-[44px]',
          'text-sm font-medium text-foreground hover:bg-muted/60 transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        );

        if (link.href) {
          return (
            <a
              key={link.id}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className={baseClass}
              aria-label={`${link.label} (opens in new tab)`}
            >
              <Icon className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
              {link.label}
              <ExternalLink className="w-3 h-3 text-muted-foreground/60" aria-hidden="true" />
            </a>
          );
        }

        return (
          <button
            key={link.id}
            type="button"
            onClick={link.onClick}
            className={baseClass}
          >
            <Icon className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
            {link.label}
          </button>
        );
      })}
    </div>
  );
}
