import { useState, useEffect, useRef } from 'react';
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
import { CheckCircle2, Loader2, Paperclip, X } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { DEFAULT_PICK_LIST_CATEGORIES } from '@/lib/constants';

type PortalRequestFormProps = {
  token: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  categories?: string[];
};

async function uploadAttachment(file: File): Promise<string> {
  const ext = file.name.split('.').pop() ?? 'bin';
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { error } = await supabase.storage
    .from('portal-attachments')
    .upload(path, file, { upsert: false });

  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from('portal-attachments').getPublicUrl(path);
  return data.publicUrl;
}

async function submitRequest(
  token: string,
  title: string,
  description?: string,
  category?: string,
  attachmentUrl?: string,
) {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  const response = await fetch(`${supabaseUrl}/functions/v1/client-request`, {
    method: 'POST',
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      token,
      title,
      description: description || undefined,
      category: category || undefined,
      attachment_url: attachmentUrl || undefined,
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
  const [attachment, setAttachment] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const categoryOptions = categories ?? [...DEFAULT_PICK_LIST_CATEGORIES];

  // Reset form state whenever the dialog closes
  useEffect(() => {
    if (!open) {
      setTitle('');
      setDescription('');
      setCategory('');
      setAttachment(null);
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (file && file.size > 10 * 1024 * 1024) {
      toast.error('File must be under 10 MB');
      return;
    }
    setAttachment(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) return;

    setSubmitting(true);
    try {
      let attachmentUrl: string | undefined;
      if (attachment) {
        attachmentUrl = await uploadAttachment(attachment);
      }
      await submitRequest(
        token,
        title.trim(),
        description.trim() || undefined,
        category || undefined,
        attachmentUrl,
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

              <div>
                <label className="text-sm font-medium mb-1.5 block">
                  Attachment <span className="text-muted-foreground font-normal">(optional, max 10 MB)</span>
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.gif,.zip,.csv,.txt"
                  onChange={handleFileChange}
                />
                {attachment ? (
                  <div className="flex items-center gap-2 p-2.5 rounded-lg border border-border bg-muted/30 text-sm">
                    <Paperclip className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span className="flex-1 truncate text-foreground">{attachment.name}</span>
                    <button
                      type="button"
                      onClick={() => { setAttachment(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                      className="text-muted-foreground hover:text-foreground"
                      aria-label="Remove attachment"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Paperclip className="w-4 h-4" />
                    Attach file
                  </Button>
                )}
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
