import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { DollarSign, TrendingUp, Clock, CreditCard } from 'lucide-react';
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

export default function Revenue() {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { data: stats, isLoading: statsLoading } = useRevenueStats();
  const { data: payments, isLoading: paymentsLoading } = usePayments(
    statusFilter !== 'all' ? { status: statusFilter } : undefined
  );

  const statCards = [
    {
      label: 'Total Revenue',
      value: stats ? formatCurrency(stats.totalRevenue) : '$0',
      icon: DollarSign,
      color: 'text-emerald-600',
    },
    {
      label: 'Monthly Recurring',
      value: stats ? formatCurrency(stats.monthlyRecurringRevenue) : '$0',
      icon: TrendingUp,
      color: 'text-primary',
    },
    {
      label: 'Outstanding',
      value: stats ? formatCurrency(stats.outstandingAmount) : '$0',
      icon: Clock,
      color: 'text-amber-600',
    },
    {
      label: 'Payments',
      value: stats?.totalPayments ?? 0,
      icon: CreditCard,
      color: 'text-blue-600',
    },
  ];

  const maxMonthRevenue = stats
    ? Math.max(...stats.revenueByMonth.map((m) => m.amount), 1)
    : 1;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Revenue</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Overview of your billing and payments.
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <Card
            key={stat.label}
            className="animate-fade-in opacity-0"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <CardContent className="p-5">
              {statsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {stat.label}
                    </p>
                    <p className="text-3xl font-bold font-mono mt-2">{stat.value}</p>
                  </div>
                  <div className="w-9 h-9 rounded-lg bg-primary/8 flex items-center justify-center">
                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Revenue by Month */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Revenue by Month</h2>
        {statsLoading ? (
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
        ) : stats && stats.revenueByMonth.length > 0 ? (
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {stats.revenueByMonth.map((month) => {
              const heightPct = maxMonthRevenue > 0
                ? Math.max((month.amount / maxMonthRevenue) * 100, 4)
                : 4;

              return (
                <Card key={month.month}>
                  <CardContent className="p-4 flex flex-col items-center gap-3">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {month.label.split(' ')[0]}
                    </p>
                    <div className="w-full h-20 flex items-end justify-center">
                      <div
                        className="w-full max-w-[2.5rem] rounded-t-md bg-primary/20 relative overflow-hidden transition-all"
                        style={{ height: `${heightPct}%` }}
                      >
                        <div
                          className="absolute inset-x-0 bottom-0 bg-primary rounded-t-md"
                          style={{ height: '100%' }}
                        />
                      </div>
                    </div>
                    <p className="text-sm font-semibold font-mono">
                      {formatCurrency(month.amount)}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="py-10 text-center">
              <DollarSign className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No revenue data yet.</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Main Content: Table + Client Revenue Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Payment History Table */}
        <div className="lg:col-span-2">
          <h2 className="text-xl font-semibold mb-4">Payment History</h2>
          <Tabs value={statusFilter} onValueChange={setStatusFilter}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="paid">Paid</TabsTrigger>
              <TabsTrigger value="overdue">Overdue</TabsTrigger>
            </TabsList>

            <TabsContent value={statusFilter} className="mt-4">
              <Card>
                {paymentsLoading ? (
                  <CardContent className="p-4 space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </CardContent>
                ) : !payments?.length ? (
                  <CardContent className="py-10 text-center">
                    <CreditCard className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">No payments found.</p>
                    {statusFilter !== 'all' && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Try a different filter.
                      </p>
                    )}
                  </CardContent>
                ) : (
                  <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Client</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payments.map((payment) => {
                        const statusCfg =
                          PAYMENT_STATUS_CONFIG[payment.payment_status as PaymentStatus];

                        return (
                          <TableRow key={payment.id}>
                            <TableCell className="font-medium">
                              {payment.client?.company_name ??
                                payment.client?.contact_name ??
                                'Unknown'}
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              {formatCurrencyFull(Number(payment.amount))}
                            </TableCell>
                            <TableCell>
                              <span className="text-sm text-muted-foreground">
                                {BILLING_TYPE_LABELS[payment.billing_type]}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="secondary"
                                className={statusCfg?.color ?? ''}
                              >
                                {statusCfg?.label ?? payment.payment_status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {formatDate(payment.paid_at ?? payment.created_at)}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                  </div>
                )}
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Revenue by Client */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Top Clients</h2>
          <Card>
            {statsLoading ? (
              <CardContent className="p-4 space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </CardContent>
            ) : !stats?.revenueByClient.length ? (
              <CardContent className="py-10 text-center">
                <DollarSign className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No client revenue yet.</p>
              </CardContent>
            ) : (
              <CardContent className="p-5 space-y-5">
                {stats.revenueByClient.map((client) => (
                  <div key={client.clientId}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium truncate mr-3">
                        {client.clientName}
                      </span>
                      <span className="text-sm font-mono font-semibold shrink-0">
                        {formatCurrency(client.amount)}
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${Math.max(client.percentage, 2)}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {client.percentage.toFixed(1)}% of total revenue
                    </p>
                  </div>
                ))}
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
