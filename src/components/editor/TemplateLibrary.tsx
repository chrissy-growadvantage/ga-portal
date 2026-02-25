import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search } from 'lucide-react';
import type { ProposalTemplate } from '@/types/database';

type TemplateLibraryProps = {
  open: boolean;
  onClose: () => void;
  onSelect: (contentJson: Record<string, unknown>) => void;
  templates: ProposalTemplate[];
  isLoading: boolean;
};

const CATEGORY_TABS = [
  { value: 'all', label: 'All' },
  { value: 'intro', label: 'Intro' },
  { value: 'deliverables', label: 'Deliverables' },
  { value: 'terms', label: 'Terms' },
  { value: 'mine', label: 'My Templates' },
] as const;

function extractPreviewText(contentJson: Record<string, unknown>): string {
  const content = contentJson.content as Array<Record<string, unknown>> | undefined;
  if (!content) return '';

  const texts: string[] = [];
  const walk = (nodes: Array<Record<string, unknown>>) => {
    for (const node of nodes) {
      if (node.text && typeof node.text === 'string') {
        texts.push(node.text);
      }
      if (Array.isArray(node.content)) {
        walk(node.content as Array<Record<string, unknown>>);
      }
    }
  };
  walk(content);
  const full = texts.join(' ');
  return full.length > 200 ? `${full.slice(0, 200)}...` : full;
}

export function TemplateLibrary({
  open,
  onClose,
  onSelect,
  templates,
  isLoading,
}: TemplateLibraryProps) {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  const filteredTemplates = useMemo(() => {
    let filtered = templates;

    if (activeTab === 'mine') {
      filtered = filtered.filter((t) => !t.is_system);
    } else if (activeTab !== 'all') {
      filtered = filtered.filter((t) => t.category === activeTab);
    }

    if (search.trim()) {
      const query = search.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.name.toLowerCase().includes(query) ||
          t.description?.toLowerCase().includes(query),
      );
    }

    return filtered;
  }, [templates, activeTab, search]);

  const handleSelect = (template: ProposalTemplate) => {
    onSelect(template.content_json);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Template Library</DialogTitle>
          <DialogDescription>
            Insert a reusable content template into your proposal.
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full">
            {CATEGORY_TABS.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value} className="flex-1">
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
          {isLoading && (
            <p className="text-center text-muted-foreground py-8">
              Loading templates...
            </p>
          )}

          {!isLoading && filteredTemplates.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              No templates found
            </p>
          )}

          {filteredTemplates.map((template) => (
            <button
              key={template.id}
              type="button"
              onClick={() => handleSelect(template)}
              className="w-full text-left rounded-lg border border-border p-3 hover:bg-accent/50 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-sm">{template.name}</span>
                {template.is_system && (
                  <Badge variant="secondary" className="text-xs">
                    System
                  </Badge>
                )}
              </div>
              {template.description && (
                <p className="text-xs text-muted-foreground">
                  {template.description}
                </p>
              )}
              <p className="text-xs text-muted-foreground/70 mt-1 line-clamp-2">
                {extractPreviewText(template.content_json)}
              </p>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
