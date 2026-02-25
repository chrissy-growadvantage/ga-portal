import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

type SaveTemplateDialogProps = {
  open: boolean;
  onClose: () => void;
  onSave: (template: {
    name: string;
    description: string;
    content_json: Record<string, unknown>;
    category: string | undefined;
  }) => void;
  contentJson: Record<string, unknown>;
  isSaving?: boolean;
};

const CATEGORIES = [
  { value: 'intro', label: 'Intro' },
  { value: 'deliverables', label: 'Deliverables' },
  { value: 'terms', label: 'Terms' },
  { value: 'custom', label: 'Custom' },
] as const;

export function SaveTemplateDialog({
  open,
  onClose,
  onSave,
  contentJson,
  isSaving = false,
}: SaveTemplateDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError('Template name is required');
      return;
    }

    setError('');
    onSave({
      name: name.trim(),
      description: description.trim(),
      content_json: contentJson,
      category,
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          setName('');
          setDescription('');
          setCategory(undefined);
          setError('');
          onClose();
        }
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Save as Template</DialogTitle>
          <DialogDescription>
            Save the current content as a reusable template.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="template-name">Template Name</Label>
            <Input
              id="template-name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError('');
              }}
              placeholder="e.g. Standard Introduction"
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="template-description">Description</Label>
            <Textarea
              id="template-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this template"
              className="min-h-[60px]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="template-category">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="template-category">
                <SelectValue placeholder="Select a category (optional)" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isSaving ? 'Saving...' : 'Save Template'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
