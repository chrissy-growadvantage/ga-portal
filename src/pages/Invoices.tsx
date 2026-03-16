import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClients } from '@/hooks/useClients';
import { useDeliveries } from '@/hooks/useDeliveries';
import {
  useInvoices,
  useCreateInvoice,
  useUpdateInvoiceStatus,
  type InvoiceStatus,
} from '@/hooks/useInvoices';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FileText, Plus, Send, Download, X, Layers } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

const STATUS_CONFIG: Record<InvoiceStatus, { label: string; color: string }> = {
  draft: { label: 'Draft', color: 'text-muted-foreground' },
  sent: { label: 'Sent', color: 'text-blue-600' },
  paid: { label: 'Paid', color: 'text-status-success' },
  overdue: { label: 'Overdue', color: 'text-status-danger' },
  void: { label: 'Void', color: 'text-muted-foreground/60' },
};

function formatCurrency(cents: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

type LineItemDraft = { description: string; quantity: string; unitPrice: string };

function CreateInvoiceDialog({
  open,
  onOpenChange,
  clients,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  clients: Array<{ id: string; company_name: string | null; contact_name: string | null }>;
}) {
  const createInvoice = useCreateInvoice();
  const [clientId, setClientId] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [lineItems, setLineItems] = useState<LineItemDraft[]>([
    { description: '', quantity: '1', unitPrice: '' },
  ]);

  // Delivery-to-invoice pipeline: load completed deliveries for selected client
  const { data: clientDeliveries } = useDeliveries(clientId || undefined);
  const completedDeliveries = (clientDeliveries ?? []).filter(
    (d) => d.status === 'completed' || d.status === 'approved',
  );

  const loadDeliveriesAsLineItems = () => {
    if (completedDeliveries.length === 0) return;
    const fromDeliveries: LineItemDraft[] = completedDeliveries.slice(0, 20).map((d) => ({
      description: d.title,
      quantity: '1',
      unitPrice: '',
    }));
    setLineItems(fromDeliveries);
  };

  const addLineItem = () =>
    setLineItems((prev) => [...prev, { description: '', quantity: '1', unitPrice: '' }]);

  const removeLineItem = (index: number) =>
    setLineItems((prev) => prev.filter((_, i) => i !== index));

  const updateLineItem = (index: number, field: keyof LineItemDraft, value: string) =>
    setLineItems((prev) => prev.map((li, i) => (i === index ? { ...li, [field]: value } : li)));

  const totalCents = lineItems.reduce((sum, li) => {
    const qty = parseFloat(li.quantity) || 0;
    const price = parseFloat(li.unitPrice) || 0;
    return sum + Math.round(qty * price * 100);
  }, 0);

  const handleCreate = async () => {
    if (!clientId) { toast.error('Please select a client'); return; }
    const validItems = lineItems.filter((li) => li.description.trim() && li.unitPrice);
    if (validItems.length === 0) { toast.error('Add at least one line item'); return; }

    try {
      await createInvoice.mutateAsync({
        client_id: clientId,
        currency,
        due_date: dueDate || undefined,
        notes: notes.trim() || undefined,
        line_items: validItems.map((li) => ({
          description: li.description.trim(),
          quantity: parseFloat(li.quantity) || 1,
          unit_price: Math.round(parseFloat(li.unitPrice) * 100),
        })),
      });
      toast.success('Invoice created');
      setClientId(''); setCurrency('USD'); setDueDate(''); setNotes('');
      setLineItems([{ description: '', quantity: '1', unitPrice: '' }]);
      onOpenChange(false);
    } catch {
      toast.error('Failed to create invoice');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>New Invoice</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2 max-h-[70vh] overflow-y-auto pr-1">
          {/* Client + currency row */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <Label>Client *</Label>
              <Select value={clientId} onValueChange={setClientId}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Select client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.company_name || c.contact_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Currency</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="AUD">AUD</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="CAD">CAD</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Due Date</Label>
            <Input
              className="mt-1.5"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          {/* Line items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Line Items *</Label>
              <div className="flex items-center gap-1">
                {clientId && completedDeliveries.length > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs gap-1"
                    onClick={loadDeliveriesAsLineItems}
                    title={`Load ${completedDeliveries.length} completed deliveries as line items`}
                  >
                    <Layers className="w-3 h-3" />
                    From deliveries ({completedDeliveries.length})
                  </Button>
                )}
                <Button type="button" variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={addLineItem}>
                  <Plus className="w-3 h-3" /> Add row
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              {lineItems.map((li, i) => (
                <div key={i} className="grid grid-cols-[1fr_56px_80px_28px] gap-1.5 items-center">
                  <Input
                    placeholder="Description"
                    value={li.description}
                    onChange={(e) => updateLineItem(i, 'description', e.target.value)}
                  />
                  <Input
                    placeholder="Qty"
                    type="number"
                    min="0"
                    step="0.5"
                    value={li.quantity}
                    onChange={(e) => updateLineItem(i, 'quantity', e.target.value)}
                    className="text-center px-2"
                  />
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">
                      {currency === 'GBP' ? '£' : currency === 'EUR' ? '€' : '$'}
                    </span>
                    <Input
                      placeholder="0"
                      type="number"
                      min="0"
                      step="0.01"
                      value={li.unitPrice}
                      onChange={(e) => updateLineItem(i, 'unitPrice', e.target.value)}
                      className="pl-6 pr-1"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground"
                    onClick={() => removeLineItem(i)}
                    disabled={lineItems.length === 1}
                  >
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ))}
            </div>
            {totalCents > 0 && (
              <div className="flex justify-end mt-2 pt-2 border-t border-border">
                <span className="text-sm font-semibold">{formatCurrency(totalCents, currency)}</span>
              </div>
            )}
          </div>

          <div>
            <Label>Notes</Label>
            <Textarea
              className="mt-1.5 resize-none"
              rows={2}
              placeholder="Payment terms, bank details, or a note to the client..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleCreate} disabled={createInvoice.isPending}>
            Create Invoice
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function Invoices() {
  const { data: clients, isLoading: clientsLoading } = useClients();
  const { data: invoices, isLoading } = useInvoices();
  const updateStatus = useUpdateInvoiceStatus();
  const navigate = useNavigate();
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    document.title = 'Invoices — Luma';
    return () => { document.title = 'Luma'; };
  }, []);

  const safeInvoices = invoices ?? [];

  const stats = {
    draft: safeInvoices.filter((i) => i.status === 'draft').length,
    sent: safeInvoices.filter((i) => i.status === 'sent').length,
    paid: safeInvoices.filter((i) => i.status === 'paid').reduce((s, i) =>
      s + i.line_items.reduce((t, li) => t + li.unit_price * li.quantity, 0), 0
    ),
    overdue: safeInvoices.filter((i) => i.status === 'overdue').length,
  };

  const handleMarkSent = (id: string) => {
    updateStatus.mutate({ id, status: 'sent' });
    toast.success('Marked as sent');
  };

  const handleMarkPaid = (id: string) => {
    updateStatus.mutate({ id, status: 'paid' });
    toast.success('Marked as paid');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Invoices</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Create and send invoices to your clients
          </p>
        </div>
        <Button
          className="gap-2"
          onClick={() => setCreateOpen(true)}
          disabled={clientsLoading || !clients?.length}
        >
          <Plus className="w-4 h-4" />
          New Invoice
        </Button>
      </div>

      {/* Stats strip */}
      <div className="flex flex-wrap gap-x-8 gap-y-3 py-4 border-b border-border">
        {isLoading ? (
          [1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-20" />)
        ) : (
          <>
            <div>
              <p className="text-2xl font-black font-mono">{stats.draft}</p>
              <p className="text-xs text-muted-foreground uppercase tracking-widest mt-0.5">Drafts</p>
            </div>
            <div>
              <p className="text-2xl font-black font-mono text-blue-600">{stats.sent}</p>
              <p className="text-xs text-muted-foreground uppercase tracking-widest mt-0.5">Sent</p>
            </div>
            <div>
              <p className="text-2xl font-black font-mono text-status-success">
                {formatCurrency(stats.paid)}
              </p>
              <p className="text-xs text-muted-foreground uppercase tracking-widest mt-0.5">Collected</p>
            </div>
            {stats.overdue > 0 && (
              <div>
                <p className="text-2xl font-black font-mono text-status-danger">{stats.overdue}</p>
                <p className="text-xs text-muted-foreground uppercase tracking-widest mt-0.5">Overdue</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Invoice list */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}
        </div>
      ) : safeInvoices.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-muted-foreground font-medium">No invoices yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Create your first invoice to start tracking payments.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4 gap-2"
              onClick={() => setCreateOpen(true)}
              disabled={clientsLoading || !clients?.length}
            >
              <Plus className="w-4 h-4" />
              Create Invoice
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <div className="overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground px-5 py-3">Invoice</th>
                  <th className="text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground px-5 py-3">Client</th>
                  <th className="hidden sm:table-cell text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground px-5 py-3">Due</th>
                  <th className="text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground px-5 py-3">Amount</th>
                  <th className="text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground px-5 py-3">Status</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {safeInvoices.map((inv) => {
                  const statusCfg = STATUS_CONFIG[inv.status];
                  const total = inv.line_items.reduce(
                    (s, li) => s + li.unit_price * li.quantity,
                    0,
                  );
                  return (
                    <tr
                      key={inv.id}
                      className="hover:bg-muted/20 transition-colors cursor-pointer"
                      onClick={() => navigate(`/invoices/${inv.id}`)}
                    >
                      <td className="px-5 py-3.5">
                        <p className="font-medium">{inv.invoice_number}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(inv.issue_date), 'MMM d, yyyy')}
                        </p>
                      </td>
                      <td className="px-5 py-3.5 font-medium">{inv.client_name}</td>
                      <td className="hidden sm:table-cell px-5 py-3.5 text-muted-foreground">
                        {format(new Date(inv.due_date), 'MMM d, yyyy')}
                      </td>
                      <td className="px-5 py-3.5 text-right font-mono font-semibold">
                        {formatCurrency(total, inv.currency)}
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge variant="secondary" className={`text-xs ${statusCfg.color}`}>
                          {statusCfg.label}
                        </Badge>
                      </td>
                      <td className="px-5 py-3.5" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-1 justify-end">
                          {inv.status === 'draft' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs gap-1"
                              onClick={() => handleMarkSent(inv.id)}
                              disabled={updateStatus.isPending}
                            >
                              <Send className="w-3 h-3" />
                              Send
                            </Button>
                          )}
                          {inv.status === 'sent' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs gap-1 text-status-success"
                              onClick={() => handleMarkPaid(inv.id)}
                              disabled={updateStatus.isPending}
                            >
                              Mark Paid
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground"
                            title="Open invoice"
                            onClick={() => navigate(`/invoices/${inv.id}`)}
                          >
                            <Download className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <CreateInvoiceDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        clients={clients ?? []}
      />
    </div>
  );
}
