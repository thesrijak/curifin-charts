import type { AxisLabel } from '../types/axis.types.js'
import { clamp } from '../utils/math.js'

const MIN_BAR_SPACING = 1
const MAX_BAR_SPACING = 200

/** Index range of bars currently visible in the viewport. */
export interface VisibleBarRange {
  /** Index of the first visible bar (inclusive) */
  readonly from: number
  /** Index of the last visible bar (inclusive) */
  readonly to: number
}

/**
 * Time label formatting tier, selected based on current zoom level.
 * As the user zooms in, labels shift from coarse (year) to fine (seconds).
 */
type TimeTier = 'seconds' | 'minutes' | 'hours' | 'days' | 'months' | 'years'

/**
 * Maps data-space timestamps to horizontal pixel positions.
 *
 * The coordinate system works right-to-left: the rightmost bar sits at
 * `containerWidth - rightOffset * barSpacing`, and earlier bars extend
 * leftward. This keeps the most recent data anchored to the right edge.
 */
export class TimeScale {
  private _barSpacing: number
  private _rightOffset: number
  private _containerWidth: number
  private _minBarSpacing: number

  constructor(
    barSpacing = 8,
    rightOffset = 20,
    containerWidth = 0,
    minBarSpacing = 2,
  ) {
    this._barSpacing = clamp(barSpacing, MIN_BAR_SPACING, MAX_BAR_SPACING)
    this._rightOffset = rightOffset
    this._containerWidth = containerWidth
    this._minBarSpacing = Math.max(MIN_BAR_SPACING, minBarSpacing)
  }

  // -- Accessors --

  get barSpacing(): number {
    return this._barSpacing
  }

  get rightOffset(): number {
    return this._rightOffset
  }

  get containerWidth(): number {
    return this._containerWidth
  }

  setContainerWidth(width: number): void {
    this._containerWidth = width
  }

  setBarSpacing(spacing: number): void {
    this._barSpacing = clamp(spacing, this._minBarSpacing, MAX_BAR_SPACING)
  }

  setRightOffset(offset: number): void {
    this._rightOffset = offset
  }

  // -- Coordinate mapping --

  /**
   * Converts a timestamp to an x pixel position.
   *
   * @param time - Unix timestamp in seconds
   * @param timestamps - Sorted array of all data timestamps
   * @returns x position in logical pixels, or `NaN` if time is not found
   */
  timeToPixel(time: number, timestamps: readonly number[]): number {
    const index = this._findIndex(time, timestamps)
    if (index === -1) return NaN
    return this._indexToPixel(index, timestamps.length)
  }

  /**
   * Converts an x pixel position back to the nearest timestamp.
   *
   * @param pixel - x position in logical pixels
   * @param timestamps - Sorted array of all data timestamps
   * @returns The nearest timestamp, or `NaN` if no data
   */
  pixelToTime(pixel: number, timestamps: readonly number[]): number {
    if (timestamps.length === 0) return NaN

    const index = this._pixelToIndex(pixel, timestamps.length)
    const clamped = clamp(Math.round(index), 0, timestamps.length - 1)
    return timestamps[clamped]!
  }

  /**
   * Returns the index range of bars visible in the current viewport.
   *
   * @param totalBars - Total number of data bars
   * @returns Visible range, or `null` if no bars are visible
   */
  getVisibleBars(totalBars: number): VisibleBarRange | null {
    if (totalBars === 0) return null

    const rightIndex = this._pixelToIndex(this._containerWidth, totalBars)
    const leftIndex = this._pixelToIndex(0, totalBars)

    const from = clamp(Math.floor(Math.min(leftIndex, rightIndex)), 0, totalBars - 1)
    const to = clamp(Math.ceil(Math.max(leftIndex, rightIndex)), 0, totalBars - 1)

    if (from > totalBars - 1 || to < 0) return null

    return { from, to }
  }

  // -- Interaction --

  /**
   * Adjusts bar spacing (zoom) centered on an anchor pixel position.
   * The data point under the cursor stays visually stationary.
   *
   * @param scaleFactor - Multiplier for bar spacing (> 1 zooms in, < 1 zooms out)
   * @param anchorPixel - x pixel position to anchor the zoom around
   * @param totalBars - Total number of data bars
   */
  zoom(scaleFactor: number, anchorPixel: number, totalBars: number): void {
    const anchorIndex = this._pixelToIndex(anchorPixel, totalBars)
    const newSpacing = clamp(
      this._barSpacing * scaleFactor,
      this._minBarSpacing,
      MAX_BAR_SPACING,
    )

    if (newSpacing === this._barSpacing) return

    this._barSpacing = newSpacing

    // Recalculate rightOffset so the bar under the anchor stays at the same pixel
    const lastIndex = totalBars - 1
    const barsFromRight = lastIndex - anchorIndex
    const pixelFromRight = this._containerWidth - anchorPixel
    this._rightOffset = (pixelFromRight / this._barSpacing) - barsFromRight
  }

  /**
   * Pans the view by a pixel delta (positive = scroll right / show older data).
   *
   * @param deltaPixels - Horizontal pixel distance to pan
   */
  pan(deltaPixels: number): void {
    this._rightOffset += deltaPixels / this._barSpacing
  }

  // -- Label generation --

  /**
   * Generates time axis labels that are spaced to avoid overlap.
   * Label formatting adapts to the current zoom level.
   *
   * @param timestamps - Sorted array of all data timestamps
   * @param minLabelSpacing - Minimum pixel gap between label centers. @default 80
   */
  getTimeLabels(
    timestamps: readonly number[],
    minLabelSpacing = 80,
  ): AxisLabel[] {
    const visible = this.getVisibleBars(timestamps.length)
    if (!visible) return []

    const tier = this._selectTier(timestamps, visible)
    const labels: AxisLabel[] = []
    let lastPixel = -Infinity

    for (let i = visible.from; i <= visible.to; i++) {
      const time = timestamps[i]!
      const pixel = this._indexToPixel(i, timestamps.length)

      if (pixel - lastPixel < minLabelSpacing) continue

      const text = formatTime(time, tier)
      labels.push({ value: time, pixelPosition: pixel, text })
      lastPixel = pixel
    }

    return labels
  }

  // -- Internal helpers --

  /** Maps a bar index to an x pixel position. */
  private _indexToPixel(index: number, totalBars: number): number {
    const lastIndex = totalBars - 1
    const barsFromRight = lastIndex - index
    return this._containerWidth - (this._rightOffset + barsFromRight) * this._barSpacing
  }

  /** Maps an x pixel position to a fractional bar index. */
  private _pixelToIndex(pixel: number, totalBars: number): number {
    const lastIndex = totalBars - 1
    const barsFromRight = (this._containerWidth - pixel) / this._barSpacing - this._rightOffset
    return lastIndex - barsFromRight
  }

  /** Binary search for a timestamp in a sorted array. Returns -1 if not found. */
  private _findIndex(time: number, timestamps: readonly number[]): number {
    let lo = 0
    let hi = timestamps.length - 1

    while (lo <= hi) {
      const mid = (lo + hi) >>> 1
      const midVal = timestamps[mid]!

      if (midVal === time) return mid
      if (midVal < time) lo = mid + 1
      else hi = mid - 1
    }

    return -1
  }

  /** Selects the formatting tier based on the time span of visible bars. */
  private _selectTier(
    timestamps: readonly number[],
    visible: VisibleBarRange,
  ): TimeTier {
    const span = timestamps[visible.to]! - timestamps[visible.from]!

    if (span <= 300) return 'seconds'        // ≤ 5 minutes
    if (span <= 7200) return 'minutes'       // ≤ 2 hours
    if (span <= 172800) return 'hours'       // ≤ 2 days
    if (span <= 5184000) return 'days'       // ≤ 60 days
    if (span <= 63072000) return 'months'    // ≤ 2 years
    return 'years'
  }
}

/** Formats a unix timestamp based on the selected tier. */
function formatTime(unix: number, tier: TimeTier): string {
  const d = new Date(unix * 1000)

  switch (tier) {
    case 'seconds':
      return pad(d.getUTCHours()) + ':' + pad(d.getUTCMinutes()) + ':' + pad(d.getUTCSeconds())
    case 'minutes':
      return pad(d.getUTCHours()) + ':' + pad(d.getUTCMinutes())
    case 'hours':
      return pad(d.getUTCHours()) + ':00'
    case 'days':
      return pad(d.getUTCDate()) + ' ' + MONTHS[d.getUTCMonth()]!
    case 'months':
      return MONTHS[d.getUTCMonth()]! + ' ' + d.getUTCFullYear()
    case 'years':
      return String(d.getUTCFullYear())
  }
}

function pad(n: number): string {
  return n < 10 ? '0' + n : String(n)
}

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
] as const
