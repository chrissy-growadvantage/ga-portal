import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Globe, AlertTriangle, Calendar } from 'lucide-react';
import type { DashboardData, ComparisonData, Period } from './types';
import { getPreviousPeriodDates } from './utils';
import {
  parseOverview, parseDevices, parsePages, parseSources, parseGeography,
  parseChannelQuality, parseHeatmap, parseVideoEvents, parseNewReturning,
  parseLandingPages, parseStickiness,
} from './parsers';
import type {
  ChannelQualityRow, HeatmapRow, VideoEventRow, NewReturningSegment,
  LandingPageRow, StickinessData,
} from './parsers';
import HeroStats from './HeroStats';
import TrendChart from './TrendChart';
import ChannelChart from './ChannelChart';
import TopPagesList from './TopPagesList';
import DeviceDonut from './DeviceDonut';
import GeographyList from './GeographyList';
import ChannelQualityChart from './ChannelQualityChart';
import HeatmapChart from './HeatmapChart';
import VideoWidget from './VideoWidget';
import NewReturningWidget from './NewReturningWidget';
import LandingPagesTable from './LandingPagesTable';
import StickinessCard from './StickinessCard';
import PropertySelector from './PropertySelector';
import { PropertyGridView } from './PropertyGridView';
import type { PropertyData } from './PropertyGridView';

const PERIODS: { value: Period; label: string }[] = [
  { value: 'last7days', label: 'Last 7 Days' },
  { value: 'last30days', label: 'Last 30 Days' },
  { value: 'thismonth', label: 'This Month' },
];

interface ExtendedData extends DashboardData {
  channelQuality: ChannelQualityRow[];
  heatmap: HeatmapRow[];
  videoEvents: VideoEventRow[];
  newReturning: NewReturningSegment[];
  landingPages: LandingPageRow[];
  stickiness: StickinessData | null;
}

interface Props {
  clientSlug: string;
}

const GA4DashboardContent = ({ clientSlug }: Props) => {
  const [period, setPeriod] = useState<Period>('thismonth');
  const [data, setData] = useState<ExtendedData | null>(null);
  const [comparison, setComparison] = useState<ComparisonData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<string | null>(null);
  const [propertyBreakdown, setPropertyBreakdown] = useState<PropertyData[]>([]);

  useEffect(() => {
    if (!clientSlug) return;
    setLoading(true);
    setError(null);

    const propertyParam = selectedProperty ? `&property=${selectedProperty}` : '';
    const base = `/api/ga4?client=${clientSlug}${propertyParam}`;
    const { startDate, endDate } = getPreviousPeriodDates(period);
    const prevParams = `startDate=${startDate}&endDate=${endDate}&period=${period}`;

    const fetchWithAuthCheck = async (url: string) => {
      const res = await fetch(url);
      const data = await res.json();

      // Check if re-authentication is needed
      if (res.status === 401 && data.needsReauth) {
        // Redirect to connect page
        window.location.href = data.reconnectUrl || `/connect?client=${clientSlug}`;
        throw new Error('Redirecting to reconnect...');
      }

      // No connection configured for this client
      if (res.status === 404 && data.error?.includes('No GA4 connection')) {
        throw new Error('NOT_CONNECTED');
      }

      if (!res.ok) {
        throw new Error(data.message || data.error || 'Request failed');
      }

      return data;
    };

    Promise.all([
      fetchWithAuthCheck(`${base}&period=${period}`),
      fetchWithAuthCheck(`${base}&type=devices&period=${period}`),
      fetchWithAuthCheck(`${base}&type=top_pages&period=${period}`),
      fetchWithAuthCheck(`${base}&type=sources&period=${period}`),
      fetchWithAuthCheck(`${base}&type=geography&period=${period}`),
      fetchWithAuthCheck(`${base}&${prevParams}`),
      fetchWithAuthCheck(`${base}&type=channel_quality&period=${period}`),
      fetchWithAuthCheck(`${base}&type=heatmap&period=${period}`),
      fetchWithAuthCheck(`${base}&type=video_events&period=${period}`),
      fetchWithAuthCheck(`${base}&type=new_returning&period=${period}`),
      fetchWithAuthCheck(`${base}&type=landing_pages&period=${period}`),
      fetchWithAuthCheck(`${base}&type=stickiness&period=${period}`),
    ])
      .then(([overview, devices, pages, sources, geography, prevOverview,
              channelQuality, heatmap, videoEvents, newReturning, landingPages, stickiness]) => {
        setData({
          overview: parseOverview(overview),
          devices: parseDevices(devices),
          pages: parsePages(pages),
          sources: parseSources(sources),
          geography: parseGeography(geography),
          channelQuality: parseChannelQuality(channelQuality),
          heatmap: parseHeatmap(heatmap),
          videoEvents: parseVideoEvents(videoEvents),
          newReturning: parseNewReturning(newReturning),
          landingPages: parseLandingPages(landingPages),
          stickiness: parseStickiness(stickiness),
        });
        setComparison({ overview: parseOverview(prevOverview) });
        if (overview.propertyBreakdown) {
          setPropertyBreakdown(overview.propertyBreakdown);
        } else {
          setPropertyBreakdown([]);
        }
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [clientSlug, period, selectedProperty]);

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <div className="flex flex-col items-center gap-4">
        <motion.div
          animate={{ scale: [1, 1.1, 1], opacity: [0.8, 1, 0.8] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="w-12 h-12 rounded-xl bg-emerald-500 flex items-center justify-center"
        >
          <Globe className="w-6 h-6 text-white" />
        </motion.div>
        <p className="text-muted-foreground text-sm">Loading website analytics...</p>
      </div>
    </div>
  );

  if (error === 'NOT_CONNECTED') return (
    <div className="flex items-center justify-center py-24">
      <div className="text-center max-w-sm">
        <Globe className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
        <p className="text-foreground font-semibold mb-1">Google Analytics Not Connected</p>
        <p className="text-muted-foreground text-sm mb-5">
          Connect your Google Analytics account to view website analytics for this client.
        </p>
        <a
          href={`/connect?client=${clientSlug}`}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors"
        >
          Connect Google Analytics
        </a>
      </div>
    </div>
  );

  if (error || !data) return (
    <div className="flex items-center justify-center py-24">
      <div className="text-center">
        <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
        <p className="text-muted-foreground">{error ?? 'No data available'}</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Period and Property selectors */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <div className="inline-flex items-center bg-muted rounded-lg p-1 gap-1">
            {PERIODS.map(p => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  period === p.value
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
        <PropertySelector
          clientSlug={clientSlug}
          selectedProperty={selectedProperty}
          onPropertyChange={setSelectedProperty}
        />
      </div>

      {/* Show grid view when viewing all properties */}
      {!selectedProperty && propertyBreakdown.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <PropertyGridView
            properties={propertyBreakdown}
            onPropertyClick={setSelectedProperty}
          />
        </motion.div>
      )}

      {/* Show HeroStats and detailed charts only when viewing a single property */}
      {selectedProperty && (
        <>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <HeroStats current={data.overview} previous={comparison?.overview ?? null} />
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <TrendChart current={data.overview} previous={comparison?.overview ?? null} />
          </motion.div>

      <div className="grid md:grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <ChannelChart sources={data.sources} />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <TopPagesList pages={data.pages} />
        </motion.div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <NewReturningWidget data={data.newReturning} />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <StickinessCard data={data.stickiness} />
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <ChannelQualityChart data={data.channelQuality} />
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
        <LandingPagesTable data={data.landingPages} />
      </motion.div>

      {data.videoEvents.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <VideoWidget data={data.videoEvents} />
        </motion.div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
          <DeviceDonut devices={data.devices} />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <GeographyList countries={data.geography} />
        </motion.div>
      </div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}>
            <HeatmapChart data={data.heatmap} />
          </motion.div>
        </>
      )}
    </div>
  );
};

export default GA4DashboardContent;
