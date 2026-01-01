/**
 * Recursively makes all properties of T optional.
 * Used for partial configuration overrides throughout the library.
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

/**
 * A 2D point in logical canvas coordinates.
 * These are density-independent coordinates used for layout and interaction.
 */
export interface Point {
  readonly x: number
  readonly y: number
}

/**
 * A 2D point in device pixel coordinates.
 * Accounts for devicePixelRatio — used for actual rendering on the canvas.
 */
export interface PixelPoint {
  readonly x: number
  readonly y: number
}

/**
 * An axis-aligned rectangle in logical canvas coordinates.
 */
export interface Rect {
  readonly x: number
  readonly y: number
  readonly width: number
  readonly height: number
}

/**
 * Spacing around a region, used for chart pane layout.
 */
export interface Margin {
  readonly top: number
  readonly right: number
  readonly bottom: number
  readonly left: number
}

/**
 * RGBA color representation with channels in 0–255 range and alpha in 0–1.
 */
export interface RgbaColor {
  readonly r: number
  readonly g: number
  readonly b: number
  readonly a: number
}

/**
 * Color value accepted throughout the library.
 * - Hex string: `'#ff0000'` or `'#ff000080'` (with alpha)
 * - RGBA object: `{ r: 255, g: 0, b: 0, a: 1 }`
 */
export type Color = string | RgbaColor
