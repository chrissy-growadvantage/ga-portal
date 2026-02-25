import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { Link2, Copy, Check, RefreshCw, Loader2, ExternalLink, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface MagicLinkPanelProps {
  clientId: string;
  hasExistingLink: boolean;
  expiresAt: string | null;
  onTokenUpdated: () => void;
}

export function MagicLinkPanel({ clientId, hasExistingLink, expiresAt, onTokenUpdated }: MagicLinkPanelProps) {
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  // Raw token is only available immediately after generation (not stored in DB)
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [generatedExpiresAt, setGeneratedExpiresAt] = useState<string | null>(null);

  const isExpired = expiresAt ? new Date(expiresAt) < new Date() : false;
  const hasValidLink = hasExistingLink && !isExpired;
  const displayExpiresAt = generatedExpiresAt ?? expiresAt;

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const session = await supabase.auth.getSession();
      const accessToken = session.data.session?.access_token;
      if (!accessToken) throw new Error('Not authenticated');

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const response = await fetch(`${supabaseUrl}/functions/v1/generate-magic-link`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ client_id: clientId }),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result?.error?.message ?? 'Generation failed');
      }

      const { raw_token, expires_at } = await response.json();
      const url = `${window.location.origin}/portal/${raw_token}`;

      setGeneratedUrl(url);
      setGeneratedExpiresAt(expires_at);
      toast.success('Magic link generated — copy it now!');
      onTokenUpdated();
    } catch {
      toast.error('Failed to generate link');
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = async () => {
    if (!generatedUrl) return;
    try {
      await navigator.clipboard.writeText(generatedUrl);
      setCopied(true);
      toast.success('Link copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy link');
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Link2 className="w-4 h-4" />
            Client Portal Link
          </CardTitle>
          {hasValidLink && !generatedUrl && (
            <Badge variant="secondary" className="text-xs bg-green-50 text-green-700">
              Active
            </Badge>
          )}
          {isExpired && hasExistingLink && !generatedUrl && (
            <Badge variant="secondary" className="text-xs bg-amber-50 text-amber-700">
              Expired
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Just-generated URL — show once for copy */}
        {generatedUrl ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex-1 min-w-0 px-3 py-2 bg-muted rounded-md">
                <p className="text-xs font-mono truncate text-muted-foreground">
                  {generatedUrl}
                </p>
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopy}
                className="shrink-0"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Expires {displayExpiresAt ? format(new Date(displayExpiresAt), 'MMM d, yyyy') : 'in 30 days'}
              </p>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs gap-1"
                asChild
              >
                <a href={generatedUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-3 h-3" />
                  Preview
                </a>
              </Button>
            </div>
            <p className="text-[11px] text-amber-600 bg-amber-50 px-2.5 py-1.5 rounded-md">
              Copy this link now. For security, the raw link is not stored and cannot be retrieved later.
            </p>
          </div>
        ) : hasValidLink ? (
          /* Existing valid link — no raw token available */
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <ShieldCheck className="w-4 h-4 text-green-600 shrink-0" />
              <span>A portal link is active for this client.</span>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Expires {expiresAt ? format(new Date(expiresAt), 'MMM d, yyyy') : 'unknown'}
              </p>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs gap-1"
                onClick={handleGenerate}
                disabled={generating}
              >
                <RefreshCw className={`w-3 h-3 ${generating ? 'animate-spin' : ''}`} />
                Regenerate
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              The original link URL cannot be retrieved. Regenerating will invalidate the current link.
            </p>
          </div>
        ) : (
          /* No link or expired */
          <div className="text-center py-2">
            <p className="text-sm text-muted-foreground mb-3">
              {isExpired
                ? 'The client portal link has expired. Generate a new one.'
                : 'Generate a link to share your delivery summary with this client.'}
            </p>
            <Button
              onClick={handleGenerate}
              disabled={generating}
              size="sm"
              className="gap-2"
            >
              {generating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Link2 className="w-4 h-4" />
              )}
              Generate Magic Link
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
