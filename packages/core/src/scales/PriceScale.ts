import type { AxisLabel, PriceRange } from '../types/axis.types.js'
import type { OHLCVData } from '../types/series.types.js'
import { niceNumber } from '../utils/math.js'

/** Scaling mode for the price axis. */
export type PriceScaleMode = 'normal' | 'logarithmic' | 'percentage'

/**
 * Maps data-space price values to vertical pixel positions.
 *
 * Canvas convention: y = 0 is the top of the viewport, so higher prices
 * map to lower y values.
 */
export class PriceScale {
  private _priceRange: PriceRange = { min: 0, max: 1 }
  private _containerHeight = 0
  private _mode: PriceScaleMode = 'normal'
  private _paddingTop: number
  private _paddingBottom: number
  private _basePrice = NaN

  /**
   * @param paddingTop - Top padding as a ratio of container height (0–1). @default 0.1
   * @param paddingBottom - Bottom padding as a ratio of container height (0–1). @default 0.1
   */
  constructor(paddingTop = 0.1, paddingBottom = 0.1) {
    this._paddingTop = paddingTop
    this._paddingBottom = paddingBottom
  }

  // -- Accessors --

  get priceRange(): PriceRange {
    return this._priceRange
  }

  get containerHeight(): number {
    return this._containerHeight
  }

  get mode(): PriceScaleMode {
    return this._mode
  }

  setContainerHeight(height: number): void {
    this._containerHeight = height
  }

  setMode(mode: PriceScaleMode): void {
    this._mode = mode
  }

  setPriceRange(min: number, max: number): void {
    this._priceRange = { min, max }
  }

  /**
   * Sets the base price used for percentage mode calculations.
   * Typically the close price of the first visible bar.
   */
  setBasePrice(price: number): void {
    this._basePrice = price
  }

  // -- Coordinate mapping --

  /**
   * Converts a price value to a y pixel position.
   * Higher prices produce lower y values (canvas convention).
   */
  priceToPixel(price: number): number {
    const { top, height } = this._drawableArea()
    if (height <= 0) return top

    const normalized = this._normalize(price)
    // Invert: normalized 1 (high) → top, normalized 0 (low) → bottom
    return top + (1 - normalized) * height
  }

  /**
   * Converts a y pixel position back to a price value.
   */
  pixelToPrice(pixel: number): number {
    const { top, height } = this._drawableArea()
    if (height <= 0) return this._priceRange.min

    const normalized = 1 - (pixel - top) / height
    return this._denormalize(normalized)
  }

  // -- Auto-scaling --

  /**
   * Auto-scales the price range to fit the visible OHLCV data
   * with top/bottom padding applied.
   *
   * @param visibleBars - Slice of OHLCV data currently visible on screen
   */
  autoScale(visibleBars: readonly OHLCVData[]): void {
    if (visibleBars.length === 0) return

    let min = Infinity
    let max = -Infinity

    for (const bar of visibleBars) {
      if (bar.low < min) min = bar.low
      if (bar.high > max) max = bar.high
    }

    // Avoid zero-height range
    if (min === max) {
      min = min * 0.99
      max = max * 1.01
    }

    this._priceRange = { min, max }

    // Set base price for percentage mode
    if (this._mode === 'percentage') {
      this._basePrice = visibleBars[0]!.close
    }
  }

  // -- Grid & labels --

  /**
   * Generates ~5–8 "nice" round price values for horizontal grid lines.
   */
  getGridLines(): number[] {
    const { min, max } = this._effectiveRange()
    const range = max - min
    if (range <= 0) return []

    const targetTicks = 6
    const roughStep = range / targetTicks
    const step = niceNumber(roughStep, true)

    const lines: number[] = []
    const start = Math.ceil(min / step) * step
    for (let v = start; v <= max; v += step) {
      lines.push(v)
    }

    return lines
  }

  /**
   * Returns axis labels with pixel positions for the price axis.
   */
  getAxisLabels(): AxisLabel[] {
    const gridValues = this.getGridLines()
    return gridValues.map((value) => ({
      value,
      pixelPosition: this.priceToPixel(this._mode === 'percentage' ? this._fromDisplay(value) : value),
      text: this._formatPrice(value),
    }))
  }

  // -- Internal helpers --

  /** Returns the drawable area after applying padding. */
  private _drawableArea(): { top: number; height: number } {
    const top = this._containerHeight * this._paddingTop
    const height = this._containerHeight * (1 - this._paddingTop - this._paddingBottom)
    return { top, height }
  }

  /**
   * Normalizes a price to a 0–1 range within the current price range.
   * 0 = min, 1 = max. Handles log and percentage modes.
   */
  private _normalize(price: number): number {
    const { min, max } = this._priceRange

    if (this._mode === 'logarithmic') {
      const logMin = Math.log(Math.max(min, 1e-10))
      const logMax = Math.log(Math.max(max, 1e-10))
      const logPrice = Math.log(Math.max(price, 1e-10))
      const denom = logMax - logMin
      return denom === 0 ? 0.5 : (logPrice - logMin) / denom
    }

    if (this._mode === 'percentage' && !isNaN(this._basePrice) && this._basePrice !== 0) {
      const pctPrice = ((price / this._basePrice) - 1) * 100
      const pctMin = ((min / this._basePrice) - 1) * 100
      const pctMax = ((max / this._basePrice) - 1) * 100
      const denom = pctMax - pctMin
      return denom === 0 ? 0.5 : (pctPrice - pctMin) / denom
    }

    // Normal (linear)
    const denom = max - min
    return denom === 0 ? 0.5 : (price - min) / denom
  }

  /**
   * Denormalizes a 0–1 value back to a price.
   */
  private _denormalize(normalized: number): number {
    const { min, max } = this._priceRange

    if (this._mode === 'logarithmic') {
      const logMin = Math.log(Math.max(min, 1e-10))
      const logMax = Math.log(Math.max(max, 1e-10))
      return Math.exp(logMin + normalized * (logMax - logMin))
    }

    // Linear (normal and percentage both store raw prices in _priceRange)
    return min + normalized * (max - min)
  }

  /**
   * Returns the effective display range for grid/label generation.
   * In percentage mode, returns the % range. Otherwise, the raw price range.
   */
  private _effectiveRange(): { min: number; max: number } {
    if (this._mode === 'percentage' && !isNaN(this._basePrice) && this._basePrice !== 0) {
      return {
        min: ((this._priceRange.min / this._basePrice) - 1) * 100,
        max: ((this._priceRange.max / this._basePrice) - 1) * 100,
      }
    }
    return this._priceRange
  }

  /**
   * Converts a display value back to a raw price (for percentage mode).
   */
  private _fromDisplay(displayValue: number): number {
    if (this._mode === 'percentage' && !isNaN(this._basePrice) && this._basePrice !== 0) {
      return this._basePrice * (1 + displayValue / 100)
    }
    return displayValue
  }

  /** Formats a price value for display on the axis. */
  private _formatPrice(value: number): string {
    if (this._mode === 'percentage') {
      return (value >= 0 ? '+' : '') + value.toFixed(2) + '%'
    }

    const absValue = Math.abs(value)
    if (absValue >= 1000) return value.toFixed(0)
    if (absValue >= 1) return value.toFixed(2)
    if (absValue >= 0.01) return value.toFixed(4)
    return value.toFixed(6)
  }
}
