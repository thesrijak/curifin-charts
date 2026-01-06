import { Container, Graphics } from 'pixi.js'
import { hexToPixiColor } from '../../utils/color.js'
import type { Color } from '../../types/common.types.js'

/**
 * Options for a single grid draw call.
 */
export interface GridDrawOptions {
  /** Pixel positions of horizontal grid lines (price levels) */
  horizontalLines: readonly number[]
  /** Pixel positions of vertical grid lines (time ticks) */
  verticalLines: readonly number[]
  /** Width of the drawable area */
  width: number
  /** Height of the drawable area */
  height: number
  /** Grid line color */
  color: Color
  /** Grid line opacity (0–1) */
  alpha: number
  /** Border color around the plot area */
  borderColor: Color
}

/**
 * Renders the background grid and chart border.
 * Redraws from scratch on every call — PixiJS Graphics is fast enough
 * for the small number of lines involved.
 */
export class GridLayer extends Container {
  private readonly _graphics = new Graphics()

  constructor() {
    super()
    this.label = 'grid'
    this.addChild(this._graphics)
  }

  /**
   * Clears and redraws the grid lines and border.
   */
  draw(options: GridDrawOptions): void {
    const g = this._graphics
    g.clear()

    const colorNum = typeof options.color === 'string'
      ? hexToPixiColor(options.color)
      : (options.color.r << 16) | (options.color.g << 8) | options.color.b

    // Horizontal grid lines (price levels)
    for (const y of options.horizontalLines) {
      g.moveTo(0, y)
        .lineTo(options.width, y)
        .stroke({ width: 1, color: colorNum, alpha: options.alpha })
    }

    // Vertical grid lines (time ticks)
    for (const x of options.verticalLines) {
      g.moveTo(x, 0)
        .lineTo(x, options.height)
        .stroke({ width: 1, color: colorNum, alpha: options.alpha })
    }

    // Chart border
    const borderNum = typeof options.borderColor === 'string'
      ? hexToPixiColor(options.borderColor)
      : (options.borderColor.r << 16) | (options.borderColor.g << 8) | options.borderColor.b

    g.rect(0, 0, options.width, options.height)
      .stroke({ width: 1, color: borderNum, alpha: 1 })
  }
}
