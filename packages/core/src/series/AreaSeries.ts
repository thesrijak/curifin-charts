import { FillGradient, Graphics } from 'pixi.js'
import type { Rect } from '../types/common.types.js'
import type { LineData, AreaSeriesOptions } from '../types/series.types.js'
import type { TimeScale } from '../scales/TimeScale.js'
import type { PriceScale } from '../scales/PriceScale.js'
import { hexToPixiColor } from '../utils/color.js'
import { withAlpha } from '../utils/color.js'
import { rgbaToHex } from '../utils/color.js'
import { BaseSeries } from './BaseSeries.js'

const DEFAULT_OPTIONS: AreaSeriesOptions = {
  color: '#2196f3',
  lineWidth: 2,
  lineStyle: 'solid',
  pointMarkersVisible: false,
  pointMarkersRadius: 3,
  topColor: '#2196f3',
  bottomColor: '#2196f3',
  fillOpacity: 0.4,
}

function toNum(color: string | { r: number; g: number; b: number }): number {
  return typeof color === 'string'
    ? hexToPixiColor(color)
    : (color.r << 16) | (color.g << 8) | color.b
}

function toHexString(color: string | { r: number; g: number; b: number; a: number }): string {
  return typeof color === 'string' ? color : rgbaToHex(color)
}

/**
 * Renders single-value time series data as a line with a gradient-filled
 * area beneath it.
 */
export class AreaSeries extends BaseSeries<LineData, AreaSeriesOptions> {
  private readonly _lineGraphics = new Graphics()
  private readonly _fillGraphics = new Graphics()

  constructor(options?: Partial<AreaSeriesOptions>) {
    super(DEFAULT_OPTIONS)
    if (options) this.setOptions(options)
    // Fill behind line
    this.container.addChild(this._fillGraphics)
    this.container.addChild(this._lineGraphics)
  }

  protected render(timeScale: TimeScale, priceScale: PriceScale, rect: Rect): void {
    this._lineGraphics.clear()
    this._fillGraphics.clear()

    if (this._data.length === 0) return

    const timestamps = this._data.map((d) => d.time)
    const visible = timeScale.getVisibleBars(timestamps.length)
    if (!visible) return

    const opts = this._options
    const colorNum = toNum(opts.color)

    // Build screen-space points
    const points: Array<{ x: number; y: number }> = []
    for (let i = visible.from; i <= visible.to; i++) {
      const d = this._data[i]!
      const x = timeScale.timeToPixel(d.time, timestamps)
      if (isNaN(x)) continue
      const y = priceScale.priceToPixel(d.value)
      points.push({ x, y })
    }

    if (points.length < 2) return

    // -- Draw the filled area --
    const bottomY = rect.y + rect.height

    const topRgba = withAlpha(toHexString(opts.topColor), opts.fillOpacity)
    const bottomRgba = withAlpha(toHexString(opts.bottomColor), 0)

    const gradient = new FillGradient({
      type: 'linear',
      start: { x: 0, y: 0 },
      end: { x: 0, y: 1 },
      colorStops: [
        { offset: 0, color: rgbaToHex(topRgba) },
        { offset: 1, color: rgbaToHex(bottomRgba) },
      ],
      textureSpace: 'local',
    })

    // Build closed polygon: line points → bottom-right → bottom-left
    const fg = this._fillGraphics
    fg.moveTo(points[0]!.x, points[0]!.y)
    for (let i = 1; i < points.length; i++) {
      fg.lineTo(points[i]!.x, points[i]!.y)
    }
    fg.lineTo(points[points.length - 1]!.x, bottomY)
    fg.lineTo(points[0]!.x, bottomY)
    fg.closePath()
    fg.fill(gradient)

    // -- Draw the line on top --
    const lg = this._lineGraphics
    lg.moveTo(points[0]!.x, points[0]!.y)
    for (let i = 1; i < points.length; i++) {
      lg.lineTo(points[i]!.x, points[i]!.y)
    }
    lg.stroke({ width: opts.lineWidth, color: colorNum })

    // Point markers
    if (opts.pointMarkersVisible) {
      for (const p of points) {
        lg.circle(p.x, p.y, opts.pointMarkersRadius)
          .fill({ color: colorNum })
      }
    }
  }
}
