import { useEffect, useState } from 'react';
import type { CameraLoadPhase } from '@/store/cameraStore';
import { LegacyMapLink } from '@/components/common';
import { useT } from '@/i18n';

interface MapLoadingScreenProps {
  cameraProgress: CameraLoadPhase;
  cameraCount?: number;
  error?: string | null;
  onRetry?: () => void;
  watchdogWarning?: boolean;
  camerasReady?: boolean;
  markersReady?: boolean;
}

/**
 * Unified loading overlay for the map page.
 * Renders as a fixed overlay so the map can load tiles underneath.
 * Covers all phases: camera fetch → hydrate → map render → ready.
 */
export function MapLoadingScreen({
  cameraProgress,
  cameraCount = 0,
  error,
  onRetry,
  watchdogWarning = false,
  camerasReady = false,
  markersReady = false,
}: MapLoadingScreenProps) {
  const t = useT();
  const [dots, setDots] = useState('');

  // Calculate progress percentage across ALL phases (camera + map render)
  const getProgressPercent = () => {
    if (error) return 0;
    if (markersReady) return 100;
    if (camerasReady) return 85; // Cameras done, waiting for map to render markers
    switch (cameraProgress) {
      case 'idle': return 10;
      case 'fetching': return 35;
      case 'hydrating': return 65;
      case 'ready': return 85;
      default: return 15;
    }
  };

  // Get current phase label — includes map rendering phase
  const getPhaseLabel = () => {
    if (error) return t('load_phase_error');
    if (camerasReady && !markersReady) return t('load_phase_rendering');
    switch (cameraProgress) {
      case 'idle': return t('load_phase_initializing');
      case 'fetching': return t('load_phase_fetching');
      case 'hydrating': return t('load_phase_preparing');
      case 'ready': return t('load_phase_rendering');
      default: return t('load_phase_default');
    }
  };

  // Animate loading dots
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(d => d.length >= 3 ? '' : d + '.');
    }, 400);
    return () => clearInterval(interval);
  }, []);


  // Determine which stages are complete
  const fetchDone = cameraProgress === 'hydrating' || cameraProgress === 'ready' || camerasReady;
  const prepareDone = cameraProgress === 'ready' || camerasReady;
  const renderActive = camerasReady && !markersReady;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-dark-900 overflow-hidden">
      {/* Header - Same as map page for consistency */}
      <header className="h-14 lg:h-16 bg-dark-900 border-b border-dark-600 flex items-center z-50 shrink-0">
        <div className="w-full px-3 lg:px-6">
          <div className="flex items-center justify-between h-14 lg:h-16">
            {/* Logo */}
            <a href="/" className="flex items-center gap-2 group">
              <img
                src="/panoptica-dark.svg"
                alt="panopti.ca"
                className="h-8 lg:h-10 w-auto object-contain transition-all duration-300 group-hover:scale-110"
              />
            </a>

            {/* Loading indicator in header */}
            <div className="flex items-center gap-2 bg-dark-800 rounded-full px-3 py-1.5">
              <div className="w-3 h-3 border-2 border-dark-600 border-t-accent rounded-full animate-spin"></div>
              <span className="text-sm text-dark-300">{t('load_loading')}{dots}</span>
            </div>

            <div className="hidden lg:flex items-center gap-4 flex-shrink-0" />
          </div>
        </div>
      </header>

      {/* Main loading content */}
      <div className="flex-1 flex items-center justify-center relative pb-14 lg:pb-16">
        {/* Animated background - subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `
              linear-gradient(to right, #4DA6FF 1px, transparent 1px),
              linear-gradient(to bottom, #4DA6FF 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
          }}
        />

        {/* Radial glow effect */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(circle at 50% 50%, rgba(30,144,255,0.08) 0%, transparent 50%)',
          }}
        />

        {error ? (
          // Error state
          <div className="relative z-10 flex flex-col items-center gap-6 px-6 max-w-md text-center">
            <div className="flex items-center gap-2 lg:gap-3 opacity-50">
              <img
                src="/panoptica-dark.svg"
                alt="panopti.ca"
                className="h-12 lg:h-20 w-auto object-contain"
              />
            </div>
            <div>
              <h2 className="text-xl font-display font-bold text-white mb-2">
                {t('load_error_heading')}
              </h2>
              <p className="text-dark-300 text-sm">
                {error}
              </p>
            </div>
            <div className="flex flex-col gap-3 w-full max-w-xs">
              <button
                onClick={onRetry}
                className="w-full px-6 py-3 bg-accent hover:bg-accent-hover text-white font-semibold rounded-md transition-colors"
              >
                {t('load_error_retry')}
              </button>
              <LegacyMapLink variant="button" className="flex-none" />
            </div>
          </div>
        ) : (
          // Loading state
          <div className="relative z-10 flex flex-col items-center gap-6 lg:gap-8 px-6">
            {/* Logo */}
            <div className="flex items-center gap-2 lg:gap-3">
              <img
                src="/panoptica-dark.svg"
                alt="panopti.ca"
                className="h-12 lg:h-24 w-auto object-contain"
              />
            </div>

            {/* Loading spinner and text */}
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-3 border-dark-700 border-t-accent rounded-full animate-spin" />
              <p className="text-dark-300 text-sm">
                {getPhaseLabel()}{dots}
              </p>
            </div>

            {/* Progress indicator with stages */}
            <div className="w-72 max-w-full">
              {/* Stage indicators */}
              <div className="flex justify-between text-xs text-dark-400 mb-2">
                <span className={cameraProgress === 'fetching' && !fetchDone ? 'text-accent' : fetchDone ? 'text-success' : ''}>
                  {t('load_stage_fetch')}
                </span>
                <span className={cameraProgress === 'hydrating' && !prepareDone ? 'text-accent' : prepareDone ? 'text-success' : ''}>
                  {t('load_stage_prepare')}
                </span>
                <span className={renderActive ? 'text-accent' : markersReady ? 'text-success' : ''}>
                  {t('load_stage_render')}
                </span>
              </div>

              {/* Progress bar */}
              <div className="h-1.5 bg-dark-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${getProgressPercent()}%` }}
                />
              </div>

              {/* Camera count */}
              {cameraCount > 0 && (
                <p className="text-center text-xs text-dark-400 mt-2">
                  {cameraCount.toLocaleString()} {t('load_cameras_loaded')}
                </p>
              )}
            </div>

            {/* Watchdog warning */}
            {watchdogWarning && (
              <div className="mt-2 px-4 py-3 bg-amber-900/30 rounded-xl border border-amber-500/30 max-w-sm">
                <p className="text-xs text-amber-300 text-center mb-2">
                  {t('load_watchdog_warning')}
                </p>
                <button
                  onClick={onRetry}
                  className="w-full px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  {t('load_watchdog_retry')}
                </button>
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
}
