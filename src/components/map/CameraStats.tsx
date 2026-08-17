import { useMemo } from 'react';
import { useMapStore, useCameraStore } from '../../store';
import { classifyCamera } from '../../store/cameraStore';
import { useT } from '@/i18n';

export function CameraStats() {
  const t = useT();
  const bounds = useMapStore(s => s.bounds);
  const getCamerasInBounds = useCameraStore(s => s.getCamerasInBounds);
  const cameras = useCameraStore(s => s.cameras);
  const cameraCount = cameras.length;
  const isLoading = useCameraStore(s => s.isLoading);

  // Dataset totals split by type — matches the ALPR/CCTV timeline toggle.
  const cctvTotal = useMemo(
    () => cameras.reduce((n, c) => (classifyCamera(c) === 'cctv' ? n + 1 : n), 0),
    [cameras]
  );
  const alprTotal = cameraCount - cctvTotal;
  
  // Get cameras in actual map bounds
  const viewCameraCount = bounds 
    ? getCamerasInBounds(bounds.north, bounds.south, bounds.east, bounds.west).length
    : 0;

  // Only show on desktop - mobile shows camera count in header
  return (
    <div className="hidden lg:block absolute top-4 right-4 z-40">
      <div className="bg-dark-800/90 rounded-md px-3 py-1.5 border border-dark-600">
        <div className="flex items-center gap-4">
          {/* Recording indicator / Loading spinner */}
          <div className="relative">
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-dark-600 border-t-blue-400 rounded-full animate-spin"></div>
            ) : (
              <div className="w-3.5 h-3.5 rounded-full bg-primary"></div>
            )}
          </div>
          
          {/* Camera count - fixed width to prevent jumping */}
          <div className="flex-1">
            {isLoading ? (
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-display font-medium text-dark-300">
                  {t('popup_stats_loading')}
                </span>
              </div>
            ) : (
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-display font-bold text-accent font-semibold tabular-nums min-w-[60px]">
                  {viewCameraCount.toLocaleString()}
                </span>
                <span className="text-sm text-dark-200">
                  {t('popup_stat_in_view')}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Totals — combined, then split by type (matches the timeline toggle) */}
        <div className="mt-3 pt-3 border-t border-dark-700/50 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-dark-200">{t('popup_stat_total_canada')}</span>
            <span className="text-sm font-medium text-dark-100 tabular-nums">
              {isLoading ? <span className="text-dark-400">—</span> : cameraCount.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-dark-300 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: '#0080BC' }} />
              {t('popup_stat_alprs')}
            </span>
            <span className="text-xs font-medium text-dark-200 tabular-nums">
              {isLoading ? <span className="text-dark-400">—</span> : alprTotal.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-dark-300 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: '#F59E0B' }} />
              {t('popup_stat_gov_cctvs')}
            </span>
            <span className="text-xs font-medium text-dark-200 tabular-nums">
              {isLoading ? <span className="text-dark-400">—</span> : cctvTotal.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
