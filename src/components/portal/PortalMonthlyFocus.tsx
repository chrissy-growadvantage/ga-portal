type PortalMonthlyFocusProps = {
  focus: string | null;
};

export function PortalMonthlyFocus({ focus }: PortalMonthlyFocusProps) {
  if (!focus) return null;

  return (
    <div className="rounded-xl border border-primary/20 bg-primary/5 px-5 py-4">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-primary mb-1">
        From your team
      </p>
      <p className="text-sm text-foreground leading-relaxed">{focus}</p>
    </div>
  );
}
