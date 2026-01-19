import { Container } from 'pixi.js'
import type { Rect } from '../types/common.types.js'
import type { TimeScale } from '../scales/TimeScale.js'
import type { PriceScale } from '../scales/PriceScale.js'
import { deepMerge } from '../utils/math.js'

/**
 * Abstract base class for all chart series.
 *
 * @typeParam TData - Data point type (e.g. OHLCVData, LineData)
 * @typeParam TOptions - Series-specific options type
 */
export abstract class BaseSeries<TData, TOptions extends object> {
  readonly id: string
  readonly container: Container

  protected _data: TData[] = []
  protected _options: TOptions
  private _needsRender = true

  constructor(defaultOptions: TOptions) {
    this.id = crypto.randomUUID()
    this.container = new Container()
    this.container.label = this.id
    this._options = { ...defaultOptions }
  }

  // -- Accessors --

  get data(): readonly TData[] {
    return this._data
  }

  get options(): Readonly<TOptions> {
    return this._options
  }

  get visible(): boolean {
    return this.container.visible
  }

  // -- Data management --

  /**
   * Replaces the entire data array and marks the series for re-render.
   */
  setData(data: TData[]): void {
    this._data = data
    this._needsRender = true
  }

  /**
   * Appends a new data point or replaces the last one.
   * Used for real-time streaming updates.
   *
   * @param point - The data point to append or replace
   * @param replace - If true, replaces the last point instead of appending
   */
  update(point: TData, replace = false): void {
    if (replace && this._data.length > 0) {
      this._data[this._data.length - 1] = point
    } else {
      this._data.push(point)
    }
    this._needsRender = true
  }

  // -- Options --

  /**
   * Deep-merges partial options into the current options and marks for re-render.
   */
  setOptions(partial: Partial<TOptions>): void {
    this._options = deepMerge(
      this._options as Record<string, unknown>,
      partial as Record<string, unknown>,
    ) as TOptions
    this._needsRender = true
  }

  // -- Visibility --

  /**
   * Toggles the visibility of this series.
   */
  setVisible(visible: boolean): void {
    this.container.visible = visible
  }

  // -- Rendering --

  /**
   * Renders the series if it has been marked dirty.
   * Called by the chart on each frame.
   */
  renderIfNeeded(timeScale: TimeScale, priceScale: PriceScale, rect: Rect): void {
    if (!this._needsRender) return
    this._needsRender = false
    this.render(timeScale, priceScale, rect)
  }

  /**
   * Forces a re-render on the next frame.
   */
  markDirty(): void {
    this._needsRender = true
  }

  /**
   * Subclasses implement this to draw their data using PixiJS primitives.
   */
  protected abstract render(timeScale: TimeScale, priceScale: PriceScale, rect: Rect): void

  // -- Lifecycle --

  /**
   * Destroys the PixiJS container and all its children, releasing GPU resources.
   */
  destroy(): void {
    this.container.destroy({ children: true })
  }
}
