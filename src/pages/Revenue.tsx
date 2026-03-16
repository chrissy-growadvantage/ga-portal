import { useState, useEffect } from 'react';
import { useRevenueGoal, useUpdateRevenueGoal } from '@/hooks/useRevenueGoal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { DollarSign, TrendingUp, Users, Target, Download, ChevronDown, CreditCard, Pencil, Check } from 'lucide-react';
import { usePayments, useRevenueStats } from '@/hooks/usePayments';
import { PAYMENT_STATUS_CONFIG, BILLING_TYPE_LABELS } from '@/lib/constants';
import type { PaymentStatus } from '@/types/database';

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount / 100);
}

function formatCurrencyFull(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount / 100);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

const DEFAULT_GOAL_CENTS = 2_000_000; // $20,000
const GOAL_RING_R = 42;
const GOAL_CIRCUMFERENCE = 2 * Math.PI * GOAL_RING_R;

export default function Revenue() {
  const { data: stats, isLoading: statsLoading } = useRevenueStats();
  const { data: payments, isLoading: paymentsLoading } = usePayments();

  useEffect(() => {
    document.title = 'Revenue — Luma';
    return () => { document.title = 'Luma'; };
  }, []);

  const { data: remoteGoalCents } = useRevenueGoal();
  const updateRevenueGoal = useUpdateRevenueGoal();

  // Fall back to localStorage while the remote value is loading
  const goalCents = remoteGoalCents ?? (() => {
    try {
      const saved = localStorage.getItem('revenue-goal-cents');
      return saved ? Number(saved) : DEFAULT_GOAL_CENTS;
    } catch {
      return DEFAULT_GOAL_CENTS;
    }
  })();

  const [editingGoal, setEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState('');

  const confirmGoal = () => {
    const dollars = parseFloat(goalInput);
    if (!isNaN(dollars) && dollars > 0) {
      const cents = Math.round(dollars * 100);
      updateRevenueGoal.mutate(cents);
      try { localStorage.setItem('revenue-goal-cents', String(cents)); } catch { /* ignore */ }
    }
    setEditingGoal(false);
  };

  const exportCSV = () => {
    if (!payments?.length) return;
    const rows = [
      ['Date', 'Client', 'Type', 'Status', 'Amount (USD)'],
      ...payments.map(p => [
        formatDate(p.paid_at ?? p.created_at),
        p.client?.company_name ?? p.client?.contact_name ?? 'Unknown',
        BILLING_TYPE_LABELS[p.billing_type as keyof typeof BILLING_TYPE_LABELS] ?? p.billing_type,
        PAYMENT_STATUS_CONFIG[p.payment_status as PaymentStatus]?.label ?? p.payment_status,
        (Number(p.amount) / 100).toFixed(2),
      ]),
    ];
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `revenue-${new Date().toISOString().slice(0, 7)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const mrr = stats?.monthlyRecurringRevenue ?? 0;
  const arr = mrr * 12;
  const activeClients = stats?.revenueByClient.length ?? 0;
  const avgPerClient =
    activeClients > 0 ? Math.round((stats?.totalRevenue ?? 0) / activeClients) : 0;

  // Revenue Goal
  const goalPct = Math.min((mrr / goalCents) * 100, 100);
  const strokeDashoffset = GOAL_CIRCUMFERENCE * (1 - goalPct / 100);
  const belowTarget = Math.max(goalCents - mrr, 0);

  // Chart data — amounts in dollars for Recharts display
  const chartData = (stats?.revenueByMonth ?? []).map((m) => ({
    month: m.label.split(' ')[0],
    amount: m.amount / 100,
  }));

  const topClients = (stats?.revenueByClient ?? []).slice(0, 5);
  const recentPayments = (payments ?? []).slice(0, 5);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-extrabold tracking-tight">Revenue</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5">
            Last 12 Months <ChevronDown className="w-3.5 h-3.5" />
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={exportCSV} disabled={!payments?.length}>
            <Download className="w-3.5 h-3.5" /> Export
          </Button>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Monthly Recurring Revenue */}
        <Card className="animate-fade-in opacity-0" style={{ animationDelay: '0ms' }}>
          <CardContent className="p-5">
            {statsLoading ? (
              <Skeleton className="h-16 w-full" />
            ) : (
              <>
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider leading-tight">
                    Monthly Recurring Revenue
                  </p>
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <DollarSign className="w-4 h-4 text-primary" />
                  </div>
                </div>
                <div className="flex items-end justify-between mt-2">
                  <p className="text-2xl font-bold font-mono">{formatCurrency(mrr)}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Annual Run Rate */}
        <Card className="animate-fade-in opacity-0" style={{ animationDelay: '100ms' }}>
          <CardContent className="p-5">
            {statsLoading ? (
              <Skeleton className="h-16 w-full" />
            ) : (
              <>
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider leading-tight">
                    Annual Run Rate
                  </p>
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <TrendingUp className="w-4 h-4 text-primary" />
                  </div>
                </div>
                <div className="flex items-end justify-between mt-2">
                  <p className="text-2xl font-bold font-mono">{formatCurrency(arr)}</p>
                </div>
                <p className="text-xs text-muted-foreground mt-1">MRR × 12</p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Active Clients */}
        <Card className="animate-fade-in opacity-0" style={{ animationDelay: '200ms' }}>
          <CardContent className="p-5">
            {statsLoading ? (
              <Skeleton className="h-16 w-full" />
            ) : (
              <>
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider leading-tight">
                    Active Clients
                  </p>
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Users className="w-4 h-4 text-primary" />
                  </div>
                </div>
                <p className="text-2xl font-bold font-mono mt-2">{activeClients}</p>
                <p className="text-xs text-muted-foreground mt-1">billing clients</p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Avg Revenue / Client */}
        <Card className="animate-fade-in opacity-0" style={{ animationDelay: '300ms' }}>
          <CardContent className="p-5">
            {statsLoading ? (
              <Skeleton className="h-16 w-full" />
            ) : (
              <>
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider leading-tight">
                    Avg Revenue / Client
                  </p>
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Target className="w-4 h-4 text-primary" />
                  </div>
                </div>
                <p className="text-2xl font-bold font-mono mt-2">{formatCurrency(avgPerClient)}</p>
                <p className="text-xs text-muted-foreground mt-1">all time avg</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Two-column layout: Chart (left) + Clients & Goal (right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Over Time bar chart — 2/3 width */}
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Revenue Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-56 w-full" />
              ) : chartData.length === 0 || chartData.every(d => d.amount === 0) ? (
                <div className="flex items-center justify-center h-48 text-center">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">No revenue recorded yet</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">
                      Revenue data will appear here once payments are logged.
                    </p>
                  </div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart
                    data={chartData}
                    margin={{ top: 4, right: 4, left: -16, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="hsl(var(--border))"
                    />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v: number) =>
                        v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`
                      }
                    />
                    <Tooltip
                      formatter={(value: number) => [
                        `$${value.toLocaleString()}`,
                        'Revenue',
                      ]}
                      contentStyle={{
                        borderRadius: '8px',
                        border: '1px solid hsl(var(--border))',
                        background: 'hsl(var(--background))',
                        fontSize: '12px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                      }}
                      cursor={{ fill: 'hsl(var(--muted))' }}
                    />
                    <Bar
                      dataKey="amount"
                      fill="hsl(var(--primary))"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right column: Revenue by Client + Revenue Goal */}
        <div className="flex flex-col gap-6">
          {/* Revenue by Client */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Revenue by Client</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {statsLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-8 w-full" />
                  ))}
                </div>
              ) : topClients.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No client data</p>
              ) : (
                <div className="space-y-4">
                  {topClients.map((client) => (
                    <div key={client.clientId}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm font-medium truncate mr-2">
                          {client.clientName}
                        </span>
                        <span className="text-sm font-mono font-semibold shrink-0">
                          {formatCurrency(client.amount)}
                        </span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{ width: `${Math.max(client.percentage, 2)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Revenue Goal */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">Revenue Goal</CardTitle>
                {!editingGoal && (
                  <button
                    onClick={() => { setGoalInput(String(goalCents / 100)); setEditingGoal(true); }}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="Edit revenue goal"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground flex-wrap">
                <span>{new Date().toLocaleDateString('en-US', { month: 'long' })} • Target</span>
                {editingGoal ? (
                  <div className="flex items-center gap-1">
                    <span>$</span>
                    <input
                      autoFocus
                      type="number"
                      value={goalInput}
                      onChange={e => setGoalInput(e.target.value)}
                      onBlur={confirmGoal}
                      onKeyDown={e => e.key === 'Enter' && confirmGoal()}
                      className="w-20 h-5 text-xs border rounded px-1 bg-background"
                      min="1"
                    />
                    <button onMouseDown={e => { e.preventDefault(); confirmGoal(); }} className="text-muted-foreground hover:text-foreground">
                      <Check className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <span>{formatCurrency(goalCents)}</span>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {statsLoading ? (
                <Skeleton className="h-36 w-full" />
              ) : (
                <div className="flex flex-col items-center gap-2 py-2">
                  <div className="relative">
                    <svg viewBox="0 0 100 100" className="w-32 h-32">
                      {/* Track ring */}
                      <circle
                        cx="50"
                        cy="50"
                        r={GOAL_RING_R}
                        fill="none"
                        stroke="hsl(var(--muted))"
                        strokeWidth="8"
                      />
                      {/* Progress ring */}
                      <circle
                        cx="50"
                        cy="50"
                        r={GOAL_RING_R}
                        fill="none"
                        stroke="hsl(var(--primary))"
                        strokeWidth="8"
                        strokeDasharray={GOAL_CIRCUMFERENCE}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        transform="rotate(-90 50 50)"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-lg font-bold font-mono leading-none">
                        {formatCurrency(mrr)}
                      </span>
                      <span className="text-xs font-medium text-muted-foreground mt-0.5">
                        {goalPct.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                  {belowTarget > 0 ? (
                    <p className="text-sm font-semibold text-status-danger">
                      {formatCurrency(belowTarget)} below target
                    </p>
                  ) : (
                    <p className="text-sm font-semibold text-status-success">Goal reached!</p>
                  )}
                  {belowTarget > 0 && mrr > 0 && (
                    <p className="text-xs text-muted-foreground text-center">
                      {formatCurrency(belowTarget)} to go this month
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">Recent Transactions</CardTitle>
            <button className="text-xs text-primary hover:underline underline-offset-2">
              View all →
            </button>
          </div>
        </CardHeader>
        <CardContent className="pt-0 px-0 pb-0">
          {paymentsLoading ? (
            <div className="px-6 pb-4 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : !recentPayments.length ? (
            <div className="px-6 py-8 text-center">
              <CreditCard className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-40" />
              <p className="text-sm text-muted-foreground">No transactions yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentPayments.map((payment) => {
                    const statusCfg =
                      PAYMENT_STATUS_CONFIG[payment.payment_status as PaymentStatus];
                    return (
                      <TableRow key={payment.id}>
                        <TableCell className="font-medium">
                          {payment.client?.company_name ??
                            payment.client?.contact_name ??
                            'Unknown'}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {BILLING_TYPE_LABELS[payment.billing_type as keyof typeof BILLING_TYPE_LABELS] ??
                            payment.billing_type}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(payment.paid_at ?? payment.created_at)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={statusCfg?.color ?? ''}
                          >
                            {statusCfg?.label ?? payment.payment_status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono font-semibold">
                          {formatCurrencyFull(Number(payment.amount))}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
