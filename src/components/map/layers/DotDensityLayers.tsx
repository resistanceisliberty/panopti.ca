import { useEffect, useMemo, useRef } from 'react';
import { Source, Layer, useMap } from 'react-map-gl/maplibre';
import type maplibregl from 'maplibre-gl';
import { useCameraStore, useAppModeStore } from '../../../store';
import type { ALPRCamera } from '../../../types';
import { applyCameraTypeFilter } from '../../../store/cameraStore';

/**
 * Convert cameras to unclustered GeoJSON for dot density rendering.
 * Each camera becomes one small semi-transparent dot.
 * Where dots overlap, opacity stacks — dense areas appear brighter/more solid.
 */
function camerasToDotsGeoJSON(cameras: ALPRCamera[]): GeoJSON.FeatureCollection {
  const features = new Array(cameras.length);
  for (let i = 0; i < cameras.length; i++) {
    const camera = cameras[i];
    features[i] = {
      type: 'Feature' as const,
      geometry: {
        type: 'Point' as const,
        coordinates: [
          Math.round(camera.lon * 10000) / 10000,
          Math.round(camera.lat * 10000) / 10000,
        ],
      },
      properties: {
        ts: camera.osmTimestamp ? new Date(camera.osmTimestamp).getTime() : 0,
      },
    };
  }
  return { type: 'FeatureCollection', features };
}

export function DotDensityLayers() {
  const filteredCameras = useCameraStore(s => s.filteredCameras);
  const cameras = useCameraStore(s => s.cameras);
  const cameraType = useCameraStore(s => s.cameraType);
  // Selective subscriptions: only re-render for settings/mode changes, NOT currentDate
  const dotDensitySettings = useAppModeStore((s) => s.dotDensitySettings);
  const appMode = useAppModeStore((s) => s.appMode);
  const isTimelineActive = appMode === 'explore';
  const { current: map } = useMap();
  const prevSettingsRef = useRef(dotDensitySettings);

  // Timeline loads all cameras (date visibility is applied imperatively) but still
  // honours the ALPR/CCTV/Both toggle. Memoized so the reference is stable per type.
  const cameraSource = useMemo(
    () => (isTimelineActive ? applyCameraTypeFilter(cameras, cameraType) : filteredCameras),
    [isTimelineActive, cameras, cameraType, filteredCameras]
  );

  // During timeline, load ALL cameras once; visibility controlled via filter prop
  const geojsonData = useMemo(
    () => camerasToDotsGeoJSON(cameraSource),
    [cameraSource]
  );

  // Timeline filtering is handled entirely by MapLibreContainer's imperative
  // handleTimelineTick (calls map.setFilter on 'dot-density-layer').
  // This initial filter prevents a flash of all dots before the first tick runs.
  const initialFilter = useMemo(() => {
    if (!isTimelineActive) return undefined;
    const { currentDate } = useAppModeStore.getState().timelineSettings;
    const parts = currentDate.split('-').map(Number);
    const cutoffMs = new Date(parts[0], parts[1] - 1, parts[2], 23, 59, 59, 999).getTime();
    // ts=0 (no-date cameras) is always <= cutoffMs, so single comparison suffices
    return ['<=', ['get', 'ts'], cutoffMs] as maplibregl.FilterSpecification;
     
  }, [isTimelineActive]);

  // Update paint properties imperatively when settings change
  useEffect(() => {
    if (!map) return;
    const mapInstance = map.getMap();
    if (!mapInstance.getLayer('dot-density-layer')) return;

    const prev = prevSettingsRef.current;
    const curr = dotDensitySettings;

    try {
      if (prev.radius !== curr.radius) {
        mapInstance.setPaintProperty('dot-density-layer', 'circle-radius', curr.radius);
      }
      if (prev.opacity !== curr.opacity) {
        mapInstance.setPaintProperty('dot-density-layer', 'circle-opacity', curr.opacity);
      }
      if (prev.color !== curr.color) {
        mapInstance.setPaintProperty('dot-density-layer', 'circle-color', curr.color);
      }
    } catch {
      // Layer may not be ready yet
    }

    prevSettingsRef.current = curr;
  }, [dotDensitySettings, map]);

  return (
    <Source
      id="cameras-dots"
      type="geojson"
      data={geojsonData}
    >
      <Layer
        id="dot-density-layer"
        type="circle"
        source="cameras-dots"
        filter={initialFilter}
        paint={{
          'circle-color': dotDensitySettings.color,
          'circle-radius': dotDensitySettings.radius,
          'circle-opacity': dotDensitySettings.opacity,
          'circle-stroke-width': 0,
        }}
      />
    </Source>
  );
}
