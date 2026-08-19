// Internal feed of the newest ALPR/CCTV nodes on the map, sorted by OSM edit time.
// Read-only view of public OSM data (everything here is already on the live map), so
// unlike /admin/flock it needs no auth gate. English-only internal tool (no i18n).
import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import Map, { Marker, NavigationControl, type MapRef } from 'react-map-gl/maplibre';
import type { StyleSpecification } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useCameraStore, classifyCamera } from '../store/cameraStore';
import type { ALPRCamera } from '../types/camera';

// Minimal dark raster basemap — this internal page doesn't need the site's vector
// style (and shouldn't drag in the 1200-line map container to get it).
const BASEMAP: StyleSpecification = {
  version: 8,
  sources: {
    carto: {
      type: 'raster',
      tiles: [
        'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
        'https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
        'https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
      ],
      tileSize: 256,
      attribution: '&copy; OpenStreetMap &copy; CARTO',
    },
  },
  layers: [{ id: 'carto', type: 'raster', source: 'carto' }],
};

type TypeFilter = 'alpr' | 'cctv' | 'all';
const WINDOWS: { label: string; days: number | null }[] = [
  { label: 'All', days: null }, { label: '90d', days: 90 }, { label: '30d', days: 30 }, { label: '7d', days: 7 },
];
const CAP = 300;

function ago(iso?: string): string {
  if (!iso) return '—';
  const s = (Date.now() - Date.parse(iso)) / 1000;
  if (s < 3600) return `${Math.max(1, Math.round(s / 60))}m ago`;
  if (s < 86400) return `${Math.round(s / 3600)}h ago`;
  return `${Math.round(s / 86400)}d ago`;
}

export function AdminSubmissions() {
  const cameras = useCameraStore((s) => s.cameras);
  const loadPhase = useCameraStore((s) => s.loadPhase);
  const ensure = useCameraStore((s) => s.ensureCamerasLoaded);
  useEffect(() => { ensure(); }, [ensure]);

  const [typeFilter, setTypeFilter] = useState<TypeFilter>('alpr');
  const [windowDays, setWindowDays] = useState<number | null>(null);
  const [newOnly, setNewOnly] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const feed = useMemo(() => {
    const cutoff = windowDays ? Date.now() - windowDays * 86_400_000 : 0;
    return cameras
      .filter((c) => typeFilter === 'all' || classifyCamera(c) === typeFilter)
      .filter((c) => !newOnly || c.osmVersion === 1)
      .filter((c) => (c.osmTimestamp ? Date.parse(c.osmTimestamp) : 0) >= cutoff)
      .sort((a, b) => Date.parse(b.osmTimestamp || '') - Date.parse(a.osmTimestamp || ''))
      .slice(0, CAP);
  }, [cameras, typeFilter, windowDays, newOnly]);

  const mapRef = useRef<MapRef>(null);
  const fit = useCallback(() => {
    if (!mapRef.current || feed.length === 0) return;
    let minLon = Infinity, minLat = Infinity, maxLon = -Infinity, maxLat = -Infinity;
    for (const c of feed) {
      minLon = Math.min(minLon, c.lon); maxLon = Math.max(maxLon, c.lon);
      minLat = Math.min(minLat, c.lat); maxLat = Math.max(maxLat, c.lat);
    }
    mapRef.current.fitBounds([[minLon, minLat], [maxLon, maxLat]], { padding: 60, maxZoom: 12, duration: 500 });
  }, [feed]);
  useEffect(() => { fit(); }, [fit]);

  const select = (c: ALPRCamera) => {
    setSelectedId(c.osmId);
    mapRef.current?.flyTo({ center: [c.lon, c.lat], zoom: 15, duration: 600 });
  };

  const loading = loadPhase === 'fetching' || loadPhase === 'hydrating';

  return (
    <div className="min-h-screen bg-dark-900 text-dark-100">
      <header className="border-b border-dark-700 px-5 py-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h1 className="text-xl font-display font-semibold text-white">New ALPR submissions — feed</h1>
          <span className="text-xs text-dark-400">
            {loading ? 'loading cameras…' : `${feed.length}${feed.length === CAP ? '+' : ''} shown · ${cameras.length} total on map`}
          </span>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
          <div className="flex items-center gap-1">
            {(['alpr', 'cctv', 'all'] as TypeFilter[]).map((t) => (
              <button key={t} onClick={() => setTypeFilter(t)}
                className={`rounded px-2.5 py-1 text-xs font-medium ${typeFilter === t ? 'bg-accent text-white' : 'bg-dark-800 text-dark-300 hover:bg-dark-700'}`}>
                {t === 'alpr' ? 'ALPR' : t === 'cctv' ? 'Traffic/CCTV' : 'All'}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1">
            {WINDOWS.map((w) => (
              <button key={w.label} onClick={() => setWindowDays(w.days)}
                className={`rounded px-2.5 py-1 text-xs font-medium ${windowDays === w.days ? 'bg-accent text-white' : 'bg-dark-800 text-dark-300 hover:bg-dark-700'}`}>
                {w.label}
              </button>
            ))}
          </div>
          <label className="flex items-center gap-1.5 text-xs text-dark-300 cursor-pointer">
            <input type="checkbox" checked={newOnly} onChange={(e) => setNewOnly(e.target.checked)} />
            New only (never edited)
          </label>
        </div>
      </header>

      <div className="lg:flex">
        <div className="h-[42vh] lg:h-[calc(100vh-2.75rem)] lg:w-3/5 lg:sticky lg:top-11 bg-dark-800">
          <Map ref={mapRef} initialViewState={{ longitude: -96, latitude: 56, zoom: 3 }}
            style={{ width: '100%', height: '100%' }} mapStyle={BASEMAP} onLoad={fit}
            onClick={() => setSelectedId(null)}>
            <NavigationControl position="top-right" />
            {feed.map((c) => {
              const isAlpr = classifyCamera(c) === 'alpr';
              const sel = c.osmId === selectedId;
              return (
                <Marker key={c.osmId} longitude={c.lon} latitude={c.lat} anchor="center"
                  onClick={(e) => { e.originalEvent.stopPropagation(); select(c); }}>
                  <div title={c.brand || c.operator || `${c.osmType}/${c.osmId}`}
                    style={{
                      width: sel ? 16 : 10, height: sel ? 16 : 10, borderRadius: '50%',
                      background: isAlpr ? '#ef4444' : '#3b82f6', cursor: 'pointer',
                      border: sel ? '2px solid #fff' : '1px solid rgba(255,255,255,0.6)',
                      boxShadow: sel ? '0 0 0 4px rgba(239,68,68,0.35)' : 'none',
                    }} />
                </Marker>
              );
            })}
          </Map>
        </div>

        <div className="lg:w-2/5 p-4 space-y-2">
          {!loading && feed.length === 0 && (
            <p className="text-dark-500 text-sm">No submissions match these filters.</p>
          )}
          {feed.map((c) => (
            <button key={c.osmId} onClick={() => select(c)}
              className={`block w-full text-left rounded-lg border p-3 transition-colors ${
                c.osmId === selectedId ? 'border-accent bg-dark-700' : 'border-dark-700 bg-dark-800 hover:bg-dark-700'}`}>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-dark-400">{ago(c.osmTimestamp)} · {c.osmTimestamp?.slice(0, 16).replace('T', ' ')}</span>
                {c.osmVersion === 1
                  ? <span className="text-[10px] font-bold uppercase tracking-wide rounded px-1.5 py-0.5" style={{ background: 'rgba(16,185,129,0.18)', color: '#6ee7b7' }}>New</span>
                  : <span className="text-[10px] rounded px-1.5 py-0.5" style={{ background: 'rgba(148,163,184,0.15)', color: '#cbd5e1' }}>edited · v{c.osmVersion}</span>}
              </div>
              <div className="mt-1 text-sm text-dark-100">
                <span className="font-medium">{classifyCamera(c) === 'alpr' ? 'ALPR' : 'Traffic/CCTV'}</span>
                {(c.brand || c.operator) && <span className="text-dark-300"> · {c.brand || c.operator}</span>}
              </div>
              <div className="mt-1 flex items-center gap-3 text-xs">
                <a onClick={(e) => e.stopPropagation()} className="text-accent hover:underline font-mono"
                  href={`https://maps.panopti.ca/?lat=${c.lat}&lng=${c.lon}&zoom=18`} target="_blank" rel="noopener noreferrer">
                  {c.lat.toFixed(5)}, {c.lon.toFixed(5)}
                </a>
                <a onClick={(e) => e.stopPropagation()} className="text-dark-400 hover:underline"
                  href={`https://www.openstreetmap.org/${c.osmType}/${c.osmId}`} target="_blank" rel="noopener noreferrer">
                  {c.osmType}/{c.osmId}
                </a>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
