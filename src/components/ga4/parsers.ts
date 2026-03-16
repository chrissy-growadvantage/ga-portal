import type { GA4ApiResponse, OverviewMetrics, DeviceData, PageData, SourceData, CountryData } from './types';
import { MEDIUM_LABELS } from './utils';

export interface ChannelQualityRow {
  channel: string;
  activeUsers: number;
  sessions: number;
  engagementRate: number;
  avgSessionDuration: number;
  pagesPerSession: number;
}

export interface HeatmapRow {
  dayOfWeek: number;
  hour: number;
  activeUsers: number;
}

export interface VideoEventRow {
  eventName: string;
  eventCount: number;
  totalUsers: number;
}

export interface NewReturningSegment {
  segment: string;
  activeUsers: number;
  sessions: number;
  engagementRate: number;
  avgSessionDuration: number;
  pagesPerSession: number;
}

export interface LandingPageRow {
  landingPage: string;
  sessions: number;
  activeUsers: number;
  engagementRate: number;
  pagesPerSession: number;
  avgSessionDuration: number;
}

export interface StickinessData {
  dauPerMau: number;
  wauPerMau: number;
  dauPerWau: number;
  active7DayUsers: number;
  active28DayUsers: number;
  activeUsers: number;
}

export const parseOverview = (data: GA4ApiResponse): OverviewMetrics => {
  const empty: OverviewMetrics = { totalActiveUsers: 0, totalSessions: 0, avgEngagementRate: 0, avgBounceRate: 0, avgSessionDuration: 0, newUsers: 0, returningUsers: 0, dailyData: [] };
  if (!data.result || data.result.length < 2) return empty;
  const [, ...rows] = data.result;

  let totalActiveUsers = 0, totalNewUsers = 0, totalSessions = 0;
  const engagementRates: number[] = [];
  const bounceRates: number[] = [];
  const sessionDurations: number[] = [];
  const dailyData: OverviewMetrics['dailyData'] = [];

  rows.forEach(row => {
    const date = String(row[0]);
    const activeUsers = Number(row[2]) || 0;
    const newUsers = Number(row[3]) || 0;
    const sessions = Number(row[4]) || 0;
    totalActiveUsers += activeUsers;
    totalNewUsers += newUsers;
    totalSessions += sessions;
    engagementRates.push(Number(row[5]) || 0);
    bounceRates.push(Number(row[6]) || 0);
    sessionDurations.push(Number(row[7]) || 0);
    dailyData.push({ date, activeUsers, sessions });
  });

  dailyData.sort((a, b) => a.date.localeCompare(b.date));

  const avg = (arr: number[]) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

  return {
    totalActiveUsers,
    totalSessions,
    newUsers: totalNewUsers,
    returningUsers: totalActiveUsers - totalNewUsers,
    avgEngagementRate: avg(engagementRates),
    avgBounceRate: avg(bounceRates),
    avgSessionDuration: avg(sessionDurations),
    dailyData,
  };
};

export const parseDevices = (data: GA4ApiResponse): DeviceData[] => {
  if (!data.result || data.result.length < 2) return [];
  const [, ...rows] = data.result;
  const devMap = new Map<string, { activeUsers: number; sessions: number }>();

  rows.forEach(row => {
    const dev = String(row[1]).toLowerCase();
    const existing = devMap.get(dev) ?? { activeUsers: 0, sessions: 0 };
    existing.activeUsers += Number(row[3]) || 0;
    existing.sessions += Number(row[4]) || 0;
    devMap.set(dev, existing);
  });

  const total = Array.from(devMap.values()).reduce((s, d) => s + d.activeUsers, 0);
  return Array.from(devMap.entries())
    .map(([device, d]) => ({ device, ...d, percentage: total > 0 ? (d.activeUsers / total) * 100 : 0 }))
    .sort((a, b) => b.activeUsers - a.activeUsers);
};

export const parsePages = (data: GA4ApiResponse): PageData[] => {
  if (!data.result || data.result.length < 2) return [];
  const [, ...rows] = data.result;
  const pageMap = new Map<string, { pagePath: string; activeUsers: number; screenPageViews: number; bounceRates: number[]; engagementTimes: number[] }>();

  rows.forEach(row => {
    const title = String(row[2]);
    const existing = pageMap.get(title) ?? { pagePath: String(row[1]), activeUsers: 0, screenPageViews: 0, bounceRates: [], engagementTimes: [] };
    existing.activeUsers += Number(row[3]) || 0;
    existing.screenPageViews += Number(row[4]) || 0;
    existing.engagementTimes.push(Number(row[5]) || 0);
    existing.bounceRates.push(Number(row[6]) || 0);
    pageMap.set(title, existing);
  });

  const avg = (arr: number[]) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

  return Array.from(pageMap.entries())
    .map(([pageTitle, d]) => {
      const bounceRate = avg(d.bounceRates);
      const avgEngagementTime = avg(d.engagementTimes);
      return {
        pageTitle,
        pagePath: d.pagePath,
        activeUsers: d.activeUsers,
        screenPageViews: d.screenPageViews,
        bounceRate,
        avgEngagementTime,
        engagementScore: avgEngagementTime * (1 - bounceRate / 100),
      };
    })
    .sort((a, b) => b.screenPageViews - a.screenPageViews)
    .slice(0, 10);
};

export const parseSources = (data: GA4ApiResponse): SourceData[] => {
  if (!data.result || data.result.length < 2) return [];
  const [, ...rows] = data.result;
  const srcMap = new Map<string, number>();

  rows.forEach(row => {
    const medium = String(row[0]);
    if (medium === '(not set)') return;
    srcMap.set(medium, (srcMap.get(medium) ?? 0) + (Number(row[2]) || 0));
  });

  const total = Array.from(srcMap.values()).reduce((s, v) => s + v, 0);
  return Array.from(srcMap.entries())
    .map(([medium, activeUsers]) => ({
      medium,
      label: MEDIUM_LABELS[medium] ?? medium,
      activeUsers,
      percentage: total > 0 ? (activeUsers / total) * 100 : 0,
    }))
    .sort((a, b) => b.activeUsers - a.activeUsers);
};

export const parseGeography = (data: GA4ApiResponse): CountryData[] => {
  if (!data.result || data.result.length < 2) return [];
  const [, ...rows] = data.result;
  const countryMap = new Map<string, number>();

  rows.forEach(row => {
    const country = String(row[0]);
    if (country && country !== '(not set)') {
      countryMap.set(country, (countryMap.get(country) ?? 0) + (Number(row[3]) || 0));
    }
  });

  const total = Array.from(countryMap.values()).reduce((s, v) => s + v, 0);
  return Array.from(countryMap.entries())
    .map(([country, activeUsers]) => ({ country, activeUsers, percentage: total > 0 ? (activeUsers / total) * 100 : 0 }))
    .sort((a, b) => b.activeUsers - a.activeUsers)
    .slice(0, 7);
};

// column order: channel, activeUsers, sessions, engagementRate, avgSessionDuration, pagesPerSession
export const parseChannelQuality = (data: GA4ApiResponse): ChannelQualityRow[] => {
  if (!data.result || data.result.length < 2) return [];
  const [, ...rows] = data.result;
  return rows.map(row => ({
    channel: String(row[0]),
    activeUsers: Number(row[1]) || 0,
    sessions: Number(row[2]) || 0,
    engagementRate: Number(row[3]) || 0,
    avgSessionDuration: Number(row[4]) || 0,
    pagesPerSession: Number(row[5]) || 0,
  }));
};

// column order: dayOfWeek, hour, activeUsers, sessions
export const parseHeatmap = (data: GA4ApiResponse): HeatmapRow[] => {
  if (!data.result || data.result.length < 2) return [];
  const [, ...rows] = data.result;
  return rows.map(row => ({
    dayOfWeek: Number(row[0]) || 0,
    hour: Number(row[1]) || 0,
    activeUsers: Number(row[2]) || 0,
  }));
};

// column order: eventName, eventCount, totalUsers
export const parseVideoEvents = (data: GA4ApiResponse): VideoEventRow[] => {
  if (!data.result || data.result.length < 2) return [];
  const [, ...rows] = data.result;
  return rows.map(row => ({
    eventName: String(row[0]),
    eventCount: Number(row[1]) || 0,
    totalUsers: Number(row[2]) || 0,
  }));
};

// column order: segment, activeUsers, sessions, engagementRate, avgSessionDuration, pagesPerSession
export const parseNewReturning = (data: GA4ApiResponse): NewReturningSegment[] => {
  if (!data.result || data.result.length < 2) return [];
  const [, ...rows] = data.result;
  return rows.map(row => ({
    segment: String(row[0]).toLowerCase(),
    activeUsers: Number(row[1]) || 0,
    sessions: Number(row[2]) || 0,
    engagementRate: Number(row[3]) || 0,
    avgSessionDuration: Number(row[4]) || 0,
    pagesPerSession: Number(row[5]) || 0,
  }));
};

// column order: landingPage, sessions, activeUsers, engagementRate, pagesPerSession, avgSessionDuration
export const parseLandingPages = (data: GA4ApiResponse): LandingPageRow[] => {
  if (!data.result || data.result.length < 2) return [];
  const [, ...rows] = data.result;
  return rows.map(row => ({
    landingPage: String(row[0]),
    sessions: Number(row[1]) || 0,
    activeUsers: Number(row[2]) || 0,
    engagementRate: Number(row[3]) || 0,
    pagesPerSession: Number(row[4]) || 0,
    avgSessionDuration: Number(row[5]) || 0,
  }));
};

// column order: dauPerMau, wauPerMau, dauPerWau, active7DayUsers, active28DayUsers, activeUsers
export const parseStickiness = (data: GA4ApiResponse): StickinessData | null => {
  if (!data.result || data.result.length < 2) return null;
  const [, ...rows] = data.result;
  const row = rows[0];
  if (!row) return null;
  return {
    dauPerMau: Number(row[0]) || 0,
    wauPerMau: Number(row[1]) || 0,
    dauPerWau: Number(row[2]) || 0,
    active7DayUsers: Number(row[3]) || 0,
    active28DayUsers: Number(row[4]) || 0,
    activeUsers: Number(row[5]) || 0,
  };
};
