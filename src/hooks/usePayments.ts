import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { queryKeys } from '@/lib/query-keys';
import { useAuth } from '@/hooks/useAuth';
import type { PaymentRecord, PaymentStatus } from '@/types/database';

interface PaymentWithRelations extends PaymentRecord {
  client: { company_name: string; contact_name: string | null } | null;
  agreement: { proposal_id: string } | null;
}

export function usePayments(filters?: { clientId?: string; status?: string }) {
  const { user } = useAuth();

  return useQuery({
    queryKey: queryKeys.payments.list(filters),
    queryFn: async () => {
      let query = supabase
        .from('payment_records')
        .select('*, client:clients(company_name, contact_name), agreement:agreements(proposal_id)')
        .order('created_at', { ascending: false });

      if (filters?.clientId) query = query.eq('client_id', filters.clientId);
      if (filters?.status) query = query.eq('payment_status', filters.status);

      const { data, error } = await query;
      if (error) throw error;
      return data as PaymentWithRelations[];
    },
    enabled: !!user,
    staleTime: 30_000,
  });
}

interface RevenueByMonth {
  month: string;
  label: string;
  amount: number;
}

interface RevenueByClient {
  clientId: string;
  clientName: string;
  amount: number;
  percentage: number;
}

interface RevenueStats {
  totalRevenue: number;
  monthlyRecurringRevenue: number;
  outstandingAmount: number;
  paymentsByStatus: Record<PaymentStatus, number>;
  revenueByMonth: RevenueByMonth[];
  revenueByClient: RevenueByClient[];
  totalPayments: number;
}

export function useRevenueStats() {
  const { user } = useAuth();

  return useQuery({
    queryKey: queryKeys.payments.revenue(),
    queryFn: async () => {
      const { data: payments, error } = await supabase
        .from('payment_records')
        .select('*, client:clients(company_name, contact_name)');

      if (error) throw error;

      const typedPayments = payments as PaymentWithRelations[];

      // Total revenue (paid only)
      const paid = typedPayments.filter((p) => p.payment_status === 'paid');
      const totalRevenue = paid.reduce((sum, p) => sum + Number(p.amount), 0);

      // Monthly recurring revenue
      const recurring = typedPayments.filter(
        (p) => p.billing_type === 'recurring' && ['paid', 'pending'].includes(p.payment_status)
      );
      const monthlyRecurringRevenue = recurring.reduce((sum, p) => sum + Number(p.amount), 0);

      // Outstanding (pending + overdue)
      const outstanding = typedPayments.filter((p) =>
        ['pending', 'overdue'].includes(p.payment_status)
      );
      const outstandingAmount = outstanding.reduce((sum, p) => sum + Number(p.amount), 0);

      // Count by status
      const statuses: PaymentStatus[] = ['pending', 'paid', 'overdue', 'cancelled', 'refunded'];
      const paymentsByStatus = Object.fromEntries(
        statuses.map((status) => [
          status,
          typedPayments.filter((p) => p.payment_status === status).length,
        ])
      ) as Record<PaymentStatus, number>;

      // Revenue by month (last 6 months)
      const now = new Date();
      const monthLabels = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
      ];
      const revenueByMonth: RevenueByMonth[] = [];

      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const year = d.getFullYear();
        const month = d.getMonth();
        const key = `${year}-${String(month + 1).padStart(2, '0')}`;
        const label = `${monthLabels[month]} ${year}`;

        const monthAmount = paid
          .filter((p) => {
            const paidDate = p.paid_at ? new Date(p.paid_at) : new Date(p.created_at);
            return paidDate.getFullYear() === year && paidDate.getMonth() === month;
          })
          .reduce((sum, p) => sum + Number(p.amount), 0);

        revenueByMonth.push({ month: key, label, amount: monthAmount });
      }

      // Revenue by client (top 5)
      const clientRevMap = new Map<string, { name: string; amount: number }>();
      for (const p of paid) {
        const clientName = p.client?.company_name ?? p.client?.contact_name ?? 'Unknown';
        const existing = clientRevMap.get(p.client_id);
        if (existing) {
          existing.amount += Number(p.amount);
        } else {
          clientRevMap.set(p.client_id, { name: clientName, amount: Number(p.amount) });
        }
      }

      const sortedClients = Array.from(clientRevMap.entries())
        .sort((a, b) => b[1].amount - a[1].amount)
        .slice(0, 5);

      const revenueByClient: RevenueByClient[] = sortedClients.map(([clientId, { name, amount }]) => ({
        clientId,
        clientName: name,
        amount,
        percentage: totalRevenue > 0 ? (amount / totalRevenue) * 100 : 0,
      }));

      return {
        totalRevenue,
        monthlyRecurringRevenue,
        outstandingAmount,
        paymentsByStatus,
        revenueByMonth,
        revenueByClient,
        totalPayments: typedPayments.length,
      } as RevenueStats;
    },
    enabled: !!user,
    staleTime: 30_000,
  });
}
