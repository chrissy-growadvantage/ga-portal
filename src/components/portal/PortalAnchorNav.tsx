import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

type AnchorSection = {
  id: string;
  label: string;
  visible: boolean;
  hasAlert?: boolean;
};

type PortalAnchorNavProps = {
  sections: AnchorSection[];
};

export function PortalAnchorNav({ sections }: PortalAnchorNavProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const visibleSections = sections.filter((s) => s.visible);

  useEffect(() => {
    if (visibleSections.length === 0) return;

    const sectionElements = visibleSections
      .map((s) => document.getElementById(s.id))
      .filter(Boolean) as HTMLElement[];

    if (sectionElements.length === 0) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        // Find the topmost intersecting section
        const intersecting = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

        if (intersecting.length > 0) {
          setActiveId(intersecting[0].target.id);
        }
      },
      {
        rootMargin: '-60px 0px -60% 0px',
        threshold: 0,
      },
    );

    sectionElements.forEach((el) => observerRef.current!.observe(el));

    return () => observerRef.current?.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sections.map((s) => s.id + s.visible).join(',')]);

  const handleClick = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setActiveId(id);
  };

  if (visibleSections.length === 0) return null;

  return (
    <div
      className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border/50 -mx-4 px-4 py-2"
      aria-label="Section navigation"
    >
      <div
        ref={scrollRef}
        className="flex gap-1.5 overflow-x-auto scrollbar-none"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {visibleSections.map((section) => {
          const isActive = activeId === section.id;

          return (
            <button
              key={section.id}
              onClick={() => handleClick(section.id)}
              className={cn(
                'relative rounded-full px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors shrink-0',
                'min-h-[32px]',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
              )}
              aria-current={isActive ? 'location' : undefined}
            >
              {section.label}
              {section.hasAlert && (
                <span
                  className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-destructive"
                  aria-label="Needs attention"
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
