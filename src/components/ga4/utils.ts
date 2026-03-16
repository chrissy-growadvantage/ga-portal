import type { Period } from './types';

export const formatNumber = (n: number): string => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return Math.round(n).toString();
};

export const formatTime = (seconds: number): string => {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}m ${s}s`;
};

export const formatDate = (ga4Date: string): string => {
  const y = ga4Date.slice(0, 4);
  const m = ga4Date.slice(4, 6);
  const d = ga4Date.slice(6, 8);
  return `${m}/${d}`;
};

export const calcDelta = (current: number, previous: number): number => {
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
};

export const MEDIUM_LABELS: Record<string, string> = {
  '(none)': 'Direct',
  organic: 'Organic Search',
  referral: 'Referral',
  email: 'Email',
  rss: 'RSS',
  '(not set)': 'Other',
  social: 'Social',
  cpc: 'Paid Search',
};

export const getPreviousPeriodDates = (period: Period): { startDate: string; endDate: string } => {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  if (period === 'last7days') {
    const end = new Date(now);
    end.setDate(end.getDate() - 7);
    const start = new Date(end);
    start.setDate(start.getDate() - 7);
    return { startDate: fmt(start), endDate: fmt(end) };
  }

  if (period === 'last30days') {
    const end = new Date(now);
    end.setDate(end.getDate() - 30);
    const start = new Date(end);
    start.setDate(start.getDate() - 30);
    return { startDate: fmt(start), endDate: fmt(end) };
  }

  // thismonth → last month
  const firstOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastOfPrevMonth = new Date(firstOfThisMonth);
  lastOfPrevMonth.setDate(lastOfPrevMonth.getDate() - 1);
  const firstOfPrevMonth = new Date(lastOfPrevMonth.getFullYear(), lastOfPrevMonth.getMonth(), 1);
  return { startDate: fmt(firstOfPrevMonth), endDate: fmt(lastOfPrevMonth) };
};
