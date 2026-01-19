import { Graphics } from 'pixi.js'
import type { Rect } from '../types/common.types.js'
import type { LineData, LineSeriesOptions } from '../types/series.types.js'
import type { TimeScale } from '../scales/TimeScale.js'
import type { PriceScale } from '../scales/PriceScale.js'
import { hexToPixiColor } from '../utils/color.js'
import { BaseSeries } from './BaseSeries.js'

const DEFAULT_OPTIONS: LineSeriesOptions = {
  color: '#2196f3',
  lineWidth: 2,
  lineStyle: 'solid',
  pointMarkersVisible: false,
  pointMarkersRadius: 3,
}

function toNum(color: string | { r: number; g: number; b: number }): number {
  return typeof color === 'string'
    ? hexToPixiColor(color)
    : (color.r << 16) | (color.g << 8) | color.b
}

/**
 * Renders single-value time series data as a connected line.
 * Supports solid, dashed, and dotted line styles, plus optional point markers.
 */
export class LineSeries extends BaseSeries<LineData, LineSeriesOptions> {
  protected readonly _graphics = new Graphics()

  constructor(options?: Partial<LineSeriesOptions>) {
    super(DEFAULT_OPTIONS)
    if (options) this.setOptions(options)
    this.container.addChild(this._graphics)
  }

  protected render(timeScale: TimeScale, priceScale: PriceScale, _rect: Rect): void {
    const g = this._graphics
    g.clear()

    if (this._data.length === 0) return

    const timestamps = this._data.map((d) => d.time)
    const visible = timeScale.getVisibleBars(timestamps.length)
    if (!visible) return

    const opts = this._options
    const colorNum = toNum(opts.color)

    // Build array of screen-space points for visible range
    const points: Array<{ x: number; y: number }> = []
    for (let i = visible.from; i <= visible.to; i++) {
      const d = this._data[i]!
      const x = timeScale.timeToPixel(d.time, timestamps)
      if (isNaN(x)) continue
      const y = priceScale.priceToPixel(d.value)
      points.push({ x, y })
    }

    if (points.length < 2) return

    // Draw line
    if (opts.lineStyle === 'solid') {
      this._drawSolidLine(g, points, colorNum, opts.lineWidth)
    } else {
      const dashLength = opts.lineStyle === 'dashed' ? 6 : 2
      const gapLength = opts.lineStyle === 'dashed' ? 4 : 3
      this._drawDashedLine(g, points, colorNum, opts.lineWidth, dashLength, gapLength)
    }

    // Draw point markers
    if (opts.pointMarkersVisible) {
      for (const p of points) {
        g.circle(p.x, p.y, opts.pointMarkersRadius)
          .fill({ color: colorNum })
      }
    }
  }

  private _drawSolidLine(
    g: Graphics,
    points: readonly { x: number; y: number }[],
    color: number,
    width: number,
  ): void {
    g.moveTo(points[0]!.x, points[0]!.y)
    for (let i = 1; i < points.length; i++) {
      g.lineTo(points[i]!.x, points[i]!.y)
    }
    g.stroke({ width, color })
  }

  protected _drawDashedLine(
    g: Graphics,
    points: readonly { x: number; y: number }[],
    color: number,
    width: number,
    dashLength: number,
    gapLength: number,
  ): void {
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i]!
      const p1 = points[i + 1]!
      const dx = p1.x - p0.x
      const dy = p1.y - p0.y
      const segLen = Math.sqrt(dx * dx + dy * dy)
      if (segLen === 0) continue

      const ux = dx / segLen
      const uy = dy / segLen
      let traveled = 0
      let drawing = true

      while (traveled < segLen) {
        const step = drawing ? dashLength : gapLength
        const end = Math.min(traveled + step, segLen)

        if (drawing) {
          g.moveTo(p0.x + ux * traveled, p0.y + uy * traveled)
            .lineTo(p0.x + ux * end, p0.y + uy * end)
            .stroke({ width, color })
        }

        traveled = end
        drawing = !drawing
      }
    }
  }
}
