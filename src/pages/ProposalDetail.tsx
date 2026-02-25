import { useMemo, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useProposal, useDeleteProposal, useDuplicateProposal, useSendProposal } from '@/hooks/useProposals';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  ArrowLeft,
  Lock,
  Copy,
  Send,
  Pencil,
  Trash2,
  Plus,
  Check,
  X,
  Clock,
  Eye,
  FileEdit,
  Loader2,
} from 'lucide-react';
import { ProposalStatusBadge } from '@/components/proposals/ProposalStatusBadge';
import { ProposalActivityTimeline } from '@/components/proposals/ProposalActivityTimeline';
import { ContentBlocksEditor } from '@/components/content-blocks/ContentBlocksEditor';
import { PROPOSAL_STATUS_CONFIG, BILLING_TYPE_LABELS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { generateHTML } from '@/lib/tiptap-extensions';
import type { JSONContent } from '@tiptap/react';
import type { ProposalWithDetails, ProposalLineItem, ProposalAddon, Agreement } from '@/types/database';

// --- Helpers ---

function formatCurrency(amount: number) {
  return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

// --- Service Items Card ---

function ServiceItemsCard({ lineItems }: { lineItems: ProposalLineItem[] }) {
  const sorted = useMemo(
    () => [...lineItems].sort((a, b) => a.sort_order - b.sort_order),
    [lineItems],
  );

  const subtotal = sorted.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);

  return (
    <Card>
      <CardContent className="p-5">
        <h3 className="text-sm font-semibold mb-4">Service Items</h3>
        {sorted.length === 0 ? (
          <p className="text-sm text-muted-foreground">No service items.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="pb-2 font-medium">Name</th>
                  <th className="pb-2 font-medium text-right">Qty</th>
                  <th className="pb-2 font-medium text-right">Unit Price</th>
                  <th className="pb-2 font-medium text-right">Type</th>
                  <th className="pb-2 font-medium text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sorted.map((item) => {
                  const descHtml = item.description_json && typeof item.description_json === 'object' && 'type' in item.description_json && item.description_json.type === 'doc'
                    ? (() => { try { return generateHTML(item.description_json as JSONContent); } catch { return null; } })()
                    : null;

                  return (
                  <tr key={item.id}>
                    <td className="py-2.5">
                      <p className="font-medium">{item.name}</p>
                      {descHtml ? (
                        <div
                          className="prose prose-xs max-w-none text-muted-foreground mt-0.5"
                          dangerouslySetInnerHTML={{ __html: descHtml }}
                        />
                      ) : item.description ? (
                        <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                      ) : null}
                    </td>
                    <td className="py-2.5 text-right font-mono">{item.quantity}</td>
                    <td className="py-2.5 text-right font-mono">{formatCurrency(item.unit_price)}</td>
                    <td className="py-2.5 text-right">
                      <span className="text-xs text-muted-foreground">
                        {BILLING_TYPE_LABELS[item.billing_type]}
                      </span>
                    </td>
                    <td className="py-2.5 text-right font-mono font-medium">
                      {formatCurrency(item.quantity * item.unit_price)}
                    </td>
                  </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t border-border">
                  <td colSpan={4} className="pt-3 text-right font-medium text-muted-foreground">
                    Subtotal
                  </td>
                  <td className="pt-3 text-right font-mono font-semibold">
                    {formatCurrency(subtotal)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// --- Addons Card ---

function AddonsCard({ addons }: { addons: ProposalAddon[] }) {
  const sorted = useMemo(
    () => [...addons].sort((a, b) => a.sort_order - b.sort_order),
    [addons],
  );

  if (sorted.length === 0) return null;

  return (
    <Card>
      <CardContent className="p-5">
        <h3 className="text-sm font-semibold mb-4">Add-ons</h3>
        <div className="space-y-3">
          {sorted.map((addon) => (
            <div
              key={addon.id}
              className={cn(
                'flex items-start justify-between gap-4 p-3 rounded-lg border',
                addon.is_selected
                  ? 'border-emerald-200 bg-emerald-50/50'
                  : 'border-border bg-muted/30',
              )}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm">{addon.name}</p>
                  {addon.is_selected ? (
                    <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 text-xs">
                      <Check className="w-3 h-3 mr-1" />
                      Selected
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs">
                      Not selected
                    </Badge>
                  )}
                </div>
                {addon.description_json && typeof addon.description_json === 'object' && 'type' in addon.description_json && addon.description_json.type === 'doc' ? (
                  (() => {
                    try {
                      const html = generateHTML(addon.description_json as JSONContent);
                      return (
                        <div
                          className="prose prose-xs max-w-none text-muted-foreground mt-1"
                          dangerouslySetInnerHTML={{ __html: html }}
                        />
                      );
                    } catch {
                      return addon.description ? (
                        <p className="text-xs text-muted-foreground mt-1">{addon.description}</p>
                      ) : null;
                    }
                  })()
                ) : addon.description ? (
                  <p className="text-xs text-muted-foreground mt-1">{addon.description}</p>
                ) : null}
              </div>
              <div className="text-right shrink-0">
                <p className="font-mono font-medium text-sm">{formatCurrency(addon.price)}</p>
                <p className="text-xs text-muted-foreground">
                  {BILLING_TYPE_LABELS[addon.billing_type]}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// --- Pricing Summary ---

function PricingSummary({ proposal }: { proposal: ProposalWithDetails }) {
  const baseTotal = proposal.line_items.reduce(
    (sum, item) => sum + item.quantity * item.unit_price,
    0,
  );

  const selectedAddonsTotal = proposal.addons
    .filter((a) => a.is_selected)
    .reduce((sum, a) => sum + a.price, 0);

  const grandTotal = baseTotal + selectedAddonsTotal;

  return (
    <Card>
      <CardContent className="p-5">
        <h3 className="text-sm font-semibold mb-4">Pricing Summary</h3>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Base services</span>
            <span className="font-mono">{formatCurrency(baseTotal)}</span>
          </div>
          {selectedAddonsTotal > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Selected add-ons</span>
              <span className="font-mono">{formatCurrency(selectedAddonsTotal)}</span>
            </div>
          )}
          <div className="border-t border-border pt-3 mt-3 flex justify-between items-baseline">
            <span className="font-semibold">Total</span>
            <span className="text-xl font-bold font-mono">{formatCurrency(grandTotal)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// --- Signature Display ---

function SignatureDisplay({ agreement }: { agreement: Agreement }) {
  return (
    <div className="mt-4 pt-4 border-t border-border">
      <p className="text-xs text-muted-foreground mb-2">Signature</p>
      <p
        className="text-2xl text-foreground"
        style={{ fontFamily: "'Dancing Script', cursive" }}
      >
        {agreement.signer_name}
      </p>
      <p className="text-xs text-muted-foreground mt-1">
        Signed {format(new Date(agreement.signed_at), 'MMM d, yyyy')}
        {agreement.signer_email && ` by ${agreement.signer_email}`}
      </p>
    </div>
  );
}

// --- Status Info Sections ---

function DraftInfo() {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center gap-2 text-muted-foreground">
          <FileEdit className="w-4 h-4" />
          <p className="text-sm">Draft -- not yet sent to client.</p>
        </div>
      </CardContent>
    </Card>
  );
}

function SentInfo({ proposal }: { proposal: ProposalWithDetails }) {
  return (
    <Card>
      <CardContent className="p-5 space-y-2">
        {proposal.sent_at && (
          <div className="flex items-center gap-2 text-sm">
            <Send className="w-4 h-4 text-primary shrink-0" />
            <span>Sent {format(new Date(proposal.sent_at), 'MMM d, yyyy')}</span>
          </div>
        )}
        {proposal.expires_at && (
          <div className="flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
            <span>Expires {format(new Date(proposal.expires_at), 'MMM d, yyyy')}</span>
          </div>
        )}
        {proposal.viewed_at && (
          <div className="flex items-center gap-2 text-sm">
            <Eye className="w-4 h-4 text-blue-500 shrink-0" />
            <span>Viewed {format(new Date(proposal.viewed_at), 'MMM d, yyyy')}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function AcceptedInfo({ proposal }: { proposal: ProposalWithDetails }) {
  const agreement = proposal.agreement;

  return (
    <Card className="border-l-4 border-l-emerald-500">
      <CardContent className="p-5">
        {proposal.accepted_at && (
          <div className="flex items-center gap-2 text-sm">
            <Check className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>
              Accepted {format(new Date(proposal.accepted_at), 'MMM d, yyyy')}
              {agreement?.signer_name && ` by ${agreement.signer_name}`}
            </span>
          </div>
        )}
        {agreement && <SignatureDisplay agreement={agreement} />}
      </CardContent>
    </Card>
  );
}

function DeclinedInfo({ proposal }: { proposal: ProposalWithDetails }) {
  return (
    <Card>
      <CardContent className="p-5 space-y-2">
        {proposal.declined_at && (
          <div className="flex items-center gap-2 text-sm">
            <X className="w-4 h-4 text-red-500 shrink-0" />
            <span>Declined {format(new Date(proposal.declined_at), 'MMM d, yyyy')}</span>
          </div>
        )}
        {proposal.decline_reason && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-2">
            <p className="text-xs font-medium text-red-700 mb-1">Reason</p>
            <p className="text-sm text-red-800">{proposal.decline_reason}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ExpiredInfo({ proposal }: { proposal: ProposalWithDetails }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center gap-2 text-sm">
          <Clock className="w-4 h-4 text-amber-500 shrink-0" />
          <span>
            Expired {proposal.expires_at
              ? format(new Date(proposal.expires_at), 'MMM d, yyyy')
              : format(new Date(proposal.updated_at), 'MMM d, yyyy')}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

// --- Main Page Component ---

export default function ProposalDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: proposal, isLoading } = useProposal(id!);
  const deleteProposal = useDeleteProposal();
  const duplicateProposal = useDuplicateProposal();
  const sendProposal = useSendProposal();
  const [sendResult, setSendResult] = useState<{ portal_url: string; raw_token: string } | null>(null);

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  // Not found state
  if (!proposal) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">Proposal not found.</p>
        <Link to="/proposals" className="text-primary hover:underline text-sm mt-2 inline-block">
          Back to proposals
        </Link>
      </div>
    );
  }

  const clientName =
    proposal.client?.company_name || proposal.client?.contact_name || 'Unknown client';
  const contactName = proposal.client?.contact_name;
  const status = proposal.status;

  const handleDelete = async () => {
    try {
      await deleteProposal.mutateAsync(proposal.id);
      toast.success('Proposal deleted');
      navigate('/proposals');
    } catch {
      toast.error('Failed to delete proposal');
    }
  };

  const handleDuplicate = async () => {
    try {
      const newProposal = await duplicateProposal.mutateAsync(proposal.id);
      toast.success('Proposal duplicated');
      navigate(`/proposals/${newProposal.id}`);
    } catch {
      toast.error('Failed to duplicate proposal');
    }
  };

  const handleSend = async () => {
    try {
      const result = await sendProposal.mutateAsync(proposal.id);
      setSendResult(result);
      toast.success('Proposal sent successfully!');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to send proposal');
    }
  };

  const showAddons = status !== 'draft' && proposal.addons.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <Link to="/proposals">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div className="min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl font-extrabold tracking-tight truncate">
                {proposal.title}
              </h1>
              <div className="flex items-center gap-2">
                <ProposalStatusBadge status={status} />
                {status === 'accepted' && (
                  <Lock className="w-4 h-4 text-emerald-600" />
                )}
              </div>
            </div>
            <p className="text-muted-foreground mt-0.5 truncate">
              {clientName}
              {contactName && clientName !== contactName && ` - ${contactName}`}
            </p>
          </div>
        </div>
      </div>

      {/* Summary */}
      {(proposal.summary_json || proposal.summary) && (
        <Card>
          <CardContent className="p-5">
            {proposal.summary_json && typeof proposal.summary_json === 'object' && 'type' in proposal.summary_json && proposal.summary_json.type === 'doc' ? (
              <div
                className="prose prose-sm max-w-none text-muted-foreground"
                dangerouslySetInnerHTML={{ __html: (() => { try { return generateHTML(proposal.summary_json as unknown as JSONContent); } catch { return ''; } })() }}
              />
            ) : proposal.summary ? (
              <p className="text-sm text-muted-foreground">{proposal.summary}</p>
            ) : null}
          </CardContent>
        </Card>
      )}

      {/* Status-specific section */}
      {status === 'draft' && <DraftInfo />}
      {(status === 'sent' || status === 'viewed') && <SentInfo proposal={proposal} />}
      {status === 'accepted' && <AcceptedInfo proposal={proposal} />}
      {status === 'declined' && <DeclinedInfo proposal={proposal} />}
      {status === 'expired' && <ExpiredInfo proposal={proposal} />}

      {/* Activity Timeline */}
      <ProposalActivityTimeline proposal={proposal} />

      {/* Service Items */}
      <ServiceItemsCard lineItems={proposal.line_items} />

      {/* Content Blocks */}
      <ContentBlocksEditor proposalId={proposal.id} readOnly />

      {/* Addons */}
      {showAddons && <AddonsCard addons={proposal.addons} />}

      {/* Pricing Summary */}
      <PricingSummary proposal={proposal} />

      {/* Notes */}
      {proposal.notes && (
        <Card>
          <CardContent className="p-5">
            <h3 className="text-sm font-semibold mb-2">Notes</h3>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{proposal.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex items-center gap-3 flex-wrap">
        {status === 'draft' && (
          <>
            <Button asChild variant="outline" className="gap-2">
              <Link to={`/proposals/${proposal.id}/edit`}>
                <Pencil className="w-4 h-4" />
                Edit
              </Link>
            </Button>
            <Button className="gap-2" onClick={handleSend} disabled={sendProposal.isPending}>
              {sendProposal.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              Send
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" className="gap-2 text-destructive hover:text-destructive">
                  <Trash2 className="w-4 h-4" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete proposal?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete "{proposal.title}". This cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {deleteProposal.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      'Delete'
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        )}

        {(status === 'sent' || status === 'viewed') && (
          <>
            <Button variant="outline" className="gap-2" onClick={handleSend} disabled={sendProposal.isPending}>
              {sendProposal.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              Resend
            </Button>
            <Button variant="outline" className="gap-2" onClick={handleDuplicate} disabled={duplicateProposal.isPending}>
              {duplicateProposal.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Copy className="w-4 h-4" />}
              Duplicate
            </Button>
          </>
        )}

        {status === 'accepted' && (
          <Button variant="outline" className="gap-2" onClick={handleDuplicate} disabled={duplicateProposal.isPending}>
            {duplicateProposal.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Copy className="w-4 h-4" />}
            Duplicate
          </Button>
        )}

        {(status === 'declined' || status === 'expired') && (
          <>
            <Button variant="outline" className="gap-2" onClick={handleDuplicate} disabled={duplicateProposal.isPending}>
              {duplicateProposal.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Copy className="w-4 h-4" />}
              Duplicate
            </Button>
            <Button className="gap-2" onClick={handleDuplicate}>
              <Plus className="w-4 h-4" />
              Create New Version
            </Button>
          </>
        )}
      </div>

      {/* Send Success Dialog */}
      <Dialog open={!!sendResult} onOpenChange={() => setSendResult(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Proposal Sent!</DialogTitle>
            <DialogDescription>
              Share this link with your client to view and accept the proposal.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={sendResult?.portal_url ?? ''}
                className="flex-1 text-sm bg-muted rounded-md px-3 py-2 border border-border font-mono"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(sendResult?.portal_url ?? '');
                  toast.success('Link copied to clipboard');
                }}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
