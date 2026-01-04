import type { RgbaColor } from '../types/common.types.js'

/**
 * Normalizes a hex color string to a 6-character uppercase hex (without `#`).
 * Handles `#rgb`, `#rrggbb`, `rgb`, and `rrggbb` inputs.
 */
function normalizeHex(hex: string): string {
  let h = hex.startsWith('#') ? hex.slice(1) : hex

  if (h.length === 3 || h.length === 4) {
    h = h
      .slice(0, 3)
      .split('')
      .map((c) => c + c)
      .join('')
  }

  return h.slice(0, 6).toUpperCase()
}

/**
 * Converts a CSS hex color string to a PixiJS-compatible numeric color (0xRRGGBB).
 * Accepts `#rgb`, `#rrggbb`, `#rrggbbaa`, or without `#`.
 *
 * @example
 * hexToPixiColor('#ff0000') // 0xFF0000
 * hexToPixiColor('#f00')    // 0xFF0000
 */
export function hexToPixiColor(hex: string): number {
  return parseInt(normalizeHex(hex), 16)
}

/**
 * Converts a CSS hex color string to an RgbaColor object.
 * If the hex string includes an alpha channel (`#rrggbbaa` or `#rgba`),
 * it is parsed; otherwise alpha defaults to 1.
 *
 * @example
 * hexToRGBA('#ff000080') // { r: 255, g: 0, b: 0, a: 0.502 }
 * hexToRGBA('#f00')      // { r: 255, g: 0, b: 0, a: 1 }
 */
export function hexToRGBA(hex: string): RgbaColor {
  let h = hex.startsWith('#') ? hex.slice(1) : hex

  // Expand shorthand (#rgba or #rgb)
  if (h.length === 3 || h.length === 4) {
    h = h
      .split('')
      .map((c) => c + c)
      .join('')
  }

  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  const a = h.length >= 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1

  return { r, g, b, a }
}

/**
 * Converts an RgbaColor object to a CSS hex string.
 * Alpha is included only if it is not 1.
 *
 * @example
 * rgbaToHex({ r: 255, g: 0, b: 0, a: 1 })   // '#ff0000'
 * rgbaToHex({ r: 255, g: 0, b: 0, a: 0.5 })  // '#ff000080'
 */
export function rgbaToHex(color: RgbaColor): string {
  const r = color.r.toString(16).padStart(2, '0')
  const g = color.g.toString(16).padStart(2, '0')
  const b = color.b.toString(16).padStart(2, '0')

  if (color.a < 1) {
    const a = Math.round(color.a * 255)
      .toString(16)
      .padStart(2, '0')
    return `#${r}${g}${b}${a}`
  }

  return `#${r}${g}${b}`
}

/**
 * Returns a new color with the specified alpha value applied.
 * Accepts a CSS hex string or RgbaColor, always returns an RgbaColor.
 *
 * @param color - Hex string or RgbaColor
 * @param alpha - Alpha value (0–1)
 *
 * @example
 * withAlpha('#ff0000', 0.5) // { r: 255, g: 0, b: 0, a: 0.5 }
 */
export function withAlpha(color: string | RgbaColor, alpha: number): RgbaColor {
  const rgba = typeof color === 'string' ? hexToRGBA(color) : color
  return { r: rgba.r, g: rgba.g, b: rgba.b, a: alpha }
}
