import { create } from 'zustand';
import type { ALPRCamera, CameraFilters } from '../types';
import { 
  loadBundledCameras, 
  retryLoadCameras,
  getUniqueOperators, 
  getUniqueBrands 
} from '../services/cameraDataService';
import {
  buildSpatialGrid,
  getCamerasInBoundsFromGrid,
  type SpatialGrid
} from '../utils/geo';

// ── Local-only: government CCTV nodes carry this brand label in the dataset ──
const CCTV_BRAND = 'Government CCTVs';
export type CameraTypeFilter = 'all' | 'alpr' | 'cctv';
export function applyCameraTypeFilter(list: ALPRCamera[], type: CameraTypeFilter): ALPRCamera[] {
  if (type === 'alpr') return list.filter((c) => c.brand !== CCTV_BRAND);
  if (type === 'cctv') return list.filter((c) => c.brand === CCTV_BRAND);
  return list;
}

/** Get the Monday (YYYY-MM-DD) of the ISO week containing the given ISO timestamp */
export function getWeekMonday(isoTimestamp: string): string {
  const d = new Date(isoTimestamp);
  const day = d.getUTCDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  const diff = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diff);
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// Explicit loading phase for better observability
export type CameraLoadPhase = 'idle' | 'fetching' | 'hydrating' | 'ready' | 'error';

interface CameraState {
  cameras: ALPRCamera[];
  filteredCameras: ALPRCamera[];
  spatialGrid: SpatialGrid | null;
  isLoading: boolean;
  isInitialized: boolean;
  isPreloading: boolean;
  error: string | null;
  filters: CameraFilters;
  cameraType: CameraTypeFilter;
  availableOperators: string[];
  availableBrands: string[];

  // Timeline metadata (computed once at load time)
  timelineMinDate: string;     // Earliest osmTimestamp month (YYYY-MM)
  timelineMaxDate: string;     // Latest osmTimestamp month (YYYY-MM)
  timelineMonthlyCounts: Map<string, number>;  // YYYY-MM → count
  timelineMinWeek: string;     // Earliest week Monday (YYYY-MM-DD)
  timelineMaxWeek: string;     // Latest week Monday (YYYY-MM-DD)
  timelineWeeklyCounts: Map<string, number>;   // YYYY-MM-DD (Monday) → count
  timelineMinDay: string;      // Earliest day (YYYY-MM-DD)
  timelineMaxDay: string;      // Latest day (YYYY-MM-DD)
  timelineDailyCounts: Map<string, number>;    // YYYY-MM-DD → count

  // Explicit loading phase for UI progress
  loadPhase: CameraLoadPhase;

  // Data version - increments on every filter/data change for map sync
  dataVersion: number;

  // Internal promise tracking (not exposed to components)
  _initPromise: Promise<void> | null;

  // Actions
  preloadCameras: () => void;
  initializeCameras: () => Promise<void>;
  ensureCamerasLoaded: () => Promise<void>;
  retryCameraLoad: () => Promise<void>;
  setFilters: (filters: Partial<CameraFilters>) => void;
  setCameraType: (type: CameraTypeFilter) => void;
  clearFilters: () => void;
  getCameraById: (osmId: number) => ALPRCamera | undefined;
  getCamerasInBounds: (north: number, south: number, east: number, west: number) => ALPRCamera[];

  pendingFilters: {
    brands: string[];
    operators: string[];
    surveillanceZones: string[];
    mountTypes: string[];
  };
  togglePendingFilter: (key: 'brands' | 'operators' | 'surveillanceZones' | 'mountTypes', value: string) => void;
  applyPendingFilters: () => void;
  resetAllFilters: () => void;
  getPendingChangeCount: () => number;
}

export const useCameraStore = create<CameraState>((set, get) => ({
  cameras: [],
  filteredCameras: [],
  spatialGrid: null,
  isLoading: false,
  isInitialized: false,
  isPreloading: false,
  error: null,
  filters: {
    operators: [],
    brands: [],
    surveillanceZones: [],
    mountTypes: [],
    showAll: true,
  },
  cameraType: 'alpr',
  availableOperators: [],
  availableBrands: [],
  timelineMinDate: '2017-04',
  timelineMaxDate: '2026-02',
  timelineMonthlyCounts: new Map(),
  timelineMinWeek: '2017-04-03',
  timelineMaxWeek: '2026-02-09',
  timelineWeeklyCounts: new Map(),
  timelineMinDay: '2017-04-03',
  timelineMaxDay: '2026-02-15',
  timelineDailyCounts: new Map(),
  loadPhase: 'idle',
  dataVersion: 0,
  _initPromise: null,
  pendingFilters: {
    brands: [],
    operators: [],
    surveillanceZones: [],
    mountTypes: [],
  },

  // Background preload - starts loading without blocking UI
  preloadCameras: () => {
    const { isInitialized, _initPromise, isPreloading } = get();

    // Skip if already loaded or loading
    if (isInitialized || _initPromise || isPreloading) return;

    set({ isPreloading: true, loadPhase: 'fetching' });
    get().initializeCameras().catch(() => {
      set({ isPreloading: false, loadPhase: 'idle' });
    });
  },

  initializeCameras: async () => {
    const { isInitialized, _initPromise } = get();

    if (isInitialized) return;

    if (_initPromise) return _initPromise;

    const loadPromise = (async () => {
      if (import.meta.env.DEV) {
        console.log('[CameraStore] Starting camera initialization...');
      }
      
      set({ isLoading: true, error: null, loadPhase: 'fetching' });

      try {
        if (import.meta.env.DEV) {
          console.log('[CameraStore] Fetching cameras-ca.json...');
        }
        const cameras = await loadBundledCameras();
        
        if (import.meta.env.DEV) {
          console.log(`[CameraStore] Fetch complete: ${cameras.length} cameras. Now hydrating...`);
        }
        set({ loadPhase: 'hydrating' });
        
        const operators = getUniqueOperators(cameras);
        const brands = getUniqueBrands(cameras);

        const spatialGrid = buildSpatialGrid(cameras);

        const monthlyCounts = new Map<string, number>();
        let minDate = '9999-99';
        let maxDate = '0000-00';
        for (let i = 0; i < cameras.length; i++) {
          const ts = cameras[i].osmTimestamp;
          if (ts) {
            const month = ts.slice(0, 7); // YYYY-MM
            monthlyCounts.set(month, (monthlyCounts.get(month) || 0) + 1);
            if (month < minDate) minDate = month;
            if (month > maxDate) maxDate = month;
          }
        }
        const timelineMinDate = minDate === '9999-99' ? '2017-04' : minDate;
        const timelineMaxDate = maxDate === '0000-00' ? '2026-02' : maxDate;

        // Compute weekly counts
        const weeklyCounts = new Map<string, number>();
        let minWeek = 'z'; // sorts after any date
        let maxWeek = '';
        // Compute daily counts
        const dailyCounts = new Map<string, number>();
        let minDay = 'z';
        let maxDay = '';
        for (let i = 0; i < cameras.length; i++) {
          const ts = cameras[i].osmTimestamp;
          if (ts) {
            const monday = getWeekMonday(ts);
            weeklyCounts.set(monday, (weeklyCounts.get(monday) || 0) + 1);
            if (monday < minWeek) minWeek = monday;
            if (monday > maxWeek) maxWeek = monday;
            const day = ts.slice(0, 10); // YYYY-MM-DD
            dailyCounts.set(day, (dailyCounts.get(day) || 0) + 1);
            if (day < minDay) minDay = day;
            if (day > maxDay) maxDay = day;
          }
        }
        const timelineMinWeek = minWeek === 'z' ? '2017-04-03' : minWeek;
        const timelineMaxWeek = maxWeek === '' ? '2026-02-09' : maxWeek;
        const timelineMinDay = minDay === 'z' ? '2017-04-03' : minDay;
        const timelineMaxDay = maxDay === '' ? '2026-02-15' : maxDay;

        if (import.meta.env.DEV) {
          console.log(`[CameraStore] Hydration complete. Timeline: ${timelineMinDate} to ${timelineMaxDate} (${monthlyCounts.size} months, ${weeklyCounts.size} weeks with data)`);
        }

        set((state) => ({
          cameras,
          filteredCameras: applyCameraTypeFilter(cameras, state.cameraType),
          spatialGrid,
          availableOperators: operators,
          availableBrands: brands,
          timelineMinDate,
          timelineMaxDate,
          timelineMonthlyCounts: monthlyCounts,
          timelineMinWeek,
          timelineMaxWeek,
          timelineWeeklyCounts: weeklyCounts,
          timelineMinDay,
          timelineMaxDay,
          timelineDailyCounts: dailyCounts,
          isLoading: false,
          isInitialized: true,
          isPreloading: false,
          loadPhase: 'ready',
          dataVersion: state.dataVersion + 1,
        }));
      } catch (error) {
        console.error('[CameraStore] Failed to load cameras:', error);
        set({
          error: error instanceof Error ? error.message : 'Failed to fetch cameras',
          isLoading: false,
          isPreloading: false,
          loadPhase: 'error',
          _initPromise: null,
        });
        throw error;
      }
    })();

    set({ _initPromise: loadPromise });
    return loadPromise;
  },

  ensureCamerasLoaded: async () => {
    const startTime = performance.now();
    const state = get();

    if (state.isInitialized && state.cameras.length > 0) {
      if (import.meta.env.DEV) {
        console.log(`[CameraStore] ensureCamerasLoaded: already loaded (${state.cameras.length} cameras) in ${(performance.now() - startTime).toFixed(0)}ms`);
      }
      if (state.error) {
        set({ error: null, loadPhase: 'ready' });
      }
      return;
    }

    if (state._initPromise) return state._initPromise;

    if (state.isPreloading && !state._initPromise) {
      await new Promise(resolve => setTimeout(resolve, 50));
      const updatedState = get();
      if (updatedState._initPromise) {
        return updatedState._initPromise;
      }
      if (updatedState.isInitialized && updatedState.cameras.length > 0) {
        return;
      }
    }

    if (import.meta.env.DEV) {
      console.log('[CameraStore] ensureCamerasLoaded: starting fresh initialization');
    }
    return get().initializeCameras();
  },

  retryCameraLoad: async () => {
    if (import.meta.env.DEV) {
      console.log('[CameraStore] Retry requested...');
    }
    
    set({ isLoading: true, error: null, _initPromise: null, isPreloading: false, loadPhase: 'fetching' });

    const retryPromise = (async () => {
      try {
        const cameras = await retryLoadCameras();
        
        set({ loadPhase: 'hydrating' });
        
        const operators = getUniqueOperators(cameras);
        const brands = getUniqueBrands(cameras);
        const spatialGrid = buildSpatialGrid(cameras);

        // Compute timeline metadata
        const monthlyCounts = new Map<string, number>();
        let retryMinDate = '9999-99';
        let retryMaxDate = '0000-00';
        for (let i = 0; i < cameras.length; i++) {
          const ts = cameras[i].osmTimestamp;
          if (ts) {
            const month = ts.slice(0, 7);
            monthlyCounts.set(month, (monthlyCounts.get(month) || 0) + 1);
            if (month < retryMinDate) retryMinDate = month;
            if (month > retryMaxDate) retryMaxDate = month;
          }
        }

        // Compute weekly + daily counts
        const retryWeeklyCounts = new Map<string, number>();
        let retryMinWeek = 'z';
        let retryMaxWeek = '';
        const retryDailyCounts = new Map<string, number>();
        let retryMinDay = 'z';
        let retryMaxDay = '';
        for (let i = 0; i < cameras.length; i++) {
          const ts = cameras[i].osmTimestamp;
          if (ts) {
            const monday = getWeekMonday(ts);
            retryWeeklyCounts.set(monday, (retryWeeklyCounts.get(monday) || 0) + 1);
            if (monday < retryMinWeek) retryMinWeek = monday;
            if (monday > retryMaxWeek) retryMaxWeek = monday;
            const day = ts.slice(0, 10);
            retryDailyCounts.set(day, (retryDailyCounts.get(day) || 0) + 1);
            if (day < retryMinDay) retryMinDay = day;
            if (day > retryMaxDay) retryMaxDay = day;
          }
        }

        if (import.meta.env.DEV) {
          console.log(`[CameraStore] Retry successful: ${cameras.length} cameras`);
        }

        set((state) => ({
          cameras,
          filteredCameras: applyCameraTypeFilter(cameras, state.cameraType),
          spatialGrid,
          availableOperators: operators,
          availableBrands: brands,
          timelineMinDate: retryMinDate === '9999-99' ? '2017-04' : retryMinDate,
          timelineMaxDate: retryMaxDate === '0000-00' ? '2026-02' : retryMaxDate,
          timelineMonthlyCounts: monthlyCounts,
          timelineMinWeek: retryMinWeek === 'z' ? '2017-04-03' : retryMinWeek,
          timelineMaxWeek: retryMaxWeek === '' ? '2026-02-09' : retryMaxWeek,
          timelineWeeklyCounts: retryWeeklyCounts,
          timelineMinDay: retryMinDay === 'z' ? '2017-04-03' : retryMinDay,
          timelineMaxDay: retryMaxDay === '' ? '2026-02-15' : retryMaxDay,
          timelineDailyCounts: retryDailyCounts,
          isLoading: false,
          isInitialized: true,
          isPreloading: false,
          loadPhase: 'ready',
          dataVersion: state.dataVersion + 1,
        }));
      } catch (error) {
        console.error('[CameraStore] Retry failed:', error);
        set({
          error: error instanceof Error ? error.message : 'Failed to fetch cameras',
          isLoading: false,
          isPreloading: false,
          loadPhase: 'error',
          _initPromise: null,
        });
        throw error;
      }
    })();

    set({ _initPromise: retryPromise });
    return retryPromise;
  },

  setFilters: (newFilters: Partial<CameraFilters>) => {
    const { cameras, filters, dataVersion, cameraType } = get();
    const updatedFilters = { ...filters, ...newFilters };

    // Apply filters
    let filtered = cameras;

    // Timeline filter: only show cameras added up to the selected date
    if (updatedFilters.timelineDate) {
      const cutoff = updatedFilters.timelineDate + 'T23:59:59Z';
      filtered = filtered.filter(
        (c) => !c.osmTimestamp || c.osmTimestamp <= cutoff
      );
    }

    // ALPR / Government-CCTV scope (always applies, independent of showAll)
    filtered = applyCameraTypeFilter(filtered, cameraType);

    if (!updatedFilters.showAll) {
      if (updatedFilters.operators.length > 0) {
        filtered = filtered.filter(
          (c) => c.operator && updatedFilters.operators.includes(c.operator)
        );
      }

      if (updatedFilters.brands.length > 0) {
        filtered = filtered.filter(
          (c) => c.brand && updatedFilters.brands.includes(c.brand)
        );
      }

      if (updatedFilters.surveillanceZones.length > 0) {
        filtered = filtered.filter(
          (c) => c.surveillanceZone && updatedFilters.surveillanceZones.includes(c.surveillanceZone)
        );
      }

      if (updatedFilters.mountTypes.length > 0) {
        filtered = filtered.filter(
          (c) => c.mountType && updatedFilters.mountTypes.includes(c.mountType)
        );
      }
    }

    // Increment dataVersion so map source updates even if React diffing skips it
    // Clear any existing error when filters change
    set({
      filters: updatedFilters,
      filteredCameras: filtered,
      dataVersion: dataVersion + 1,
      error: null,
    });
  },

  // Top-level scope toggle: show ALPRs + CCTV ('all'), just ALPRs, or just CCTV.
  // Re-applies the currently-active detailed filters on top of the new scope.
  setCameraType: (type: CameraTypeFilter) => {
    const { cameras, filters, dataVersion } = get();
    let filtered = cameras;

    if (filters.timelineDate) {
      const cutoff = filters.timelineDate + 'T23:59:59Z';
      filtered = filtered.filter((c) => !c.osmTimestamp || c.osmTimestamp <= cutoff);
    }

    filtered = applyCameraTypeFilter(filtered, type);

    if (!filters.showAll) {
      if (filters.operators.length > 0) filtered = filtered.filter((c) => c.operator && filters.operators.includes(c.operator));
      if (filters.brands.length > 0) filtered = filtered.filter((c) => c.brand && filters.brands.includes(c.brand));
      if (filters.surveillanceZones.length > 0) filtered = filtered.filter((c) => c.surveillanceZone && filters.surveillanceZones.includes(c.surveillanceZone));
      if (filters.mountTypes.length > 0) filtered = filtered.filter((c) => c.mountType && filters.mountTypes.includes(c.mountType));
    }

    set({ cameraType: type, filteredCameras: filtered, dataVersion: dataVersion + 1, error: null });
  },

  clearFilters: () => {
    const { cameras, cameraType } = get();
    set({
      filters: {
        operators: [],
        brands: [],
        surveillanceZones: [],
        mountTypes: [],
        showAll: true,
        timelineDate: undefined,
      },
      filteredCameras: applyCameraTypeFilter(cameras, cameraType),
    });
  },

  togglePendingFilter: (key, value) => {
    const { pendingFilters } = get();
    const current = pendingFilters[key];
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    set({ pendingFilters: { ...pendingFilters, [key]: next } });
  },

  applyPendingFilters: () => {
    const { pendingFilters, cameras, filters, dataVersion, cameraType } = get();
    const hasAnyFilter =
      pendingFilters.brands.length > 0 ||
      pendingFilters.operators.length > 0 ||
      pendingFilters.surveillanceZones.length > 0 ||
      pendingFilters.mountTypes.length > 0;

    const updatedFilters: CameraFilters = {
      ...filters,
      brands: pendingFilters.brands,
      operators: pendingFilters.operators,
      surveillanceZones: pendingFilters.surveillanceZones,
      mountTypes: pendingFilters.mountTypes,
      showAll: !hasAnyFilter,
    };

    let filtered = cameras;

    if (updatedFilters.timelineDate) {
      const cutoff = updatedFilters.timelineDate + 'T23:59:59Z';
      filtered = filtered.filter((c) => !c.osmTimestamp || c.osmTimestamp <= cutoff);
    }

    filtered = applyCameraTypeFilter(filtered, cameraType);

    if (!updatedFilters.showAll) {
      if (updatedFilters.brands.length > 0) {
        filtered = filtered.filter((c) => c.brand && updatedFilters.brands.includes(c.brand));
      }
      if (updatedFilters.operators.length > 0) {
        filtered = filtered.filter((c) => c.operator && updatedFilters.operators.includes(c.operator));
      }
      if (updatedFilters.surveillanceZones.length > 0) {
        filtered = filtered.filter((c) => c.surveillanceZone && updatedFilters.surveillanceZones.includes(c.surveillanceZone));
      }
      if (updatedFilters.mountTypes.length > 0) {
        filtered = filtered.filter((c) => c.mountType && updatedFilters.mountTypes.includes(c.mountType));
      }
    }

    set({
      filters: updatedFilters,
      filteredCameras: filtered,
      dataVersion: dataVersion + 1,
      error: null,
    });
  },

  resetAllFilters: () => {
    const { cameras, cameraType } = get();
    set({
      pendingFilters: { brands: [], operators: [], surveillanceZones: [], mountTypes: [] },
      filters: {
        operators: [],
        brands: [],
        surveillanceZones: [],
        mountTypes: [],
        showAll: true,
        timelineDate: undefined,
      },
      filteredCameras: applyCameraTypeFilter(cameras, cameraType),
    });
  },

  getPendingChangeCount: () => {
    const { pendingFilters, filters } = get();
    let count = 0;
    for (const key of ['brands', 'operators', 'surveillanceZones', 'mountTypes'] as const) {
      const pending = new Set(pendingFilters[key]);
      const applied = new Set(filters[key]);
      for (const v of pending) if (!applied.has(v)) count++;
      for (const v of applied) if (!pending.has(v)) count++;
    }
    return count;
  },

  getCameraById: (osmId: number) => {
    return get().cameras.find((c) => c.osmId === osmId);
  },

  // Get cameras within a bounding box using spatial grid (O(1) lookup vs O(n) scan)
  getCamerasInBounds: (north: number, south: number, east: number, west: number) => {
    const { spatialGrid, cameras } = get();
    
    // Use spatial grid for fast lookup if available
    if (spatialGrid) {
      return getCamerasInBoundsFromGrid(spatialGrid, north, south, east, west);
    }
    
    // Fallback to linear scan
    return cameras.filter(
      (c) => c.lat >= south && c.lat <= north && c.lon >= west && c.lon <= east
    );
  },
}));
