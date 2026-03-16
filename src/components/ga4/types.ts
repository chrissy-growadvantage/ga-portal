export type Period = 'last7days' | 'last30days' | 'thismonth';

export interface GA4ApiResponse {
  result: Array<Array<string | number>>;
}

export interface OverviewMetrics {
  totalActiveUsers: number;
  totalSessions: number;
  avgEngagementRate: number;
  avgBounceRate: number;
  avgSessionDuration: number;
  newUsers: number;
  returningUsers: number;
  dailyData: Array<{ date: string; activeUsers: number; sessions: number }>;
}

export interface DeviceData {
  device: string;
  activeUsers: number;
  sessions: number;
  percentage: number;
}

export interface PageData {
  pageTitle: string;
  pagePath: string;
  activeUsers: number;
  screenPageViews: number;
  bounceRate: number;
  avgEngagementTime: number;
  engagementScore: number;
}

export interface SourceData {
  medium: string;
  label: string;
  activeUsers: number;
  percentage: number;
}

export interface CountryData {
  country: string;
  activeUsers: number;
  percentage: number;
}

export interface DashboardData {
  overview: OverviewMetrics;
  devices: DeviceData[];
  pages: PageData[];
  sources: SourceData[];
  geography: CountryData[];
}

export interface ComparisonData {
  overview: OverviewMetrics;
}
