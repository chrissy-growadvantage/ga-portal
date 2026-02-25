import { format } from 'date-fns';

interface PortalSignatureDisplayProps {
  name: string;
  date?: string;
}

export function PortalSignatureDisplay({ name, date }: PortalSignatureDisplayProps) {
  return (
    <div className="space-y-1">
      <p
        className="text-3xl text-primary"
        style={{ fontFamily: "'Dancing Script', cursive" }}
      >
        {name}
      </p>
      <p className="text-xs text-muted-foreground">
        {date && <span>{format(new Date(date), 'MMMM d, yyyy')}</span>}
        {date && ' — '}
        Digitally signed
      </p>
    </div>
  );
}
