import type { ColorSchemeId } from '../../store/appModeStore';

export interface ColorScheme {
  id: ColorSchemeId;
  name: string;
  // MapLibre heatmap-color interpolation stops: [weight, color] pairs
  stops: [number, string][];
  // CSS gradient for preview swatches
  gradient: string;
}

export const COLOR_SCHEMES: Record<ColorSchemeId, ColorScheme> = {
  neon: {
    id: 'neon',
    name: 'Neon',
    stops: [
      [0, 'rgba(0,0,0,0)'],
      [0.2, '#1e3a5f'],
      [0.4, '#00bcd4'],
      [0.6, '#f59e0b'],
      [0.8, '#ef4444'],
      [1, '#ff1744'],
    ],
    gradient: 'linear-gradient(90deg, #1e3a5f, #00bcd4, #f59e0b, #ef4444, #ff1744)',
  },
  thermal: {
    id: 'thermal',
    name: 'Thermal',
    stops: [
      [0, 'rgba(0,0,0,0)'],
      [0.2, '#4a148c'],
      [0.4, '#1565c0'],
      [0.6, '#2e7d32'],
      [0.8, '#f9a825'],
      [1, '#ffffff'],
    ],
    gradient: 'linear-gradient(90deg, #4a148c, #1565c0, #2e7d32, #f9a825, #ffffff)',
  },
  inferno: {
    id: 'inferno',
    name: 'Inferno',
    stops: [
      [0, 'rgba(0,0,0,0)'],
      [0.2, '#1a0000'],
      [0.4, '#8b0000'],
      [0.6, '#e65100'],
      [0.8, '#fdd835'],
      [1, '#ffffff'],
    ],
    gradient: 'linear-gradient(90deg, #1a0000, #8b0000, #e65100, #fdd835, #ffffff)',
  },
  classic: {
    id: 'classic',
    name: 'Classic',
    stops: [
      [0, 'rgba(0,0,0,0)'],
      [0.2, '#0d47a1'],
      [0.4, '#00acc1'],
      [0.6, '#4caf50'],
      [0.8, '#ffeb3b'],
      [1, '#f44336'],
    ],
    gradient: 'linear-gradient(90deg, #0d47a1, #00acc1, #4caf50, #ffeb3b, #f44336)',
  },
  plasma: {
    id: 'plasma',
    name: 'Plasma',
    stops: [
      [0, 'rgba(0,0,0,0)'],
      [0.05, '#0d0887'],
      [0.15, '#7e03a8'],
      [0.35, '#cc4778'],
      [0.6, '#f89540'],
      [1, '#f0f921'],
    ],
    gradient: 'linear-gradient(90deg, #0d0887, #7e03a8, #cc4778, #f89540, #f0f921)',
  },
  viridis: {
    id: 'viridis',
    name: 'Viridis',
    stops: [
      [0, 'rgba(0,0,0,0)'],
      [0.05, '#440154'],
      [0.15, '#31688e'],
      [0.35, '#35b779'],
      [0.6, '#90d743'],
      [1, '#fde725'],
    ],
    gradient: 'linear-gradient(90deg, #440154, #31688e, #35b779, #90d743, #fde725)',
  },
};

/**
 * Build a MapLibre heatmap-color expression from a color scheme.
 */
export function buildHeatmapColorExpression(schemeId: ColorSchemeId) {
  const scheme = COLOR_SCHEMES[schemeId];
  const expr: unknown[] = ['interpolate', ['linear'], ['heatmap-density']];
  for (const [weight, color] of scheme.stops) {
    expr.push(weight, color);
  }
  return expr as maplibregl.ExpressionSpecification;
}
