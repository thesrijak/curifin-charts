import type {
  ChartOptions,
  ChartOptionsInput,
  ChartTheme,
} from '../types/chart.types.js'
import { deepMerge } from '../utils/math.js'

/** Professional dark theme for trading charts. */
export const DEFAULT_DARK_THEME: ChartTheme = {
  backgroundColor: '#131722',
  gridColor: '#363c4e',
  gridAlpha: 0.15,
  textColor: '#787b86',
  crosshairColor: '#758696',
  crosshairAlpha: 0.6,
  borderColor: '#2a2e39',
}

/** Clean light theme for trading charts. */
export const DEFAULT_LIGHT_THEME: ChartTheme = {
  backgroundColor: '#ffffff',
  gridColor: '#e0e3eb',
  gridAlpha: 0.25,
  textColor: '#131722',
  crosshairColor: '#9598a1',
  crosshairAlpha: 0.6,
  borderColor: '#e0e3eb',
}

/** Full default chart options with dark theme applied. */
export const DEFAULT_CHART_OPTIONS: ChartOptions = {
  width: 800,
  height: 500,
  autoSize: true,
  theme: DEFAULT_DARK_THEME,
  timeScale: {
    visible: true,
    rightOffset: 20,
    minBarSpacing: 2,
    barSpacing: 8,
    fixLeftEdge: false,
    fixRightEdge: false,
  },
  priceScale: {
    visible: true,
    position: 'right',
    autoScale: true,
    invertScale: false,
    scaleMarginTop: 0.1,
    scaleMarginBottom: 0.1,
  },
  crosshair: {
    mode: 'normal',
    vertLine: {
      visible: true,
      color: '#758696',
      width: 1,
      style: 'dashed',
      labelVisible: true,
    },
    horzLine: {
      visible: true,
      color: '#758696',
      width: 1,
      style: 'dashed',
      labelVisible: true,
    },
  },
  layout: {
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  watermark: {
    visible: false,
    text: '',
    color: '#787b86',
    fontSize: 48,
  },
}

/**
 * Merges partial chart options with the full defaults.
 * Returns a complete ChartOptions object.
 */
export function mergeChartOptions(partial?: ChartOptionsInput): ChartOptions {
  if (!partial) return { ...DEFAULT_CHART_OPTIONS }
  return deepMerge(
    DEFAULT_CHART_OPTIONS as unknown as Record<string, unknown>,
    partial as Record<string, unknown>,
  ) as unknown as ChartOptions
}
