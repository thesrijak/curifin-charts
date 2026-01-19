import { Graphics } from 'pixi.js'
import type { Rect } from '../types/common.types.js'
import type { OHLCVData, CandlestickSeriesOptions } from '../types/series.types.js'
import type { TimeScale } from '../scales/TimeScale.js'
import type { PriceScale } from '../scales/PriceScale.js'
import { hexToPixiColor } from '../utils/color.js'
import { BaseSeries } from './BaseSeries.js'

const DEFAULT_OPTIONS: CandlestickSeriesOptions = {
  upColor: '#26a69a',
  downColor: '#ef5350',
  wickUpColor: '#26a69a',
  wickDownColor: '#ef5350',
  borderUpColor: '#26a69a',
  borderDownColor: '#ef5350',
  wickVisible: true,
  borderVisible: true,
  barSpacingRatio: 0.8,
}

function toNum(color: string | { r: number; g: number; b: number }): number {
  return typeof color === 'string'
    ? hexToPixiColor(color)
    : (color.r << 16) | (color.g << 8) | color.b
}

/**
 * Renders OHLCV data as candlesticks.
 *
 * Uses a single PixiJS Graphics object for all candles to minimize
 * draw calls and maximize performance.
 */
export class CandlestickSeries extends BaseSeries<OHLCVData, CandlestickSeriesOptions> {
  private readonly _graphics = new Graphics()

  constructor(options?: Partial<CandlestickSeriesOptions>) {
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
    const upFill = toNum(opts.upColor)
    const downFill = toNum(opts.downColor)
    const wickUp = toNum(opts.wickUpColor)
    const wickDown = toNum(opts.wickDownColor)
    const borderUp = toNum(opts.borderUpColor)
    const borderDown = toNum(opts.borderDownColor)

    const barSpacing = timeScale.barSpacing
    const candleWidth = Math.max(1, barSpacing * opts.barSpacingRatio)
    const halfCandle = candleWidth / 2

    for (let i = visible.from; i <= visible.to; i++) {
      const bar = this._data[i]!
      const bullish = bar.close >= bar.open

      const x = timeScale.timeToPixel(bar.time, timestamps)
      if (isNaN(x)) continue

      const yOpen = priceScale.priceToPixel(bar.open)
      const yClose = priceScale.priceToPixel(bar.close)
      const yHigh = priceScale.priceToPixel(bar.high)
      const yLow = priceScale.priceToPixel(bar.low)

      const bodyTop = Math.min(yOpen, yClose)
      const bodyHeight = Math.max(1, Math.abs(yClose - yOpen))

      // Wick (high to low, thin vertical line)
      if (opts.wickVisible) {
        g.moveTo(x, yHigh)
          .lineTo(x, yLow)
          .stroke({ width: 1, color: bullish ? wickUp : wickDown })
      }

      // Body (filled rectangle)
      g.rect(x - halfCandle, bodyTop, candleWidth, bodyHeight)
        .fill({ color: bullish ? upFill : downFill })

      // Border (only when candles are wide enough to see it)
      if (opts.borderVisible && candleWidth > 2) {
        g.rect(x - halfCandle, bodyTop, candleWidth, bodyHeight)
          .stroke({ width: 1, color: bullish ? borderUp : borderDown })
      }
    }
  }
}
