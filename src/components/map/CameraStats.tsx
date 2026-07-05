import { useMapStore, useCameraStore } from '../../store';

export function CameraStats() {
  const bounds = useMapStore(s => s.bounds);
  const getCamerasInBounds = useCameraStore(s => s.getCamerasInBounds);
  const cameraCount = useCameraStore(s => s.cameras.length);
  const isLoading = useCameraStore(s => s.isLoading);
  
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
                  Loading...
                </span>
              </div>
            ) : (
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-display font-bold text-accent font-semibold tabular-nums min-w-[60px]">
                  {viewCameraCount.toLocaleString()}
                </span>
                <span className="text-sm text-dark-200">
                  in view
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Total cameras badge */}
        <div className="mt-3 pt-3 border-t border-dark-700/50 flex items-center justify-between">
          <span className="text-xs text-dark-200">Total Canada</span>
          <span className="text-sm font-medium text-dark-100 tabular-nums">
            {isLoading ? (
              <span className="text-dark-400">—</span>
            ) : (
              cameraCount.toLocaleString()
            )}
          </span>
        </div>
      </div>
    </div>
  );
}
