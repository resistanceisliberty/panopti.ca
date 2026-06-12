import { create } from 'zustand';

export type AppMode = 'map' | 'route' | 'explore' | 'density' | 'network';
export type ExploreFeature = 'heatmap'; // extend: | 'density-3d' | 'timeline' | 'score' | 'demographics'

export type DensityLevel = 'state' | 'county';
export type DensityMetric = 'perCapita' | 'perRoadMile';
export type DensityViewMode = '2d' | '3d';
export type DensityColorScheme = 'warm' | 'inferno' | 'viridis' | 'magma';
export type DensityHeightScale = 'sqrt' | 'log' | 'linear';

export interface DensitySettings {
  level: DensityLevel;
  metric: DensityMetric;
  viewMode: DensityViewMode;
  opacity: number;
  colorScheme: DensityColorScheme;
  heightScale: DensityHeightScale;
}

export type ColorSchemeId = 'neon' | 'thermal' | 'inferno' | 'classic' | 'plasma' | 'viridis';
export type MapVisualizationType = 'heatmap' | 'dots';
export type MapTileStyleId = 'dark' | 'dark-nolabels' | 'light' | 'light-nolabels' | 'white' | 'white-nolabels' | 'black' | 'black-nolabels' | 'grayscale' | 'grayscale-nolabels';

export interface HeatmapSettings {
  intensity: number;
  radius: number;
  opacity: number;
  colorScheme: ColorSchemeId;      // ALPR heatmap palette
  cctvColorScheme: ColorSchemeId;  // government CCTV heatmap palette (shown alongside ALPRs in "Both")
  showMarkers: boolean;
}

export interface DotDensitySettings {
  radius: number;          // dot size in px (1-6)
  opacity: number;         // per-dot opacity (0.05-0.5) — stacks visually in dense areas
  color: string;           // dot color hex
  showMarkers: boolean;
}

export interface TimelineSettings {
  currentDate: string;    // ISO date string for slider position (YYYY-MM-DD)
  isPlaying: boolean;     // Auto-advance animation state
  playSpeed: number;      // Days per second (7, 14, 28, 45)
}

const DEFAULT_DENSITY_SETTINGS: DensitySettings = {
  level: 'county',
  metric: 'perRoadMile',
  viewMode: '2d',
  opacity: 0.85,
  colorScheme: 'warm',
  heightScale: 'sqrt',
};

const DEFAULT_HEATMAP_SETTINGS: HeatmapSettings = {
  intensity: 1.0,
  radius: 10,
  opacity: 0.85,
  colorScheme: 'plasma',       // ALPRs
  cctvColorScheme: 'classic',  // government CCTVs — distinct from the ALPR palette by default
  showMarkers: false,
};

const DEFAULT_DOT_DENSITY_SETTINGS: DotDensitySettings = {
  radius: 2,
  opacity: 0.25,
  color: '#4DA6FF',
  showMarkers: false,
};

const TIMELINE_START = '2024-07-01';

const DEFAULT_TIMELINE_SETTINGS: TimelineSettings = {
  currentDate: TIMELINE_START,
  isPlaying: false,
  playSpeed: 45,
};

interface AppModeState {
  appMode: AppMode;
  exploreFeature: ExploreFeature;
  mapVisualization: MapVisualizationType;
  setAppMode: (mode: AppMode) => void;
  setExploreFeature: (feature: ExploreFeature) => void;
  setMapVisualization: (type: MapVisualizationType) => void;

  heatmapSettings: HeatmapSettings;
  updateHeatmapSettings: (settings: Partial<HeatmapSettings>) => void;

  dotDensitySettings: DotDensitySettings;
  updateDotDensitySettings: (settings: Partial<DotDensitySettings>) => void;

  timelineSettings: TimelineSettings;
  updateTimelineSettings: (settings: Partial<TimelineSettings>) => void;

  densitySettings: DensitySettings;
  updateDensitySettings: (settings: Partial<DensitySettings>) => void;

  mapTileStyle: MapTileStyleId;
  setMapTileStyle: (style: MapTileStyleId) => void;
}

export const useAppModeStore = create<AppModeState>((set) => ({
  appMode: 'map',
  exploreFeature: 'heatmap',
  mapVisualization: 'heatmap',
  setAppMode: (mode) => {
    if (mode === 'explore') {
      // Default to today so all cameras are visible (no timeline filtering).
      // The /timeline route explicitly overrides this to '2024-07-01'.
      set({
        appMode: mode,
        timelineSettings: {
          currentDate: new Date().toISOString().slice(0, 10),
          isPlaying: false,
          playSpeed: DEFAULT_TIMELINE_SETTINGS.playSpeed,
        },
      });
    } else {
      set((state) => ({
        appMode: mode,
        timelineSettings: { ...state.timelineSettings, isPlaying: false },
      }));
    }
  },
  setExploreFeature: (feature) => set({ exploreFeature: feature }),
  setMapVisualization: (type) => set((state) => ({
    mapVisualization: type,
    timelineSettings: { ...state.timelineSettings, isPlaying: false },
  })),

  heatmapSettings: DEFAULT_HEATMAP_SETTINGS,
  updateHeatmapSettings: (settings) =>
    set((state) => ({
      heatmapSettings: { ...state.heatmapSettings, ...settings },
    })),

  dotDensitySettings: DEFAULT_DOT_DENSITY_SETTINGS,
  updateDotDensitySettings: (settings) =>
    set((state) => ({
      dotDensitySettings: { ...state.dotDensitySettings, ...settings },
    })),

  timelineSettings: DEFAULT_TIMELINE_SETTINGS,
  updateTimelineSettings: (settings) =>
    set((state) => ({
      timelineSettings: { ...state.timelineSettings, ...settings },
    })),

  densitySettings: DEFAULT_DENSITY_SETTINGS,
  updateDensitySettings: (settings) =>
    set((state) => ({
      densitySettings: { ...state.densitySettings, ...settings },
    })),

  mapTileStyle: 'light',
  setMapTileStyle: (style) => set({ mapTileStyle: style }),
}));
