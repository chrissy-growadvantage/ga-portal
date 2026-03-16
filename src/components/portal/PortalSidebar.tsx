import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Home,
  FileText,
  FolderOpen,
  BarChart3,
  Lightbulb,
  CheckSquare,
  Briefcase,
  Menu,
  ListChecks,
} from 'lucide-react';

export type PortalSection = {
  id: string;
  label: string;
  icon: React.ElementType;
  visible: boolean;
  hasAlert?: boolean;
  alertCount?: number;
};

type SidebarProps = {
  sections: PortalSection[];
  activeSection: string;
  onSectionChange: (sectionId: string) => void;
};

const SECTION_ICONS: Record<string, React.ElementType> = {
  home: Home,
  onboarding: ListChecks,
  agreements: FileText,
  'files-tools': FolderOpen,
  scope: BarChart3,
  requests: Lightbulb,
  tasks: CheckSquare,
  work: Briefcase,
};

function SidebarNavItem({
  section,
  isActive,
  onClick,
}: {
  section: PortalSection;
  isActive: boolean;
  onClick: () => void;
}) {
  const Icon = section.icon;

  const alertLabel =
    section.hasAlert && section.alertCount && section.alertCount > 0
      ? `, ${section.alertCount} item${section.alertCount === 1 ? '' : 's'} need attention`
      : '';

  return (
    <button
      onClick={onClick}
      className={cn(
        'relative w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors text-left',
        isActive
          ? 'bg-primary/10 text-primary border-l-2 border-l-primary'
          : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
      )}
      aria-current={isActive ? 'page' : undefined}
      aria-label={`${section.label}${alertLabel}`}
    >
      <Icon className="w-4 h-4 shrink-0" />
      <span className="truncate" aria-hidden="true">{section.label}</span>
      {section.hasAlert && (
        <span className="ml-auto flex items-center justify-center" aria-hidden="true">
          {section.alertCount && section.alertCount > 0 ? (
            <span className="min-w-[18px] h-[18px] rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center px-1">
              {section.alertCount}
            </span>
          ) : (
            <span className="w-2 h-2 rounded-full bg-destructive" />
          )}
        </span>
      )}
    </button>
  );
}

function SidebarNavList({
  sections,
  activeSection,
  onSectionChange,
  onItemClick,
}: SidebarProps & { onItemClick?: () => void }) {
  const visibleSections = sections.filter((s) => s.visible);

  return (
    <nav className="space-y-1" aria-label="Portal navigation">
      {visibleSections.map((section) => (
        <SidebarNavItem
          key={section.id}
          section={section}
          isActive={activeSection === section.id}
          onClick={() => {
            onSectionChange(section.id);
            onItemClick?.();
          }}
        />
      ))}
    </nav>
  );
}

/** Desktop sidebar — fixed-width aside for the flex layout */
export function PortalDesktopSidebar(props: SidebarProps) {
  return (
    <aside className="hidden md:flex w-[220px] shrink-0 flex-col border-r border-border bg-card">
      <div className="flex-1 overflow-y-auto px-3 py-4">
        <SidebarNavList {...props} />
      </div>
    </aside>
  );
}

/** Mobile sidebar — hamburger trigger + Sheet overlay */
export function PortalMobileNav(
  props: SidebarProps & { clientName: string },
) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-11 w-11"
          aria-label="Open navigation"
        >
          <Menu className="w-5 h-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[260px] pt-8">
        <div className="mb-6 px-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Portal
          </p>
          <p className="text-sm font-semibold mt-1 truncate">
            {props.clientName}
          </p>
        </div>
        <SidebarNavList
          sections={props.sections}
          activeSection={props.activeSection}
          onSectionChange={props.onSectionChange}
          onItemClick={() => setOpen(false)}
        />
      </SheetContent>
    </Sheet>
  );
}

export { SECTION_ICONS };
