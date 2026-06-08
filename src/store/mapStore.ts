import { create } from 'zustand';
import type { MapState, MapBounds } from '../types';

interface FlyToCommand {
  center: [number, number];
  zoom?: number;
  timestamp: number;
}

interface MapStoreState extends MapState {
  // Map interaction state
  isInteracting: boolean;
  selectedCameraId: number | null;
  showCameraLayer: boolean;
  showRouteLayer: boolean;

  // FlyTo command for map to consume
  flyToCommand: FlyToCommand | null;

  // Timeline tick callback - MapLibreContainer registers its filter handler here
  _timelineTickCallback: ((dateStr: string) => void) | null;

  // Actions
  setCenter: (center: [number, number]) => void;
  setZoom: (zoom: number) => void;
  setBounds: (bounds: MapBounds | null) => void;
  /** Batch center + zoom + bounds in a single store update (used by onMove) */
  setViewState: (center: [number, number], zoom: number, bounds: MapBounds) => void;
  setIsInteracting: (isInteracting: boolean) => void;
  setSelectedCamera: (osmId: number | null) => void;
  toggleCameraLayer: () => void;
  toggleRouteLayer: () => void;
  flyTo: (center: [number, number], zoom?: number) => void;
  clearFlyToCommand: () => void;
  fitBounds: (bounds: MapBounds) => void;
  setTimelineTickCallback: (cb: ((dateStr: string) => void) | null) => void;
}

// Default center: Geographic centre of Canada
const DEFAULT_CENTER: [number, number] = [56.1304, -106.3468];
// On mobile (< 1024px), use a lower zoom so the whole country is visible on first load
const DEFAULT_ZOOM = typeof window !== 'undefined' && window.innerWidth < 1024 ? 2.5 : 3.5;

export const useMapStore = create<MapStoreState>((set) => ({
  center: DEFAULT_CENTER,
  zoom: DEFAULT_ZOOM,
  bounds: null,
  isInteracting: false,
  selectedCameraId: null,
  showCameraLayer: true,
  showRouteLayer: true,
  flyToCommand: null,
  _timelineTickCallback: null,

  setCenter: (center: [number, number]) => {
    set({ center });
  },

  setZoom: (zoom: number) => {
    set({ zoom });
  },

  setBounds: (bounds: MapBounds | null) => {
    set({ bounds });
  },

  setViewState: (center, zoom, bounds) => {
    set({ center, zoom, bounds });
  },

  setIsInteracting: (isInteracting: boolean) => {
    set({ isInteracting });
  },

  setSelectedCamera: (osmId: number | null) => {
    set({ selectedCameraId: osmId });
  },

  toggleCameraLayer: () => {
    set((state) => ({ showCameraLayer: !state.showCameraLayer }));
  },

  toggleRouteLayer: () => {
    set((state) => ({ showRouteLayer: !state.showRouteLayer }));
  },

  flyTo: (center: [number, number], zoom?: number) => {
    set({ 
      flyToCommand: { center, zoom, timestamp: Date.now() },
      center,
      ...(zoom !== undefined && { zoom }),
    });
  },

  clearFlyToCommand: () => {
    set({ flyToCommand: null });
  },

  fitBounds: (bounds: MapBounds) => {
    set({ bounds });
  },

  setTimelineTickCallback: (cb) => set({ _timelineTickCallback: cb }),
}));

