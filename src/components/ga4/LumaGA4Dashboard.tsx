import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Globe,
  AlertTriangle,
  Calendar,
  ChevronDown,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  useGA4Connections,
  useGA4DashboardData,
  useGA4Auth,
  GA4FetchError,
} from '@/hooks/useGA4';
import type { Period } from './types';
import {
  parseOverview,
  parseDevices,
  parsePages,
  parseSources,
  parseGeography,
  parseChannelQuality,
  parseHeatmap,
  parseVideoEvents,
  parseNewReturning,
  parseLandingPages,
  parseStickiness,
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

// ── Constants ─────────────────────────────────────────────────────────────────

const PERIODS: { value: Period; label: string }[] = [
  { value: 'last7days', label: 'Last 7 Days' },
  { value: 'last30days', label: 'Last 30 Days' },
  { value: 'thismonth', label: 'This Month' },
];

// ── Types ─────────────────────────────────────────────────────────────────────

interface Props {
  /** Luma client UUID — passed to useGA4 hooks */
  clientId: string;
  /** Full URL to redirect back to after OAuth; must include ?tab=analytics */
  returnUrl: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function LumaGA4Dashboard({ clientId, returnUrl }: Props) {
  const [period, setPeriod] = useState<Period>('thismonth');
  const [selectedProperty, setSelectedProperty] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  const connectMutation = useGA4Auth();
  const { data: connections = [], isPending: connectionsPending } =
    useGA4Connections(clientId);

  // Auto-select when exactly one property is connected
  useEffect(() => {
    if (connections.length === 1 && selectedProperty === null) {
      setSelectedProperty(connections[0].property_id);
    }
  }, [connections, selectedProperty]);

  const dashboardQuery = useGA4DashboardData(
    clientId,
    period,
    selectedProperty,
    !!selectedProperty,
  );

  const parsed = useMemo(() => {
    const raw = dashboardQuery.data;
    if (!raw) return null;
    return {
      overview:      parseOverview(raw.overview),
      prevOverview:  parseOverview(raw.prevOverview),
      devices:       parseDevices(raw.devices),
      pages:         parsePages(raw.pages),
      sources:       parseSources(raw.sources),
      geography:     parseGeography(raw.geography),
      channelQuality: parseChannelQuality(raw.channelQuality),
      heatmap:       parseHeatmap(raw.heatmap),
      videoEvents:   parseVideoEvents(raw.videoEvents),
      newReturning:  parseNewReturning(raw.newReturning),
      landingPages:  parseLandingPages(raw.landingPages),
      stickiness:    parseStickiness(raw.stickiness),
    };
  }, [dashboardQuery.data]);

  const handleConnect = () => {
    connectMutation.mutate(
      { clientId, returnUrl },
      {
        onSuccess: ({ authUrl }) => { window.location.href = authUrl; },
        onError: () => toast.error('Failed to initiate Google Analytics connection'),
      },
    );
  };

  // ── Loading connections ────────────────────────────────────────────────────

  if (connectionsPending) {
    return <LoadingSpinner label="Loading analytics..." />;
  }

  // ── Error analysis ────────────────────────────────────────────────────────

  const dashboardError = dashboardQuery.error;
  const isGA4Err = dashboardError instanceof GA4FetchError;

  const notConnected =
    connections.length === 0 ||
    (isGA4Err && dashboardError.code === 'NOT_CONNECTED');

  // ── Not connected ─────────────────────────────────────────────────────────

  if (notConnected) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center max-w-sm">
          <Globe className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="font-semibold mb-1">Google Analytics Not Connected</p>
          <p className="text-muted-foreground text-sm mb-5">
            Connect your Google Analytics account to start viewing website analytics for this client.
          </p>
          <button
            onClick={handleConnect}
            disabled={connectMutation.isPending}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60"
          >
            {connectMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            Connect Google Analytics
          </button>
        </div>
      </div>
    );
  }

  // ── Re-auth required ──────────────────────────────────────────────────────

  if (isGA4Err && dashboardError.needsReauth) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center max-w-sm">
          <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
          <p className="font-semibold mb-1">Re-authentication Required</p>
          <p className="text-muted-foreground text-sm mb-5">
            Your Google Analytics connection has expired. Please reconnect to continue.
          </p>
          <button
            onClick={handleConnect}
            disabled={connectMutation.isPending}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60"
          >
            {connectMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            Reconnect Google Analytics
          </button>
        </div>
      </div>
    );
  }

  // ── Generic fetch error ────────────────────────────────────────────────────

  if (dashboardError) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
          <p className="text-muted-foreground">{dashboardError.message}</p>
        </div>
      </div>
    );
  }

  // ── Normal render ─────────────────────────────────────────────────────────

  const selectedPropertyName = selectedProperty
    ? (connections.find(c => c.property_id === selectedProperty)?.property_name ?? selectedProperty)
    : 'All Properties';

  return (
    <div className="space-y-6">
      {/* Period + property selectors */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Period picker */}
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

        {/* Property picker — only shown when multiple properties are connected */}
        {connections.length > 1 && (
          <div className="relative">
            <button
              onClick={() => setPickerOpen(o => !o)}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-muted hover:bg-muted/80 rounded-lg text-xs font-semibold transition-colors"
            >
              <Globe className="w-3 h-3 text-muted-foreground" />
              <span>{selectedPropertyName}</span>
              <ChevronDown
                className={`w-3 h-3 text-muted-foreground transition-transform ${
                  pickerOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {pickerOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setPickerOpen(false)}
                />
                <div className="absolute top-full left-0 mt-1 w-64 bg-card border border-border rounded-lg shadow-lg z-20 py-1 max-h-80 overflow-y-auto">
                  <button
                    onClick={() => { setSelectedProperty(null); setPickerOpen(false); }}
                    className={`w-full text-left px-3 py-2 text-xs hover:bg-muted transition-colors ${
                      !selectedProperty ? 'bg-muted font-semibold' : ''
                    }`}
                  >
                    All Properties
                  </button>
                  <div className="border-t border-border my-1" />
                  {connections.map(c => (
                    <button
                      key={c.property_id}
                      onClick={() => { setSelectedProperty(c.property_id); setPickerOpen(false); }}
                      className={`w-full text-left px-3 py-2 text-xs hover:bg-muted transition-colors ${
                        selectedProperty === c.property_id ? 'bg-muted font-semibold' : ''
                      }`}
                    >
                      {c.property_name ?? c.property_id}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Prompt when multiple properties exist but none selected */}
      {!selectedProperty && connections.length > 1 && (
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <Globe className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="font-semibold mb-1">Select a Property</p>
            <p className="text-sm text-muted-foreground">
              Choose a GA4 property from the picker above to view its analytics.
            </p>
          </div>
        </div>
      )}

      {/* Loading dashboard data */}
      {selectedProperty && dashboardQuery.isPending && (
        <LoadingSpinner label="Loading website analytics..." />
      )}

      {/* Dashboard charts */}
      {selectedProperty && parsed && (
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <HeroStats current={parsed.overview} previous={parsed.prevOverview} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          >
            <TrendChart current={parsed.overview} previous={parsed.prevOverview} />
          </motion.div>

          <div className="grid md:grid-cols-2 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <ChannelChart sources={parsed.sources} />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <TopPagesList pages={parsed.pages} />
            </motion.div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <NewReturningWidget data={parsed.newReturning} />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              <StickinessCard data={parsed.stickiness} />
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <ChannelQualityChart data={parsed.channelQuality} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            <LandingPagesTable data={parsed.landingPages} />
          </motion.div>

          {parsed.videoEvents.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <VideoWidget data={parsed.videoEvents} />
            </motion.div>
          )}

          <div className="grid md:grid-cols-2 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
            >
              <DeviceDonut devices={parsed.devices} />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <GeographyList countries={parsed.geography} />
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
          >
            <HeatmapChart data={parsed.heatmap} />
          </motion.div>
        </div>
      )}
    </div>
  );
}

// ── Internal helpers ──────────────────────────────────────────────────────────

function LoadingSpinner({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center py-24">
      <div className="flex flex-col items-center gap-4">
        <motion.div
          animate={{ scale: [1, 1.1, 1], opacity: [0.8, 1, 0.8] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="w-12 h-12 rounded-xl bg-emerald-500 flex items-center justify-center"
        >
          <Globe className="w-6 h-6 text-white" />
        </motion.div>
        <p className="text-muted-foreground text-sm">{label}</p>
      </div>
    </div>
  );
}
