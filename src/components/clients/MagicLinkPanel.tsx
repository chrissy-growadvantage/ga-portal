import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase';
import {
  Link2,
  Copy,
  Check,
  Loader2,
  ExternalLink,
  Mail,
  Plus,
  X,
  Pencil,
  ShieldOff,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { usePortalLinks, useRevokePortalLink, useUpdatePortalLinkLabel } from '@/hooks/usePortalLinks';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import type { PortalLink } from '@/types/database';

interface MagicLinkPanelProps {
  clientId: string;
  companyName: string;
  contactEmail?: string | null;
  contactName?: string | null;
}

// ── NewLinkBanner ─────────────────────────────────────────────────────────
// Shown immediately after generating a link. Displays the one-time raw URL.

interface NewLinkBannerProps {
  url: string;
  expiresAt: string;
  label: string | null;
  contactEmail?: string | null;
  contactName?: string | null;
  companyName: string;
  onDismiss: () => void;
}

function NewLinkBanner({
  url,
  expiresAt,
  label,
  contactEmail,
  contactName,
  companyName,
  onDismiss,
}: NewLinkBannerProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success('Link copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy link');
    }
  };

  return (
    <div className="rounded-lg border border-green-200 bg-green-50 p-3 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-green-800">
          {label ? `"${label}" generated` : 'New link generated'} — copy it now
        </p>
        <button
          onClick={onDismiss}
          className="text-green-600 hover:text-green-800 transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex-1 min-w-0 px-2.5 py-1.5 bg-white border border-green-200 rounded-md">
          <p className="text-xs font-mono truncate text-muted-foreground">{url}</p>
        </div>
        <Button variant="outline" size="icon" onClick={handleCopy} className="shrink-0 h-8 w-8">
          {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
        </Button>
      </div>
      <div className="flex items-center justify-between">
        <p className="text-[11px] text-green-700">
          Expires {format(new Date(expiresAt), 'MMM d, yyyy')}
        </p>
        <div className="flex items-center gap-1">
          {contactEmail && (
            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" asChild>
              <a
                href={`mailto:${contactEmail}?subject=Your%20Client%20Portal%20%E2%80%94%20${encodeURIComponent(companyName)}&body=Hi%20${encodeURIComponent(contactName ?? companyName)}%2C%0A%0AHere%20is%20your%20portal%20link%3A%0A${encodeURIComponent(url)}%0A%0AYou%20can%20use%20this%20link%20to%20view%20your%20deliveries%2C%20approve%20work%2C%20and%20track%20progress.%0A%0APlease%20note%20this%20link%20is%20private%20and%20expires%20on%20${format(new Date(expiresAt), 'MMMM%20d%2C%20yyyy')}.`}
              >
                <Mail className="w-3 h-3" />
                Email
              </a>
            </Button>
          )}
          <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" asChild>
            <a href={url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-3 h-3" />
              Preview
            </a>
          </Button>
        </div>
      </div>
      <p className="text-[11px] text-amber-700 bg-amber-50 px-2 py-1 rounded">
        The raw link is not stored. Once you dismiss this, you cannot retrieve it. Revoke or let it
        expire to deactivate.
      </p>
    </div>
  );
}

// ── PortalLinkRow ─────────────────────────────────────────────────────────

interface PortalLinkRowProps {
  link: PortalLink;
  clientId: string;
}

function PortalLinkRow({ link, clientId }: PortalLinkRowProps) {
  const [editingLabel, setEditingLabel] = useState(false);
  const [labelValue, setLabelValue] = useState(link.label ?? '');

  const revokeLink = useRevokePortalLink(clientId);
  const updateLabel = useUpdatePortalLinkLabel(clientId);

  const isExpired = new Date(link.expires_at) < new Date();
  const isActive = link.is_active && !isExpired;

  const handleLabelSave = async () => {
    const trimmed = labelValue.trim() || null;
    try {
      await updateLabel.mutateAsync({ linkId: link.id, label: trimmed });
      setEditingLabel(false);
      toast.success('Label updated');
    } catch {
      toast.error('Failed to update label');
    }
  };

  const handleRevoke = async () => {
    try {
      await revokeLink.mutateAsync(link.id);
      toast.success('Link revoked');
    } catch {
      toast.error('Failed to revoke link');
    }
  };

  return (
    <div
      className={`flex items-start gap-3 p-2.5 rounded-md border ${
        isActive ? 'border-border bg-card' : 'border-border/50 bg-muted/30 opacity-60'
      }`}
    >
      <div className="flex-1 min-w-0 space-y-0.5">
        {/* Label row */}
        {editingLabel ? (
          <div className="flex items-center gap-1.5">
            <Input
              value={labelValue}
              onChange={(e) => setLabelValue(e.target.value)}
              placeholder="e.g. Chrissy's link"
              className="h-7 text-xs"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleLabelSave();
                if (e.key === 'Escape') setEditingLabel(false);
              }}
            />
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={handleLabelSave}
              disabled={updateLabel.isPending}
            >
              {updateLabel.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Save'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => setEditingLabel(false)}
            >
              Cancel
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium truncate">
              {link.label ?? 'Unnamed link'}
            </span>
            {isActive && (
              <button
                onClick={() => setEditingLabel(true)}
                className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
                aria-label="Edit label"
              >
                <Pencil className="w-3 h-3" />
              </button>
            )}
          </div>
        )}

        {/* Meta row */}
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          <span>Created {format(new Date(link.created_at), 'MMM d, yyyy')}</span>
          <span>·</span>
          <span>
            {isExpired
              ? `Expired ${format(new Date(link.expires_at), 'MMM d, yyyy')}`
              : `Expires ${format(new Date(link.expires_at), 'MMM d, yyyy')}`}
          </span>
        </div>
      </div>

      {/* Status + revoke */}
      <div className="flex items-center gap-1.5 shrink-0">
        {isActive ? (
          <Badge className="text-[10px] h-5 px-1.5 bg-status-success/10 text-status-success border-0">
            Active
          </Badge>
        ) : isExpired ? (
          <Badge variant="secondary" className="text-[10px] h-5 px-1.5">
            Expired
          </Badge>
        ) : (
          <Badge variant="secondary" className="text-[10px] h-5 px-1.5">
            Revoked
          </Badge>
        )}

        {isActive && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-muted-foreground hover:text-destructive"
            onClick={handleRevoke}
            disabled={revokeLink.isPending}
            title="Revoke link"
          >
            {revokeLink.isPending ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <ShieldOff className="w-3 h-3" />
            )}
          </Button>
        )}
      </div>
    </div>
  );
}

// ── MagicLinkPanel ────────────────────────────────────────────────────────

export function MagicLinkPanel({
  clientId,
  companyName,
  contactEmail,
  contactName,
}: MagicLinkPanelProps) {
  const [generating, setGenerating] = useState(false);
  const [newLinkUrl, setNewLinkUrl] = useState<string | null>(null);
  const [newLinkExpiresAt, setNewLinkExpiresAt] = useState<string | null>(null);
  const [newLinkLabel, setNewLinkLabel] = useState<string | null>(null);
  const [labelInput, setLabelInput] = useState('');
  const [showAll, setShowAll] = useState(false);

  const queryClient = useQueryClient();
  const { data: links = [], isLoading } = usePortalLinks(clientId);

  const activeLinks = links.filter((l) => l.is_active && new Date(l.expires_at) > new Date());
  const inactiveLinks = links.filter((l) => !l.is_active || new Date(l.expires_at) <= new Date());
  const visibleInactive = showAll ? inactiveLinks : inactiveLinks.slice(0, 2);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const session = await supabase.auth.getSession();
      const accessToken = session.data.session?.access_token;
      if (!accessToken) throw new Error('Not authenticated');

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
      const response = await fetch(`${supabaseUrl}/functions/v1/generate-magic-link`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          apikey: import.meta.env.VITE_SUPABASE_ANON_KEY as string,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: clientId,
          label: labelInput.trim() || null,
        }),
      });

      if (!response.ok) {
        const result = (await response.json()) as { error?: { message?: string } };
        throw new Error(result?.error?.message ?? 'Generation failed');
      }

      const result = (await response.json()) as { raw_token: string; expires_at: string };
      const url = `${window.location.origin}/portal/${result.raw_token}`;

      setNewLinkUrl(url);
      setNewLinkExpiresAt(result.expires_at);
      setNewLinkLabel(labelInput.trim() || null);
      setLabelInput('');

      toast.success('Magic link generated — copy it now!');
      queryClient.invalidateQueries({ queryKey: queryKeys.portalLinks.list(clientId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.detail(clientId) });
    } catch {
      toast.error('Failed to generate link');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Link2 className="w-4 h-4" />
          Client Portal Links
          {activeLinks.length > 0 && (
            <Badge className="ml-1 text-[10px] h-5 px-1.5 bg-status-success/10 text-status-success border-0">
              {activeLinks.length} active
            </Badge>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* New link banner (one-time raw URL display) */}
        {newLinkUrl && newLinkExpiresAt && (
          <NewLinkBanner
            url={newLinkUrl}
            expiresAt={newLinkExpiresAt}
            label={newLinkLabel}
            contactEmail={contactEmail}
            contactName={contactName}
            companyName={companyName}
            onDismiss={() => {
              setNewLinkUrl(null);
              setNewLinkExpiresAt(null);
              setNewLinkLabel(null);
            }}
          />
        )}

        {/* Loading state */}
        {isLoading && (
          <div className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Loading links…</span>
          </div>
        )}

        {/* Active links */}
        {!isLoading && activeLinks.length > 0 && (
          <div className="space-y-2">
            {activeLinks.map((link) => (
              <PortalLinkRow key={link.id} link={link} clientId={clientId} />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && links.length === 0 && !newLinkUrl && (
          <p className="text-sm text-muted-foreground py-1">
            No portal links yet. Generate one to share with your client.
          </p>
        )}

        {/* Inactive/expired links (collapsed by default) */}
        {!isLoading && inactiveLinks.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">
              Revoked / Expired
            </p>
            <div className="space-y-1.5">
              {visibleInactive.map((link) => (
                <PortalLinkRow key={link.id} link={link} clientId={clientId} />
              ))}
            </div>
            {inactiveLinks.length > 2 && (
              <button
                onClick={() => setShowAll((v) => !v)}
                className="text-xs text-muted-foreground hover:text-foreground underline"
              >
                {showAll ? 'Show less' : `Show ${inactiveLinks.length - 2} more`}
              </button>
            )}
          </div>
        )}

        {/* Generate new link form */}
        <div className="pt-1 border-t border-border space-y-2">
          <div className="flex items-center gap-2">
            <Input
              value={labelInput}
              onChange={(e) => setLabelInput(e.target.value)}
              placeholder="Label (optional) — e.g. Chrissy's link"
              className="h-8 text-xs flex-1"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !generating) handleGenerate();
              }}
            />
            <Button
              onClick={handleGenerate}
              disabled={generating}
              size="sm"
              className="gap-1.5 shrink-0"
            >
              {generating ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Plus className="w-3.5 h-3.5" />
              )}
              Generate Link
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Generating a new link does not invalidate existing active links.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
