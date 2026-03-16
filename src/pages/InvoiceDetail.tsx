import { useParams, useNavigate } from 'react-router-dom';
import { useInvoice, useUpdateInvoiceStatus, type InvoiceStatus } from '@/hooks/useInvoices';
import { useOperatorProfile } from '@/hooks/useStripeConnect';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Printer, Send, CheckCircle, AlertCircle, Mail } from 'lucide-react';
import { format, isPast } from 'date-fns';
import { toast } from 'sonner';

const STATUS_CONFIG: Record<InvoiceStatus, { label: string; variant: 'default' | 'secondary' | 'destructive'; className: string }> = {
  draft:   { label: 'Draft',   variant: 'secondary',    className: 'text-muted-foreground' },
  sent:    { label: 'Sent',    variant: 'secondary',    className: 'text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800' },
  paid:    { label: 'Paid',    variant: 'secondary',    className: 'text-status-success bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800' },
  overdue: { label: 'Overdue', variant: 'destructive',  className: 'text-status-danger bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800' },
  void:    { label: 'Void',    variant: 'secondary',    className: 'text-muted-foreground/60' },
};

function formatCurrency(cents: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

export default function InvoiceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: invoice, isLoading, error } = useInvoice(id ?? '');
  const { data: operator } = useOperatorProfile();
  const updateStatus = useUpdateInvoiceStatus();

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <AlertCircle className="w-10 h-10 text-status-danger" />
        <p className="text-muted-foreground">Invoice not found.</p>
        <Button variant="outline" onClick={() => navigate('/invoices')}>
          Back to Invoices
        </Button>
      </div>
    );
  }

  const total = invoice.line_items.reduce((s, li) => s + li.unit_price * li.quantity, 0);
  const statusCfg = STATUS_CONFIG[invoice.status];
  const isOverdue = invoice.status === 'sent' && isPast(new Date(invoice.due_date));

  const handleMarkSent = () => {
    updateStatus.mutate({ id: invoice.id, status: 'sent' });
    toast.success('Marked as sent');
  };

  const handleMarkPaid = () => {
    updateStatus.mutate({ id: invoice.id, status: 'paid' });
    toast.success('Marked as paid');
  };

  const handlePrint = () => window.print();

  const handleEmailCompose = () => {
    const subject = encodeURIComponent(`Invoice ${invoice.invoice_number}`);
    const totalFormatted = formatCurrency(total, invoice.currency);
    const dueFormatted = format(new Date(invoice.due_date), 'MMM d, yyyy');
    const body = encodeURIComponent(
      `Hi,\n\nPlease find attached invoice ${invoice.invoice_number} for ${totalFormatted}, due ${dueFormatted}.\n\nThank you!`
    );
    const mailto = invoice.client_email
      ? `mailto:${invoice.client_email}?subject=${subject}&body=${body}`
      : `mailto:?subject=${subject}&body=${body}`;
    window.location.href = mailto;
  };

  const fromName = operator?.business_name || operator?.full_name || 'Your Business';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Toolbar — hidden on print */}
      <div className="flex items-center justify-between print:hidden">
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 -ml-2 text-muted-foreground"
          onClick={() => navigate('/invoices')}
        >
          <ArrowLeft className="w-4 h-4" />
          Invoices
        </Button>
        <div className="flex items-center gap-2">
          {invoice.status === 'draft' && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={handleEmailCompose}
            >
              <Mail className="w-3.5 h-3.5" />
              Send via Email
            </Button>
          )}
          {invoice.status === 'draft' && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-muted-foreground"
              onClick={handleMarkSent}
              disabled={updateStatus.isPending}
              title="Mark as sent without emailing the client"
            >
              <Send className="w-3.5 h-3.5" />
              Mark Sent (Manual)
            </Button>
          )}
          {(invoice.status === 'sent' || isOverdue) && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-status-success border-green-300"
              onClick={handleMarkPaid}
              disabled={updateStatus.isPending}
            >
              <CheckCircle className="w-3.5 h-3.5" />
              Mark as Paid
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={handlePrint}
          >
            <Printer className="w-3.5 h-3.5" />
            Print / PDF
          </Button>
        </div>
      </div>

      {/* Invoice document */}
      <div
        id="invoice-document"
        className="bg-card border border-border rounded-xl p-8 md:p-12 max-w-3xl mx-auto print:border-0 print:shadow-none print:p-0 print:max-w-full"
      >
        {/* Header row */}
        <div className="flex items-start justify-between mb-10">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-foreground">INVOICE</h1>
            <p className="text-xl font-mono font-semibold text-primary mt-1">{invoice.invoice_number}</p>
          </div>
          <div className="text-right">
            <p className="font-semibold text-foreground">{fromName}</p>
            {operator?.full_name && operator.business_name && (
              <p className="text-sm text-muted-foreground">{operator.full_name}</p>
            )}
          </div>
        </div>

        {/* From / To / Dates */}
        <div className="grid grid-cols-2 gap-8 mb-10">
          <div>
            <p className="text-xs uppercase tracking-widest font-semibold text-muted-foreground mb-2">Bill To</p>
            <p className="font-semibold text-foreground">{invoice.client_name}</p>
          </div>
          <div className="text-right">
            <div className="space-y-1">
              <div className="flex justify-end gap-8">
                <span className="text-xs uppercase tracking-widest text-muted-foreground">Issue Date</span>
                <span className="text-sm font-medium tabular-nums">{format(new Date(invoice.issue_date), 'MMM d, yyyy')}</span>
              </div>
              <div className="flex justify-end gap-8">
                <span className="text-xs uppercase tracking-widest text-muted-foreground">Due Date</span>
                <span className={`text-sm font-medium tabular-nums ${isOverdue ? 'text-status-danger font-semibold' : ''}`}>
                  {format(new Date(invoice.due_date), 'MMM d, yyyy')}
                  {isOverdue && ' (overdue)'}
                </span>
              </div>
              <div className="flex justify-end gap-8 pt-1">
                <span className="text-xs uppercase tracking-widest text-muted-foreground">Status</span>
                <Badge variant="secondary" className={`text-xs ${statusCfg.className}`}>
                  {statusCfg.label}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        <Separator className="mb-8" />

        {/* Line items table */}
        <table className="w-full text-sm mb-8">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left text-xs uppercase tracking-widest text-muted-foreground pb-3 font-semibold">Description</th>
              <th className="text-right text-xs uppercase tracking-widest text-muted-foreground pb-3 font-semibold w-16">Qty</th>
              <th className="text-right text-xs uppercase tracking-widest text-muted-foreground pb-3 font-semibold w-28">Unit Price</th>
              <th className="text-right text-xs uppercase tracking-widest text-muted-foreground pb-3 font-semibold w-28">Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoice.line_items.map((li) => (
              <tr key={li.id} className="border-b border-border/50">
                <td className="py-3 text-foreground">{li.description}</td>
                <td className="py-3 text-right tabular-nums text-muted-foreground">
                  {li.quantity % 1 === 0 ? li.quantity : li.quantity.toFixed(1)}
                </td>
                <td className="py-3 text-right tabular-nums text-muted-foreground">
                  {formatCurrency(li.unit_price, invoice.currency)}
                </td>
                <td className="py-3 text-right tabular-nums font-medium">
                  {formatCurrency(li.unit_price * li.quantity, invoice.currency)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Total */}
        <div className="flex justify-end">
          <div className="w-64">
            <div className="flex justify-between py-3 border-t-2 border-foreground">
              <span className="font-bold text-foreground">Total</span>
              <span className="font-black text-lg font-mono text-foreground">
                {formatCurrency(total, invoice.currency)}
              </span>
            </div>
            {invoice.status === 'paid' && invoice.paid_at && (
              <p className="text-xs text-status-success text-right mt-1">
                Paid {format(new Date(invoice.paid_at), 'MMM d, yyyy')}
              </p>
            )}
          </div>
        </div>

        {/* Notes */}
        {invoice.notes && (
          <div className="mt-10 pt-8 border-t border-border">
            <p className="text-xs uppercase tracking-widest font-semibold text-muted-foreground mb-2">Notes</p>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{invoice.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}
