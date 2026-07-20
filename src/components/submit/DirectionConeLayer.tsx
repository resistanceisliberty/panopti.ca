import { useMemo } from 'react';
import { Source, Layer } from 'react-map-gl/maplibre';
import { useSubmitStore } from '../../store/submitStore';

const CONE_M = 45; // wedge length, metres
const FOV = 65;    // total spread, degrees (wider flare at the tip)

// Forward geodesic: point at `bearing`° (cw from N) and `dist` m from lat/lon.
function dest(lat: number, lon: number, bearing: number, dist: number): [number, number] {
  const rad = Math.PI / 180, Re = 6371000;
  const d = dist / Re, t = bearing * rad, p1 = lat * rad, l1 = lon * rad;
  const p2 = Math.asin(Math.sin(p1) * Math.cos(d) + Math.cos(p1) * Math.sin(d) * Math.cos(t));
  const l2 = l1 + Math.atan2(Math.sin(t) * Math.sin(d) * Math.cos(p1), Math.cos(d) - Math.sin(p1) * Math.sin(p2));
  return [l2 / rad, p2 / rad];
}

function wedge(lat: number, lon: number, bearing: number): GeoJSON.Feature {
  const ring: [number, number][] = [[lon, lat]];
  for (let a = -FOV / 2; a <= FOV / 2 + 0.001; a += 4) ring.push(dest(lat, lon, bearing + a, CONE_M));
  ring.push([lon, lat]);
  return { type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [ring] } };
}

export function DirectionConeLayer() {
  const mode = useSubmitStore((s) => s.mode);
  const point = useSubmitStore((s) => s.point);
  const directions = useSubmitStore((s) => s.draft.directions);

  const data = useMemo<GeoJSON.FeatureCollection>(() => {
    if (mode === 'idle' || !point) return { type: 'FeatureCollection', features: [] };
    const features = directions
      .map((d) => d.trim())
      .filter((d) => d !== '')
      .map(Number)
      .filter(Number.isFinite)
      .map((b) => wedge(point.lat, point.lon, b));
    return { type: 'FeatureCollection', features };
  }, [mode, point, directions]);

  if (!data.features.length) return null;

  return (
    <Source id="direction-cones" type="geojson" data={data}>
      <Layer id="direction-cones-fill" type="fill" paint={{ 'fill-color': '#0080BC', 'fill-opacity': 0.22 }} />
      <Layer id="direction-cones-line" type="line" paint={{ 'line-color': '#0080BC', 'line-width': 1.5, 'line-opacity': 0.7 }} />
    </Source>
  );
}
