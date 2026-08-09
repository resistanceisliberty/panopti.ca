import { useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams, useLocation, useNavigate } from 'react-router-dom';
import { MapLibreView, MapSearch, CameraStats, MapLoadingScreen, type MapLibreViewHandle } from '@/components/map';
import { RoutePanel } from '@/components/panels';
import { ExplorePanel } from '@/components/panels/ExplorePanel';
import { DensityPanel } from '@/components/panels/DensityPanel';
import { NetworkPanel } from '@/components/panels/NetworkPanel';
import { MapPanel } from '@/components/panels/MapPanel';
import { MobileTabDrawer } from '@/components/panels/MobileTabDrawer';
import { DensityLegendBar } from '@/components/map/DensityLegendBar';
import { NetworkAgencyCount } from '@/components/map/NetworkAgencyCount';
import { Seo, ShareButton, LangToggle, ElectionNotice } from '@/components/common';
import { parseViewportFromURL, writeViewportParams } from '@/utils/urlParams';
import { useCameraStore, useMapStore, useAppModeStore } from '@/store';
import { useEmbedMode } from '@/hooks/useEmbedMode';
import { MapStyleControl } from '@/components/map/MapStyleControl';
import { SubmitPanel } from '@/components/submit/SubmitPanel';
import { SubmitToast } from '@/components/submit/SubmitToast';
import { startSubmitFlagPolling } from '@/osm/flag';
import { SUBMIT_ENABLED } from '@/osm/config';
import { useSubmitStore } from '@/store/submitStore';
import { TimelineBar } from '@/modes/timeline/TimelineBar';
import { DensityFeaturePopup } from '@/modes/density/DensityFeaturePopup';
import { Route, Compass, BarChart3, Menu, X, Network, Map as MapIcon } from 'lucide-react';
import type { AppMode } from '@/store';
import { useT, type StringKey } from '@/i18n';

const MODE_LABELS: Record<AppMode, { icon: typeof Route; labelKey: StringKey }> = {
  map: { icon: MapIcon, labelKey: 'shell_nav_map' },
  route: { icon: Route, labelKey: 'shell_nav_route' },
  explore: { icon: Compass, labelKey: 'shell_nav_timeline' },
  density: { icon: BarChart3, labelKey: 'shell_nav_analysis' },
  network: { icon: Network, labelKey: 'shell_nav_network' },
};

// Modes exposed in the UI. 'explore' is the Timeline view — it runs purely off
// the camera data (osmTimestamp), so it works with Canadian data. Route/Analysis/
// Network still rely on US-only datasets (routing API, boundaries, agency sharing
// network) and stay hidden until CA equivalents exist.
const VISIBLE_MODES: AppMode[] = ['map', 'explore'];
const showModeNav = VISIBLE_MODES.length > 1;

export function MapPage() {
  const t = useT();
  const {
    ensureCamerasLoaded,
    retryCameraLoad,
    isInitialized,
    cameras,
    error,
    getCamerasInBounds,
    loadPhase,
  } = useCameraStore();
  const bounds = useMapStore(s => s.bounds);
  const center = useMapStore(s => s.center);
  const zoom = useMapStore(s => s.zoom);
  const appMode = useAppModeStore(s => s.appMode);
  const mapVisualization = useAppModeStore(s => s.mapVisualization);
  const setAppMode = useAppModeStore(s => s.setAppMode);
  const isEmbed = useEmbedMode();
  const updateTimelineSettings = useAppModeStore(s => s.updateTimelineSettings);
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const isExplorePath = location.pathname === '/explore';
  const isTimelinePath = location.pathname === '/timeline';
  const isAnalysisPath = location.pathname === '/analysis';
  const isNetworkPath = location.pathname === '/network';
  const isRoutePath = location.pathname === '/route';
  const isExploreMode = appMode === 'explore';
  const hasAutoPlayed = useRef(false);

  // Seed map viewport from URL params once, before MapLibreContainer mounts.
  // useState initializer runs once — sets store synchronously so initialViewState picks it up.
  useState(() => {
    const viewport = parseViewportFromURL(new URLSearchParams(window.location.search));
    if (viewport) {
      useMapStore.setState({ center: [viewport.lat, viewport.lng], zoom: viewport.zoom });
    }
  });

  // Debounced live URL sync: mirrors whatever buildShareURL would produce,
  // so copying the address bar equals clicking Share.
  useEffect(() => {
    const t = setTimeout(() => {
      setSearchParams(prev => writeViewportParams(new URLSearchParams(prev)), { replace: true });
    }, 500);
    return () => clearTimeout(t);
  }, [center, zoom, appMode, mapVisualization, setSearchParams]);

  // Responsive breakpoint — single source of truth for timeline bar layout
  // Never go mobile in embed mode — the iframe width should not affect layout
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    if (isEmbed) return;
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [isEmbed]);

  // Runtime killswitch: poll the remote flag and reflect it (AND the build-time flag).
  useEffect(() => startSubmitFlagPolling((runtime) =>
    useSubmitStore.getState().setSubmitEnabled(SUBMIT_ENABLED && runtime)), []);

  // Sync URL params with app mode on mount
  useEffect(() => {
    const vizParam = searchParams.get('viz');
    const viz = vizParam === 'heatmap' ? 'heatmap' : 'dots';

    if (isAnalysisPath) {
      setAppMode('density');
    } else if (isExplorePath || isTimelinePath) {
      useAppModeStore.setState({
        appMode: 'explore',
        mapVisualization: viz,
        timelineSettings: {
          currentDate: isTimelinePath ? '2024-07-01' : new Date().toISOString().slice(0, 10),
          isPlaying: false,
          playSpeed: 45,
        },
      });
    } else if (isNetworkPath) {
      setAppMode('network');
    } else if (isRoutePath) {
      setAppMode('route');
    } else {
      const urlMode = searchParams.get('mode');
      if (urlMode === 'route') {
        setAppMode('route');
      } else if (urlMode === 'explore') {
        setAppMode('explore');
      } else if (urlMode === 'density') {
        setAppMode('density');
      } else if (urlMode === 'network') {
        setAppMode('network');
      } else {
        setAppMode('map');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update URL when mode changes
  const handleSetAppMode = useCallback((mode: AppMode) => {
    if (mode === 'explore') {
      // Set timeline state directly — bypass setAppMode which defaults to today's date
      useAppModeStore.setState({
        appMode: 'explore',
        mapVisualization: 'dots',
        timelineSettings: {
          currentDate: '2024-07-01',
          isPlaying: false,
          playSpeed: 45,
        },
      });
      hasAutoPlayed.current = false;
      navigate('/timeline', { replace: true });
    } else if (mode === 'map') {
      setAppMode(mode);
      setSearchParams({}, { replace: true });
    } else if (mode === 'route') {
      setAppMode(mode);
      setSearchParams({ mode: 'route' }, { replace: true });
    } else if (mode === 'density') {
      setAppMode(mode);
      setSearchParams({ mode: 'density' }, { replace: true });
    } else if (mode === 'network') {
      setAppMode(mode);
      setSearchParams({ mode: 'network' }, { replace: true });
    }
  }, [setAppMode, setSearchParams, navigate]);

  // Mobile menu state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Track map markers ready state
  const [markersReady, setMarkersReady] = useState(false);
  const [mapKey, setMapKey] = useState(0);
  const [watchdogWarning, setWatchdogWarning] = useState(false);
  const mapRef = useRef<MapLibreViewHandle>(null);
  const watchdogTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  // Get cameras in view for mobile header display
  const viewCameraCount = bounds
    ? getCamerasInBounds(bounds.north, bounds.south, bounds.east, bounds.west).length
    : 0;

  // Load cameras on mount - immediately, not waiting for idle
  // Also resets UI state in case of stale state from previous navigation
  useEffect(() => {
    const mountTime = performance.now();
    if (import.meta.env.DEV) {
      console.log('[MapPage] Component mounted, starting camera load...');
    }

    // Reset UI state on mount (handles navigation back scenarios)
    setMarkersReady(false);
    setWatchdogWarning(false);

    ensureCamerasLoaded()
      .then(() => {
        if (import.meta.env.DEV) {
          console.log(`[MapPage] Camera load complete in ${(performance.now() - mountTime).toFixed(0)}ms`);
        }
      })
      .catch((err) => {
        console.error('Camera initialization failed:', err);
      });
  }, [ensureCamerasLoaded]);

  // Watchdog: if markers don't become ready within 5s after cameras load, show warning
  useEffect(() => {
    if (isInitialized && cameras.length > 0 && !markersReady) {
      watchdogTimeoutRef.current = setTimeout(() => {
        if (!markersReady) {
          setWatchdogWarning(true);
          if (import.meta.env.DEV) {
            console.warn('[MapPage] Watchdog: markers not ready after 5s');
          }
        }
      }, 5000);
      
      return () => {
        if (watchdogTimeoutRef.current) {
          clearTimeout(watchdogTimeoutRef.current);
        }
      };
    }
  }, [isInitialized, cameras.length, markersReady]);

  // Handle markers ready callback from MapLibreView
  const handleMarkersReady = useCallback((ready: boolean) => {
    if (import.meta.env.DEV) {
      console.log(`[MapPage] Markers ready: ${ready}`);
    }
    setMarkersReady(ready);
    if (ready) {
      setWatchdogWarning(false);
    }
  }, []);

  // Handle retry with map remount
  const handleRetryWithRemount = useCallback(async () => {
    if (import.meta.env.DEV) {
      console.log('[MapPage] Retry with remount requested');
    }
    setWatchdogWarning(false);
    setMarkersReady(false);
    
    try {
      await retryCameraLoad();
      // Force map remount with new key
      setMapKey(k => k + 1);
    } catch {
      // Error handling done in store
    }
  }, [retryCameraLoad]);

  // Map progress: idle -> loading -> hydrating -> ready (for cameras)
  // Then map also needs markers to be ready
  const cameraProgress = error ? 'error' : loadPhase;
  
  // Show map only when cameras are fully loaded
  const camerasReady = isInitialized && cameras.length > 0;
  
  // Full ready state: cameras loaded AND map markers rendered
  const isFullyReady = camerasReady && markersReady;

  // /timeline path: auto-play dot density animation once map is ready
  useEffect(() => {
    if (isTimelinePath && isFullyReady && !hasAutoPlayed.current) {
      hasAutoPlayed.current = true;
      // Short delay so TimelineBar mounts and registers the tick callback
      const timer = setTimeout(() => {
        updateTimelineSettings({ isPlaying: true });
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [isTimelinePath, isFullyReady, updateTimelineSettings]);

  const seo = (
    <Seo
      title={t('shell_seo_title')}
      description={t('shell_seo_description')}
      path="/"
    />
  );

  return (
    <>
      {seo}
      {/* Unified loading overlay — map renders underneath so tiles load in parallel */}
      {(!isFullyReady || error) && (
        <MapLoadingScreen
          cameraProgress={cameraProgress}
          cameraCount={cameras.length}
          error={error}
          onRetry={handleRetryWithRemount}
          watchdogWarning={watchdogWarning}
          markersReady={markersReady}
          camerasReady={camerasReady}
        />
      )}
      <div className={`map-page h-screen w-screen flex flex-col bg-dark-900 overflow-hidden ${isExploreMode ? 'timeline-active' : ''}`}>
        {/* DeFlock credit banner - hidden in embed mode */}
        {!isEmbed && (
          <div className="shrink-0 bg-dark-800 border-b border-dark-700 px-3 py-1.5 text-center text-[11px] sm:text-xs text-dark-300 leading-snug z-50">
            {t('shell_credit_built_on')}{' '}
            <a href="https://github.com/FoggedLens/deflock" target="_blank" rel="noopener noreferrer" className="text-accent font-semibold hover:underline">DeFlock</a>
            {t('shell_credit_tail')}{' '}
            <a href="https://deflock.org/" target="_blank" rel="noopener noreferrer" className="text-accent font-semibold hover:underline">deflock.org</a>.
          </div>
        )}
        {/* Header - hidden in embed mode */}
        {!isEmbed && (
        <header className="h-12 bg-dark-900 border-b border-dark-600 flex items-center z-50 shrink-0">
          <div className="w-full px-4 lg:px-5">
            <div className="flex items-center justify-between h-12">
              {/* Logo */}
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <a href="https://panopti.ca" className="flex items-center">
                  <img
                    src="/panoptica-dark.svg"
                    alt="panopti.ca"
                    className="h-6 lg:h-7 w-auto object-contain"
                  />
                </a>
              </div>

              {/* Desktop: Mode tabs - editorial underline style */}
              {showModeNav && (
              <nav className="hidden lg:flex items-center gap-6" aria-label={t('shell_aria_app_modes')}>
                {VISIBLE_MODES.map((mode) => (
                  <button
                    key={mode}
                    onClick={() => handleSetAppMode(mode)}
                    className={`relative text-sm font-medium uppercase tracking-widest pb-1 transition-colors duration-150 ${
                      appMode === mode
                        ? 'text-accent'
                        : 'text-dark-200 hover:text-white'
                    }`}
                    aria-current={appMode === mode ? 'page' : undefined}
                  >
                    {t(MODE_LABELS[mode].labelKey)}
                    {appMode === mode && (
                      <span className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-accent" />
                    )}
                  </button>
                ))}
              </nav>
              )}

              {/* Mobile: Camera count + hamburger */}
              <div className="lg:hidden flex items-center gap-2">
                <span className="text-xs text-dark-400">
                  <span className="text-dark-200 font-semibold tabular-nums">{viewCameraCount.toLocaleString()}</span> {t('shell_in_view')}
                </span>
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="inline-flex items-center justify-center w-10 h-10 text-dark-300 hover:text-dark-100 transition-colors duration-150"
                  aria-label={mobileMenuOpen ? t('shell_aria_close_menu') : t('shell_aria_open_menu')}
                  aria-expanded={mobileMenuOpen}
                >
                  {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
              </div>

              <div className="hidden lg:flex items-center gap-4 flex-shrink-0">
                <ShareButton variant="header" />
                <LangToggle />
              </div>
            </div>
          </div>
        </header>
        )} {/* end !isEmbed header */}

        {/* Mobile slide-down menu — only relevant outside embed mode */}
        {!isEmbed && mobileMenuOpen && (
          <nav
            className="lg:hidden absolute top-12 left-0 right-0 z-[60] bg-dark-800 border-b border-dark-600"
            aria-label={t('shell_aria_mobile_nav')}
          >
            <div className="px-4 py-2 space-y-0.5">
              {showModeNav && VISIBLE_MODES.map((mode) => {
                const { icon: Icon, labelKey } = MODE_LABELS[mode];
                return (
                <button
                  key={mode}
                  onClick={() => {
                    handleSetAppMode(mode);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm transition-colors duration-150 ${
                    appMode === mode
                      ? 'text-accent'
                      : 'text-dark-300 hover:text-dark-100'
                  }`}
                  aria-current={appMode === mode ? 'page' : undefined}
                >
                  <Icon className="w-4 h-4" aria-hidden="true" />
                  <span>{t(labelKey)}</span>
                </button>
                );
              })}
            </div>
            <div className="border-t border-dark-600 mt-1 pt-1 px-4 pb-2 space-y-0.5">
              <ShareButton variant="menu-item" />
              <LangToggle className="w-full flex items-center px-3 py-2.5" />
            </div>
          </nav>
        )}

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden relative">
          {/* Mobile: unified tabbed drawer */}
          {isMobile && <MobileTabDrawer onModeChange={handleSetAppMode} />}

          {/* Desktop: individual side panels */}
          {!isMobile && appMode === 'map' && <MapPanel />}
          {!isMobile && appMode === 'route' && <RoutePanel />}
          {!isMobile && appMode === 'explore' && <ExplorePanel />}
          {!isMobile && appMode === 'density' && <DensityPanel />}
          {!isMobile && appMode === 'network' && <NetworkPanel />}

          {/* Map */}
          <main className="flex-1 relative w-full lg:w-auto">
            <h1 className="sr-only">{t('shell_h1_title')}</h1>
            <MapLibreView
              ref={mapRef}
              mapKey={mapKey}
              onMarkersReady={handleMarkersReady}
            />

            {/* Map Overlays */}
            {!isEmbed && <MapSearch />}
            {appMode === 'network' ? <NetworkAgencyCount /> : appMode !== 'map' ? <CameraStats /> : null}
            <MapStyleControl />
            {!isMobile && <SubmitPanel />}
            <SubmitToast />

            {/* Density feature popup — floating stats card */}
            {appMode === 'density' && <DensityFeaturePopup />}

            {/* Density legend bar — horizontal bottom overlay */}
            {appMode === 'density' && <DensityLegendBar />}


            {/* Map Legend - route mode only (explore/density legends live in side panel) */}
            {appMode === 'route' && (
              <div className="absolute bottom-6 left-4 z-20 hidden lg:flex flex-col gap-2">
                <div className="bg-dark-800/90 rounded-md px-3 py-2 border border-dark-600">
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-accent shadow-[0_0_8px_rgba(56,189,248,0.3)]"></div>
                      <span className="text-dark-100">ALPR Camera</span>
                    </div>
                    <div className="w-px h-5 bg-dark-600"></div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-1 rounded-full bg-orange-500 shadow-[0_0_6px_rgba(249,115,22,0.5)]" style={{backgroundImage: 'repeating-linear-gradient(90deg, #f97316 0, #f97316 4px, transparent 4px, transparent 7px)'}}></div>
                      <span className="text-dark-100">Direct Route</span>
                    </div>
                    <div className="w-px h-5 bg-dark-600"></div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-1 rounded-full bg-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.5)]"></div>
                      <span className="text-dark-100">Privacy Route</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Municipal election notice — sits directly above the map mode legend */}
            {appMode === 'map' && (
              <div className="absolute bottom-20 left-4 z-20 hidden lg:block">
                <ElectionNotice />
              </div>
            )}

            {/* Map mode legend */}
            {appMode === 'map' && (
              <div className="absolute bottom-6 left-4 z-20 hidden lg:flex flex-col gap-2">
                <div className="bg-dark-800/90 rounded-md px-3 py-2 border border-dark-600">
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-accent shadow-[0_0_8px_rgba(56,189,248,0.3)]"></div>
                      <span className="text-dark-100">{t('shell_legend_alpr_camera')}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Timeline Bar — single instance, wrapper switches on breakpoint */}
            {isExploreMode && (
              <div className={isMobile
                ? "timeline-bar-mobile fixed bottom-[84px] left-3 right-3 z-[51] h-12 bg-dark-900/70 backdrop-blur-xl rounded-xl border border-white/[0.06] shadow-lg shadow-black/30"
                : "timeline-bar-desktop absolute bottom-4 left-4 right-20 z-20 h-14 bg-dark-900/70 backdrop-blur-xl rounded-xl border border-white/[0.06] shadow-lg shadow-black/30"
              }>
                <TimelineBar />
              </div>
            )}
          </main>
        </div>
      </div>
    </>
  );
}
