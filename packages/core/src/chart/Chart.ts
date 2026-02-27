import { Graphics } from 'pixi.js'
import type { ChartOptions, ChartOptionsInput } from '../types/chart.types.js'
import type { CandlestickSeriesOptions, LineSeriesOptions, AreaSeriesOptions } from '../types/series.types.js'
import type { Rect } from '../types/common.types.js'
import { Renderer } from '../renderer/Renderer.js'
import { TimeScale } from '../scales/TimeScale.js'
import { PriceScale } from '../scales/PriceScale.js'
import { TimeAxis } from '../axes/TimeAxis.js'
import { PriceAxis } from '../axes/PriceAxis.js'
import { Crosshair } from '../interaction/Crosshair.js'
import { InteractionManager } from '../interaction/InteractionManager.js'
import { CandlestickSeries } from '../series/CandlestickSeries.js'
import { LineSeries } from '../series/LineSeries.js'
import { AreaSeries } from '../series/AreaSeries.js'
import { BaseSeries } from '../series/BaseSeries.js'
import { mergeChartOptions } from './ChartOptions.js'
import { computeLayout } from './ChartLayout.js'
import { createRenderScheduler } from '../utils/throttle.js'

type CrosshairMoveHandler = (data: { time: number; price: number; x: number; y: number }) => void
type QueuedAction = () => void

/**
 * The central chart orchestrator. Owns and coordinates all subsystems:
 * renderer, scales, axes, series, crosshair, and interaction.
 *
 * Use the static `Chart.create()` factory for async initialization,
 * or `new Chart()` which queues operations until PixiJS is ready.
 */
export class Chart {
  private _options: ChartOptions
  private _renderer = new Renderer()
  private _timeScale: TimeScale
  private _priceScale: PriceScale
  private _timeAxis!: TimeAxis
  private _priceAxis!: PriceAxis
  private _crosshair!: Crosshair
  private _clipMask!: Graphics
  private _interaction = new InteractionManager()
  private _series = new Map<string, BaseSeries<unknown, object>>()
  private _container: HTMLElement
  private _resizeObserver: ResizeObserver | null = null
  private _scheduler!: ReturnType<typeof createRenderScheduler>
  private _destroyed = false

  // Async readiness
  private _ready: Promise<void>
  private _queue: QueuedAction[] = []
  private _initialized = false

  // External subscribers
  private _crosshairMoveHandlers = new Set<CrosshairMoveHandler>()

  constructor(container: HTMLElement, options?: ChartOptionsInput) {
    this._container = container
    this._options = mergeChartOptions(options)

    this._timeScale = new TimeScale(
      this._options.timeScale.barSpacing,
      this._options.timeScale.rightOffset,
      0,
      this._options.timeScale.minBarSpacing,
    )

    this._priceScale = new PriceScale(
      this._options.priceScale.scaleMarginTop,
      this._options.priceScale.scaleMarginBottom,
    )

    this._ready = this._init()
  }

  /**
   * Async factory method. Returns a fully initialized Chart.
   */
  static async create(
    container: HTMLElement,
    options?: ChartOptionsInput,
  ): Promise<Chart> {
    const chart = new Chart(container, options)
    await chart._ready
    return chart
  }

  // -- Async init --

  private async _init(): Promise<void> {
    const opts = this._options
    const rect = this._container.getBoundingClientRect()
    const width = opts.autoSize ? rect.width : opts.width
    const height = opts.autoSize ? rect.height : opts.height

    // 1. Initialize renderer
    await this._renderer.init({
      container: this._container,
      width,
      height,
      backgroundColor: opts.theme.backgroundColor,
    })

    // 2. Set scale dimensions
    this._timeScale.setContainerWidth(width)
    this._priceScale.setContainerHeight(height)

    // 3. Create clip mask for chart pane (prevents series/grid bleeding into axes)
    this._clipMask = new Graphics()
    this._renderer.gridLayer.mask = this._clipMask
    this._renderer.seriesLayer.mask = this._clipMask
    this._renderer.overlayLayer.mask = this._clipMask

    // 4. Create axes
    this._timeAxis = new TimeAxis(opts.theme.textColor, opts.theme.borderColor)
    this._priceAxis = new PriceAxis(
      opts.priceScale.position,
      opts.theme.textColor,
      opts.theme.borderColor,
    )
    this._renderer.uiLayer.addChild(this._timeAxis)
    this._renderer.uiLayer.addChild(this._priceAxis)

    // 5. Create crosshair
    this._crosshair = new Crosshair({
      lineColor: opts.theme.crosshairColor,
      lineAlpha: opts.theme.crosshairAlpha,
    })
    this._crosshair.setMode(opts.crosshair.mode)
    this._renderer.overlayLayer.addChild(this._crosshair)

    // 6. Create interaction manager
    const canvas = this._renderer.canvas!
    this._interaction.attach(canvas)
    this._wireInteraction()

    // 7. rAF scheduler
    this._scheduler = createRenderScheduler(() => this._renderFrame())

    // 8. ResizeObserver
    if (opts.autoSize) {
      this._resizeObserver = new ResizeObserver((entries) => {
        const entry = entries[0]
        if (!entry) return
        const { width: w, height: h } = entry.contentRect
        this.resize(w, h)
      })
      this._resizeObserver.observe(this._container)
    }

    // 9. Mark ready and flush queue
    this._initialized = true
    for (const action of this._queue) action()
    this._queue = []

    // 10. Initial render
    this._scheduleRender()
  }

  /** Queues an action or runs it immediately if initialized. */
  private _whenReady(action: QueuedAction): void {
    if (this._initialized) {
      action()
    } else {
      this._queue.push(action)
    }
  }

  // -- Series management --

  addCandlestickSeries(options?: Partial<CandlestickSeriesOptions>): CandlestickSeries {
    const series = new CandlestickSeries(options)
    this._registerSeries(series)
    return series
  }

  addLineSeries(options?: Partial<LineSeriesOptions>): LineSeries {
    const series = new LineSeries(options)
    this._registerSeries(series)
    return series
  }

  addAreaSeries(options?: Partial<AreaSeriesOptions>): AreaSeries {
    const series = new AreaSeries(options)
    this._registerSeries(series)
    return series
  }

  removeSeries(series: BaseSeries<unknown, object>): void {
    this._whenReady(() => {
      this._series.delete(series.id)
      this._renderer.seriesLayer.remove(series.id)
      series.destroy()
      this._scheduleRender()
    })
  }

  private _registerSeries(series: BaseSeries<unknown, object>): void {
    this._series.set(series.id, series)
    this._whenReady(() => {
      const container = this._renderer.seriesLayer.add(series.id)
      container.addChild(series.container)
      this._scheduleRender()
    })
  }

  // -- Public API --

  /**
   * Merges partial options and re-renders.
   */
  applyOptions(options: ChartOptionsInput): void {
    this._options = mergeChartOptions({
      ...this._options,
      ...options,
    } as ChartOptionsInput)

    this._whenReady(() => {
      this._timeAxis.setColors(this._options.theme.textColor, this._options.theme.borderColor)
      this._priceAxis.setColors(this._options.theme.textColor, this._options.theme.borderColor)
      this._priceAxis.setSide(this._options.priceScale.position)
      this._crosshair.setMode(this._options.crosshair.mode)
      this._scheduleRender()
    })
  }

  /**
   * Returns the TimeScale for external manipulation.
   */
  getTimeScale(): TimeScale {
    return this._timeScale
  }

  /**
   * Returns the PriceScale for external manipulation.
   */
  getPriceScale(): PriceScale {
    return this._priceScale
  }

  /**
   * Manually resizes the chart.
   */
  resize(width: number, height: number): void {
    this._whenReady(() => {
      this._renderer.resize(width, height)
      this._timeScale.setContainerWidth(width)
      this._priceScale.setContainerHeight(height)
      this._scheduleRender()
    })
  }

  // -- Subscriptions --

  subscribeCrosshairMove(handler: CrosshairMoveHandler): void {
    this._crosshairMoveHandlers.add(handler)
  }

  unsubscribeCrosshairMove(handler: CrosshairMoveHandler): void {
    this._crosshairMoveHandlers.delete(handler)
  }

  // -- Interaction wiring --

  private _wireInteraction(): void {
    this._interaction.on('pan', ({ deltaX }) => {
      this._timeScale.pan(deltaX)
      this._autoScaleIfNeeded()
      this._scheduleRender()
    })

    this._interaction.on('zoom', ({ delta, anchorX }) => {
      const totalBars = this._getTotalBars()
      const scaleFactor = 1 - delta
      this._timeScale.zoom(scaleFactor, anchorX, totalBars)
      this._autoScaleIfNeeded()
      this._scheduleRender()
    })

    this._interaction.on('crosshairMove', ({ x, y }) => {
      this._handleCrosshairMove(x, y)
    })

    this._interaction.on('crosshairLeave', () => {
      this._crosshair.hide()
      this._scheduleRender()
    })
  }

  private _handleCrosshairMove(x: number, y: number): void {
    const layout = this._computeLayout()
    const pane = layout.chartPane

    // Clamp to chart pane
    const cx = Math.max(pane.x, Math.min(x, pane.x + pane.width))
    const cy = Math.max(pane.y, Math.min(y, pane.y + pane.height))

    // Convert pixel to data coordinates
    const timestamps = this._getAllTimestamps()
    let snapX = cx

    if (this._crosshair.mode === 'magnet' && timestamps.length > 0) {
      snapX = this._crosshair.magnetSnap(
        cx,
        timestamps,
        (t) => this._timeScale.timeToPixel(t, timestamps),
      )
    }

    const time = this._timeScale.pixelToTime(snapX, timestamps)
    const price = this._priceScale.pixelToPrice(cy)

    // Format labels
    const timeLabel = isNaN(time) ? '' : this._formatTimeForCrosshair(time)
    const priceLabel = isNaN(price) ? '' : price.toFixed(2)

    this._crosshair.show(
      snapX, cy,
      priceLabel, timeLabel,
      pane,
      layout.priceAxis.x,
      layout.timeAxis.y,
    )

    // Notify external subscribers
    for (const handler of this._crosshairMoveHandlers) {
      handler({ time, price, x: snapX, y: cy })
    }

    this._scheduleRender()
  }

  // -- Render pipeline --

  private _scheduleRender(): void {
    if (this._destroyed || !this._initialized) return
    this._scheduler.schedule()
  }

  private _renderFrame(): void {
    if (this._destroyed || !this._initialized) return

    const layout = this._computeLayout()
    const pane = layout.chartPane

    // Auto-scale price to visible data
    this._autoScaleIfNeeded()

    // Grid
    const priceGridLines = this._priceScale.getGridLines()
    const priceGridPixels = priceGridLines.map((v) => this._priceScale.priceToPixel(v))

    const timestamps = this._getAllTimestamps()
    const timeLabels = this._timeScale.getTimeLabels(timestamps)
    const timeGridPixels = timeLabels.map((l) => l.pixelPosition)

    this._renderer.gridLayer.draw({
      horizontalLines: priceGridPixels,
      verticalLines: timeGridPixels,
      width: pane.width,
      height: pane.height,
      color: this._options.theme.gridColor,
      alpha: this._options.theme.gridAlpha,
      borderColor: this._options.theme.borderColor,
    })

    // Position grid layer
    this._renderer.gridLayer.x = pane.x
    this._renderer.gridLayer.y = pane.y

    // Update clip mask to chart pane bounds (absolute stage coordinates)
    this._clipMask.clear()
    this._clipMask.rect(pane.x, pane.y, pane.width, pane.height).fill({ color: 0xffffff })

    // Series
    this._renderer.seriesLayer.x = pane.x
    this._renderer.seriesLayer.y = pane.y

    const seriesRect: Rect = { x: 0, y: 0, width: pane.width, height: pane.height }
    for (const series of this._series.values()) {
      series.renderIfNeeded(this._timeScale, this._priceScale, seriesRect)
    }

    // Time axis
    if (this._options.timeScale.visible) {
      this._timeAxis.x = layout.timeAxis.x
      this._timeAxis.y = layout.timeAxis.y
      this._timeAxis.draw(timeLabels, pane.width)
      this._timeAxis.visible = true
    } else {
      this._timeAxis.visible = false
    }

    // Price axis
    if (this._options.priceScale.visible) {
      this._priceAxis.x = layout.priceAxis.x
      this._priceAxis.y = layout.priceAxis.y
      const axisLabels = this._priceScale.getAxisLabels()
      this._priceAxis.draw(axisLabels, pane.height)
      this._priceAxis.visible = true

      // Last price label
      this._drawLastPriceLabel()
    } else {
      this._priceAxis.visible = false
    }
  }

  private _drawLastPriceLabel(): void {
    // Find the first candlestick series for last price
    for (const series of this._series.values()) {
      if (series instanceof CandlestickSeries && series.data.length > 0) {
        const lastBar = series.data[series.data.length - 1]!
        const bullish = lastBar.close >= lastBar.open
        const opts = series.options

        this._priceAxis.drawLastPrice({
          price: lastBar.close,
          pixelPosition: this._priceScale.priceToPixel(lastBar.close),
          backgroundColor: bullish ? opts.upColor : opts.downColor,
          textColor: '#ffffff',
        })
        return
      }
    }
    this._priceAxis.drawLastPrice(null)
  }

  // -- Helpers --

  private _computeLayout() {
    const size = this._renderer.getSize()
    return computeLayout(
      size.width,
      size.height,
      this._options.priceScale.position,
      this._options.priceScale.visible,
      this._options.timeScale.visible,
      this._options.layout,
    )
  }

  private _autoScaleIfNeeded(): void {
    if (!this._options.priceScale.autoScale) return

    const timestamps = this._getAllTimestamps()
    const visible = this._timeScale.getVisibleBars(timestamps.length)
    if (!visible) return

    // Collect visible OHLCV data from candlestick series
    for (const series of this._series.values()) {
      if (series instanceof CandlestickSeries && series.data.length > 0) {
        const visibleBars = series.data.slice(visible.from, visible.to + 1)
        this._priceScale.autoScale(visibleBars)
        // Mark all series dirty after auto-scale changes price range
        for (const s of this._series.values()) s.markDirty()
        return
      }
    }

    // Fallback: auto-scale from line/area data
    for (const series of this._series.values()) {
      if ((series instanceof LineSeries || series instanceof AreaSeries) && series.data.length > 0) {
        const visibleData = series.data.slice(visible.from, visible.to + 1)
        if (visibleData.length === 0) continue
        let min = Infinity
        let max = -Infinity
        for (const d of visibleData) {
          if (d.value < min) min = d.value
          if (d.value > max) max = d.value
        }
        if (min === max) { min *= 0.99; max *= 1.01 }
        this._priceScale.setPriceRange(min, max)
        for (const s of this._series.values()) s.markDirty()
        return
      }
    }
  }

  private _getAllTimestamps(): number[] {
    for (const series of this._series.values()) {
      if (series instanceof CandlestickSeries && series.data.length > 0) {
        return series.data.map((d) => d.time)
      }
      if ((series instanceof LineSeries || series instanceof AreaSeries) && series.data.length > 0) {
        return series.data.map((d) => d.time)
      }
    }
    return []
  }

  private _getTotalBars(): number {
    return this._getAllTimestamps().length
  }

  private _formatTimeForCrosshair(unix: number): string {
    const d = new Date(unix * 1000)
    const pad = (n: number) => (n < 10 ? '0' + n : String(n))
    return (
      pad(d.getUTCHours()) + ':' + pad(d.getUTCMinutes()) + ' ' +
      pad(d.getUTCDate()) + '/' + pad(d.getUTCMonth() + 1) + '/' + d.getUTCFullYear()
    )
  }

  // -- Destroy --

  /**
   * Tears down everything in reverse initialization order.
   */
  destroy(): void {
    if (this._destroyed) return
    this._destroyed = true

    this._scheduler?.cancel()
    this._resizeObserver?.disconnect()
    this._interaction.destroy()

    for (const series of this._series.values()) {
      series.destroy()
    }
    this._series.clear()
    this._crosshairMoveHandlers.clear()

    this._renderer.destroy()
  }
}
