import type { ALPRCamera } from '../types';
import { t } from '../i18n';

const EARTH_RADIUS_METERS = 6371000;

// ============================================================================
// SPATIAL GRID INDEX - Fast camera lookups by geographic area
// ============================================================================

/**
 * Simple spatial grid for fast camera lookups.
 * Divides the US into a grid of cells for O(1) lookups instead of O(n) filtering.
 * Grid size of 0.5 degrees ≈ 55km at equator, ~35km at US latitudes
 */
const GRID_SIZE = 0.5; // degrees

export interface SpatialGrid {
  cells: Map<string, ALPRCamera[]>;
  gridSize: number;
}

let cachedSpatialGrid: SpatialGrid | null = null;

function getCellKey(lat: number, lon: number): string {
  const gridLat = Math.floor(lat / GRID_SIZE);
  const gridLon = Math.floor(lon / GRID_SIZE);
  return `${gridLat},${gridLon}`;
}

/**
 * Build a spatial grid from cameras for fast lookups
 */
export function buildSpatialGrid(cameras: ALPRCamera[]): SpatialGrid {
  // Always rebuild from the supplied cameras — short-circuiting on the cached
  // grid made reloads/retries (a new camera array) serve stale positions.

  const cells = new Map<string, ALPRCamera[]>();

  for (const camera of cameras) {
    const key = getCellKey(camera.lat, camera.lon);
    const existing = cells.get(key);
    if (existing) {
      existing.push(camera);
    } else {
      cells.set(key, [camera]);
    }
  }

  cachedSpatialGrid = { cells, gridSize: GRID_SIZE };
  return cachedSpatialGrid;
}

/**
 * Get cameras in a bounding box using spatial grid (much faster than linear scan)
 */
export function getCamerasInBoundsFromGrid(
  grid: SpatialGrid,
  north: number,
  south: number,
  east: number,
  west: number
): ALPRCamera[] {
  const result: ALPRCamera[] = [];

  // Calculate grid cells that overlap with bounds
  const minGridLat = Math.floor(south / GRID_SIZE);
  const maxGridLat = Math.floor(north / GRID_SIZE);
  const minGridLon = Math.floor(west / GRID_SIZE);
  const maxGridLon = Math.floor(east / GRID_SIZE);

  for (let gridLat = minGridLat; gridLat <= maxGridLat; gridLat++) {
    for (let gridLon = minGridLon; gridLon <= maxGridLon; gridLon++) {
      const key = `${gridLat},${gridLon}`;
      const cellCameras = grid.cells.get(key);
      if (cellCameras) {
        // Filter cameras within cell to those actually in bounds
        for (const camera of cellCameras) {
          if (camera.lat >= south && camera.lat <= north &&
              camera.lon >= west && camera.lon <= east) {
            result.push(camera);
          }
        }
      }
    }
  }

  return result;
}

/**
 * Clear cached spatial grid (for testing or when data changes)
 */
export function clearSpatialGridCache(): void {
  cachedSpatialGrid = null;
}

/**
 * Calculate the Haversine distance between two points in meters
 */
export function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_METERS * c;
}

/**
 * Convert degrees to radians
 */
function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Format meters to human-readable distance
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} ${t('x_unit_meters')}`;
  }
  const miles = meters / 1609.34;
  return `${miles.toFixed(1)} ${t('x_unit_miles')}`;
}

/**
 * Format seconds to human-readable duration
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${Math.round(seconds)} ${t('x_unit_seconds')}`;
  }
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes} ${t('x_unit_minutes')}`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}${t('x_unit_hours')} ${remainingMinutes}${t('x_unit_minutes_short')}`;
}
