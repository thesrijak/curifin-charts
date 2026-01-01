import type { Color } from './common.types.js'

/**
 * OHLCV bar data for candlestick and bar series.
 * Time is a Unix timestamp in seconds (UTC).
 */
export interface OHLCVData {
  /** Unix timestamp in seconds (UTC) */
  readonly time: number
  readonly open: number
  readonly high: number
  readonly low: number
  readonly close: number
  /** Trading volume for the period. Optional — omit if unavailable. */
  readonly volume?: number
}

/**
 * Single-value time series data point for line, area, and histogram series.
 * Time is a Unix timestamp in seconds (UTC).
 */
export interface LineData {
  /** Unix timestamp in seconds (UTC) */
  readonly time: number
  readonly value: number
}

/** Discriminated union of all supported series types. */
export type SeriesType = 'candlestick' | 'line' | 'area' | 'bar' | 'histogram'

/** Line dash style for line-based series. */
export type LineStyle = 'solid' | 'dashed' | 'dotted'

/**
 * Appearance options for candlestick series.
 */
export interface CandlestickSeriesOptions {
  /** Fill color for bullish (close >= open) candles */
  upColor: Color
  /** Fill color for bearish (close < open) candles */
  downColor: Color
  /** Wick color for bullish candles. Defaults to `upColor` if not set. */
  wickUpColor: Color
  /** Wick color for bearish candles. Defaults to `downColor` if not set. */
  wickDownColor: Color
  /** Border color for bullish candles. Defaults to `upColor` if not set. */
  borderUpColor: Color
  /** Border color for bearish candles. Defaults to `downColor` if not set. */
  borderDownColor: Color
  /** Whether to draw the wick line. @default true */
  wickVisible: boolean
  /** Whether to draw the candle body border. @default true */
  borderVisible: boolean
  /**
   * Ratio of candle body width to the allocated bar spacing (0–1).
   * A value of 0.8 means the body occupies 80% of the bar slot.
   * @default 0.8
   */
  barSpacingRatio: number
}

/**
 * Appearance options for line series.
 */
export interface LineSeriesOptions {
  /** Line color */
  color: Color
  /** Line width in logical pixels. @default 2 */
  lineWidth: number
  /** Dash style of the line. @default 'solid' */
  lineStyle: LineStyle
  /** Whether to draw circular markers at each data point. @default false */
  pointMarkersVisible: boolean
  /** Radius of point markers in logical pixels. @default 3 */
  pointMarkersRadius: number
}

/**
 * Appearance options for area series.
 * Extends line options with a gradient fill beneath the line.
 */
export interface AreaSeriesOptions extends LineSeriesOptions {
  /** Gradient top color (at the line). */
  topColor: Color
  /** Gradient bottom color (at the chart bottom). */
  bottomColor: Color
  /** Opacity of the gradient fill (0–1). @default 0.4 */
  fillOpacity: number
}
