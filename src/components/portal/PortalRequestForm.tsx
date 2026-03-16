import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { DEFAULT_PICK_LIST_CATEGORIES } from '@/lib/constants';

type PortalRequestFormProps = {
  token: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  categories?: string[];
};

async function submitRequest(
  token: string,
  title: string,
  description?: string,
  category?: string,
) {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  const response = await fetch(`${supabaseUrl}/functions/v1/client-request`, {
    method: 'POST',
    headers: {
      apikey: anonKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      token,
      title,
      description: description || undefined,
      category: category || undefined,
    }),
  });

  if (!response.ok) {
    const result = await response.json();
    throw new Error(result?.error?.message ?? 'Request failed');
  }

  return response.json();
}

export function PortalRequestForm({
  token,
  open,
  onOpenChange,
  onSuccess,
  categories,
}: PortalRequestFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const categoryOptions = categories ?? [...DEFAULT_PICK_LIST_CATEGORIES];

  // Reset form state whenever the dialog closes
  useEffect(() => {
    if (!open) {
      setTitle('');
      setDescription('');
      setCategory('');
      setSubmitted(false);
    }
  }, [open]);

  // Auto-close dialog 1.5s after successful submission
  useEffect(() => {
    if (!submitted) return;
    const timer = setTimeout(() => {
      onOpenChange(false);
      onSuccess();
    }, 1500);
    return () => clearTimeout(timer);
  }, [submitted, onOpenChange, onSuccess]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) return;

    setSubmitting(true);
    try {
      await submitRequest(
        token,
        title.trim(),
        description.trim() || undefined,
        category || undefined,
      );
      setSubmitted(true);
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {submitted ? (
          <div className="flex flex-col items-center justify-center py-8 text-center gap-3">
            <CheckCircle2 className="w-12 h-12 text-status-success" />
            <div>
              <p className="font-semibold text-foreground">Your request has been sent!</p>
              <p className="text-sm text-muted-foreground mt-1">
                We'll review it and get back to you soon.
              </p>
            </div>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Request Something</DialogTitle>
              <DialogDescription>
                Submit a request to your service provider. They'll review it and get back to you.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="request-category" className="text-sm font-medium mb-1.5 block">
                  Category
                </label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger id="request-category">
                    <SelectValue placeholder="Select a category..." />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryOptions.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label htmlFor="request-title" className="text-sm font-medium mb-1.5 block">
                  Title <span className="text-destructive">*</span>
                </label>
                <Input
                  id="request-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Update homepage banner"
                  maxLength={500}
                  required
                  autoFocus
                />
              </div>

              <div>
                <label htmlFor="request-description" className="text-sm font-medium mb-1.5 block">
                  Description
                </label>
                <Textarea
                  id="request-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add any details or context..."
                  maxLength={2000}
                  className="min-h-[80px] resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => onOpenChange(false)}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting || !title.trim()}
                  className="gap-2"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Submit Request
                </Button>
              </div>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
