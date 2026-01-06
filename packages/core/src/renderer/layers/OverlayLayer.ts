import { Container } from 'pixi.js'

/**
 * Overlay layer sits above the series layer.
 * Used for crosshairs, tooltips, selection highlights, and
 * other interactive elements drawn on top of chart data.
 */
export class OverlayLayer extends Container {
  constructor() {
    super()
    this.label = 'overlay'
  }
}
