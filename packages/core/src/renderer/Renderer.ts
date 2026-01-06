import { Application, Container } from 'pixi.js'
import type { Color } from '../types/common.types.js'
import { hexToPixiColor } from '../utils/color.js'
import { GridLayer } from './layers/GridLayer.js'
import { SeriesLayer } from './layers/SeriesLayer.js'
import { OverlayLayer } from './layers/OverlayLayer.js'

/**
 * Options for initializing the renderer.
 */
export interface RendererOptions {
  /** DOM element to append the canvas into */
  container: HTMLElement
  /** Canvas width in logical pixels */
  width: number
  /** Canvas height in logical pixels */
  height: number
  /** Background color */
  backgroundColor: Color
}

/**
 * PixiJS v8 application wrapper that manages the rendering pipeline.
 *
 * Stage layer order (bottom to top):
 * 1. **grid** — background grid lines and chart border
 * 2. **series** — candlesticks, lines, areas, etc.
 * 3. **overlay** — crosshairs, tooltips, highlights
 * 4. **ui** — axis labels, watermarks, other UI chrome
 */
export class Renderer {
  private _app: Application | null = null
  private _container: HTMLElement | null = null

  private _gridLayer!: GridLayer
  private _seriesLayer!: SeriesLayer
  private _overlayLayer!: OverlayLayer
  private _uiLayer!: Container

  /** Whether init() has been called successfully. */
  get initialized(): boolean {
    return this._app !== null
  }

  get gridLayer(): GridLayer {
    return this._gridLayer
  }

  get seriesLayer(): SeriesLayer {
    return this._seriesLayer
  }

  get overlayLayer(): OverlayLayer {
    return this._overlayLayer
  }

  get uiLayer(): Container {
    return this._uiLayer
  }

  get canvas(): HTMLCanvasElement | null {
    return this._app?.canvas ?? null
  }

  /**
   * Initializes the PixiJS application and appends the canvas to the container.
   * Must be called before any rendering.
   */
  async init(options: RendererOptions): Promise<void> {
    if (this._app) return

    const bgColor = typeof options.backgroundColor === 'string'
      ? hexToPixiColor(options.backgroundColor)
      : (options.backgroundColor.r << 16) | (options.backgroundColor.g << 8) | options.backgroundColor.b

    const app = new Application()
    await app.init({
      width: options.width,
      height: options.height,
      antialias: true,
      autoDensity: true,
      resolution: globalThis.devicePixelRatio ?? 1,
      preference: 'webgl',
      backgroundColor: bgColor,
    })

    this._app = app
    this._container = options.container

    // Append canvas to the provided DOM container
    options.container.appendChild(app.canvas)

    // Build the layer stack (order matters — first added = bottom)
    this._gridLayer = new GridLayer()
    this._seriesLayer = new SeriesLayer()
    this._overlayLayer = new OverlayLayer()
    this._uiLayer = new Container()
    this._uiLayer.label = 'ui'

    app.stage.addChild(this._gridLayer)
    app.stage.addChild(this._seriesLayer)
    app.stage.addChild(this._overlayLayer)
    app.stage.addChild(this._uiLayer)
  }

  /**
   * Resizes the renderer and canvas to new dimensions.
   */
  resize(width: number, height: number): void {
    this._app?.renderer.resize(width, height)
  }

  /**
   * Returns the current logical dimensions of the renderer.
   */
  getSize(): { width: number; height: number } {
    if (!this._app) return { width: 0, height: 0 }
    return {
      width: this._app.screen.width,
      height: this._app.screen.height,
    }
  }

  /**
   * Destroys the PixiJS application, removes the canvas from the DOM,
   * and releases all GPU resources.
   */
  destroy(): void {
    if (!this._app) return

    this._app.destroy(true, { children: true })
    this._app = null
    this._container = null
  }
}
