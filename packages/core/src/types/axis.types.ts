/**
 * A single computed label on an axis, ready for rendering.
 */
export interface AxisLabel {
  /** The raw numeric value this label represents (price or unix timestamp) */
  readonly value: number
  /** Pixel offset along the axis (x for time, y for price) in logical coordinates */
  readonly pixelPosition: number
  /** Human-readable formatted string (e.g. "14:30", "$142.50") */
  readonly text: string
}

/**
 * A time range on the x-axis.
 * Both boundaries are Unix timestamps in seconds (UTC).
 */
export interface TimeRange {
  /** Start of the range (inclusive), Unix timestamp in seconds */
  readonly from: number
  /** End of the range (inclusive), Unix timestamp in seconds */
  readonly to: number
}

/**
 * A price range on the y-axis.
 */
export interface PriceRange {
  /** Lower bound of the range */
  readonly min: number
  /** Upper bound of the range */
  readonly max: number
}
