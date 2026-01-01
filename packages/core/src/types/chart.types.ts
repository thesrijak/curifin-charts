import type { Color, DeepPartial, Margin } from './common.types.js'
import type { LineStyle } from './series.types.js'

/**
 * Color theme for the entire chart.
 * Controls background, grid, text, and interaction element colors.
 */
export interface ChartTheme {
  /** Canvas background color */
  backgroundColor: Color
  /** Grid line color */
  gridColor: Color
  /** Grid line opacity (0–1). @default 0.15 */
  gridAlpha: number
  /** Color for axis labels and other text */
  textColor: Color
  /** Crosshair line color */
  crosshairColor: Color
  /** Crosshair line opacity (0–1). @default 0.6 */
  crosshairAlpha: number
  /** Chart border color (around the plot area) */
  borderColor: Color
}

/** Crosshair interaction mode. */
export type CrosshairMode = 'normal' | 'magnet' | 'hidden'

/**
 * Appearance options for a single crosshair line (horizontal or vertical).
 */
export interface CrosshairLineOptions {
  /** Whether this crosshair line is visible. @default true */
  visible: boolean
  /** Line color. Falls back to the theme crosshairColor if not set. */
  color: Color
  /** Line width in logical pixels. @default 1 */
  width: number
  /** Dash style. @default 'dashed' */
  style: LineStyle
  /** Whether to show the axis label at the crosshair intersection. @default true */
  labelVisible: boolean
}

/**
 * Full crosshair configuration.
 */
export interface CrosshairOptions {
  /** Crosshair behavior mode. @default 'normal' */
  mode: CrosshairMode
  /** Vertical (time axis) crosshair line options */
  vertLine: CrosshairLineOptions
  /** Horizontal (price axis) crosshair line options */
  horzLine: CrosshairLineOptions
}

/**
 * Watermark displayed behind the chart content.
 */
export interface WatermarkOptions {
  /** Whether the watermark is visible. @default false */
  visible: boolean
  /** Watermark text content */
  text: string
  /** Text color */
  color: Color
  /** Font size in logical pixels. @default 48 */
  fontSize: number
}

/**
 * Time scale (x-axis) configuration.
 */
export interface TimeScaleOptions {
  /** Whether the time axis is visible. @default true */
  visible: boolean
  /** Seconds of blank space to the right of the last data point. @default 20 */
  rightOffset: number
  /** Minimum bar spacing in logical pixels. @default 2 */
  minBarSpacing: number
  /** Pixel width allocated per bar. @default 8 */
  barSpacing: number
  /** Whether to fix the left edge when new data arrives. @default false */
  fixLeftEdge: boolean
  /** Whether to fix the right edge when new data arrives. @default false */
  fixRightEdge: boolean
}

/**
 * Price scale (y-axis) configuration.
 */
export interface PriceScaleOptions {
  /** Whether the price axis is visible. @default true */
  visible: boolean
  /** Position of the price axis. @default 'right' */
  position: 'left' | 'right'
  /** Whether to auto-scale to fit visible data. @default true */
  autoScale: boolean
  /** Whether to invert the price axis (high at bottom). @default false */
  invertScale: boolean
  /** Top margin as a ratio of the pane height (0–1). @default 0.1 */
  scaleMarginTop: number
  /** Bottom margin as a ratio of the pane height (0–1). @default 0.1 */
  scaleMarginBottom: number
}

/**
 * Top-level chart configuration.
 * All option fields accept `DeepPartial` when passed to the chart constructor,
 * so consumers only need to specify the values they want to override.
 */
export interface ChartOptions {
  /** Chart width in logical pixels. Ignored when `autoSize` is true. */
  width: number
  /** Chart height in logical pixels. Ignored when `autoSize` is true. */
  height: number
  /** Automatically resize the chart to fill its container. @default true */
  autoSize: boolean
  /** Color theme */
  theme: ChartTheme
  /** Time scale (x-axis) options */
  timeScale: TimeScaleOptions
  /** Price scale (y-axis) options */
  priceScale: PriceScaleOptions
  /** Crosshair options */
  crosshair: CrosshairOptions
  /** Layout spacing around the plot area */
  layout: Margin
  /** Background watermark */
  watermark: WatermarkOptions
}

/**
 * Partial chart options accepted by the chart constructor and update methods.
 * Consumers only need to specify the fields they want to override.
 */
export type ChartOptionsInput = DeepPartial<ChartOptions>
