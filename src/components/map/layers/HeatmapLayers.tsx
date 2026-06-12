import { useEffect, useMemo, useRef } from 'react';
import { Source, Layer, useMap } from 'react-map-gl/maplibre';
import { useCameraStore, useAppModeStore } from '../../../store';
import { buildHeatmapColorExpression } from '../../../modes/heatmap/colorSchemes';
import type { ALPRCamera } from '../../../types';

// Government CCTV nodes carry this brand label in the Canada dataset.
const CCTV_BRAND = 'Government CCTVs';

// Two heatmaps are rendered: one for ALPRs, one for government CCTVs. They share
// the intensity/radius/opacity sliders but each gets its own colour scheme, so in
// "Both" mode the two layers stay visually distinct (e.g. neon ALPRs + thermal CCTVs).
const ALPR_LAYER = 'heatmap-layer';        // legacy id — kept so existing timeline filtering still finds it
const CCTV_LAYER = 'heatmap-layer-cctv';

// Exposed so MapLibreContainer's timeline tick can filter both heatmaps by timestamp.
export const HEATMAP_LAYER_IDS = [ALPR_LAYER, CCTV_LAYER];

/**
 * Convert cameras to unclustered GeoJSON for heatmap rendering.
 * Heatmap needs raw individual points, not clusters.
 * Coordinates rounded to 4 decimals (~11m precision) — sufficient for heatmap.
 * Includes `ts` (Unix epoch ms) for timeline filtering via setFilter.
 */
function camerasToHeatmapGeoJSON(cameras: ALPRCamera[]): GeoJSON.FeatureCollection {
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
        weight: 1,
        ts: camera.osmTimestamp ? new Date(camera.osmTimestamp).getTime() : 0,
      },
    };
  }
  return { type: 'FeatureCollection', features };
}

// Zoom-interpolated paint expressions, shared by both heatmaps.
function intensityExpr(intensity: number) {
  return [
    'interpolate', ['linear'], ['zoom'],
    0,  intensity * 0.15,
    4,  intensity * 0.4,
    7,  intensity * 0.8,
    9,  intensity,
    12, intensity * 2.0,
    14, intensity * 3.0,
  ];
}
function radiusExpr(radius: number) {
  return [
    'interpolate', ['linear'], ['zoom'],
    0,  2,
    4,  Math.max(4, radius * 0.2),
    7,  Math.max(8, radius * 0.5),
    9,  radius,
    12, radius * 1.4,
    14, radius * 1.8,
  ];
}
function opacityExpr(opacity: number) {
  return [
    'interpolate', ['linear'], ['zoom'],
    0,  opacity,
    9,  opacity,
    11, opacity * 0.7,
    13, opacity * 0.2,
    14, 0,
  ];
}

export function HeatmapLayers({ visible = true }: { visible?: boolean }) {
  const filteredCameras = useCameraStore(s => s.filteredCameras);
  const cameras = useCameraStore(s => s.cameras);
  // Selective subscriptions: only re-render for settings/mode changes, NOT currentDate
  const heatmapSettings = useAppModeStore((s) => s.heatmapSettings);
  const appMode = useAppModeStore((s) => s.appMode);
  const isTimelineActive = appMode === 'explore';
  const { current: map } = useMap();
  const prevSettingsRef = useRef(heatmapSettings);

  // Derive camera source outside memo so reference equality prevents recomputation on tab switches
  const cameraSource = isTimelineActive ? cameras : filteredCameras;

  // Split by brand into two point sets. When the "Show" toggle hides a type,
  // filteredCameras already drops it, so that heatmap simply renders nothing.
  const { alprData, cctvData } = useMemo(() => {
    const alpr: ALPRCamera[] = [];
    const cctv: ALPRCamera[] = [];
    for (const c of cameraSource) {
      (c.brand === CCTV_BRAND ? cctv : alpr).push(c);
    }
    return {
      alprData: camerasToHeatmapGeoJSON(alpr),
      cctvData: camerasToHeatmapGeoJSON(cctv),
    };
  }, [cameraSource]);

  const alprColor = useMemo(
    () => buildHeatmapColorExpression(heatmapSettings.colorScheme),
    [heatmapSettings.colorScheme]
  );
  const cctvColor = useMemo(
    () => buildHeatmapColorExpression(heatmapSettings.cctvColorScheme),
    [heatmapSettings.cctvColorScheme]
  );

  // Update paint properties imperatively when settings change (avoids full re-render)
  useEffect(() => {
    if (!map) return;
    const mapInstance = map.getMap();
    if (!mapInstance.getLayer(ALPR_LAYER) && !mapInstance.getLayer(CCTV_LAYER)) return;

    const prev = prevSettingsRef.current;
    const curr = heatmapSettings;

    const setBoth = (prop: string, value: unknown) => {
      for (const id of HEATMAP_LAYER_IDS) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (mapInstance.getLayer(id)) mapInstance.setPaintProperty(id, prop, value as any);
      }
    };

    try {
      if (prev.intensity !== curr.intensity) setBoth('heatmap-intensity', intensityExpr(curr.intensity));
      if (prev.radius !== curr.radius) setBoth('heatmap-radius', radiusExpr(curr.radius));
      if (prev.opacity !== curr.opacity) setBoth('heatmap-opacity', opacityExpr(curr.opacity));
      if (prev.colorScheme !== curr.colorScheme && mapInstance.getLayer(ALPR_LAYER)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        mapInstance.setPaintProperty(ALPR_LAYER, 'heatmap-color', buildHeatmapColorExpression(curr.colorScheme) as any);
      }
      if (prev.cctvColorScheme !== curr.cctvColorScheme && mapInstance.getLayer(CCTV_LAYER)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        mapInstance.setPaintProperty(CCTV_LAYER, 'heatmap-color', buildHeatmapColorExpression(curr.cctvColorScheme) as any);
      }
    } catch {
      // Layer may not be ready yet
    }

    prevSettingsRef.current = curr;
  }, [heatmapSettings, map]);

  const buildPaint = (colorExpression: ReturnType<typeof buildHeatmapColorExpression>) => ({
    'heatmap-weight': 1,
    'heatmap-intensity': intensityExpr(heatmapSettings.intensity) as unknown as number,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    'heatmap-color': colorExpression as any,
    'heatmap-radius': radiusExpr(heatmapSettings.radius) as unknown as number,
    'heatmap-opacity': opacityExpr(heatmapSettings.opacity) as unknown as number,
  });

  const layout = { visibility: visible ? ('visible' as const) : ('none' as const) };

  return (
    <>
      <Source id="cameras-heatmap" type="geojson" data={alprData} maxzoom={14}>
        <Layer
          id={ALPR_LAYER}
          type="heatmap"
          source="cameras-heatmap"
          maxzoom={14}
          layout={layout}
          paint={buildPaint(alprColor)}
        />
      </Source>
      <Source id="cameras-heatmap-cctv" type="geojson" data={cctvData} maxzoom={14}>
        <Layer
          id={CCTV_LAYER}
          type="heatmap"
          source="cameras-heatmap-cctv"
          maxzoom={14}
          layout={layout}
          paint={buildPaint(cctvColor)}
        />
      </Source>
    </>
  );
}
