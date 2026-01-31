import { Container, Graphics, Text } from 'pixi.js'
import type { AxisLabel } from '../types/axis.types.js'
import type { Color } from '../types/common.types.js'
import { hexToPixiColor } from '../utils/color.js'

/** Fixed height of the time axis bar in logical pixels. */
export const TIME_AXIS_HEIGHT = 30

function colorToNum(color: Color): number {
  return typeof color === 'string'
    ? hexToPixiColor(color)
    : (color.r << 16) | (color.g << 8) | color.b
}

/**
 * Renders the horizontal time axis below the chart pane.
 *
 * Uses a pool of PixiJS Text objects to avoid create/destroy churn
 * on every render frame.
 */
export class TimeAxis extends Container {
  private readonly _border = new Graphics()
  private readonly _labelPool: Text[] = []
  private _activeCount = 0
  private _textColor: number
  private _borderColor: number

  constructor(textColor: Color, borderColor: Color) {
    super()
    this.label = 'timeAxis'
    this._textColor = colorToNum(textColor)
    this._borderColor = colorToNum(borderColor)
    this.addChild(this._border)
  }

  setColors(textColor: Color, borderColor: Color): void {
    this._textColor = colorToNum(textColor)
    this._borderColor = colorToNum(borderColor)
  }

  /**
   * Draws the time axis labels and top border.
   *
   * @param labels - Pre-computed labels from TimeScale.getTimeLabels()
   * @param width - Full chart width in logical pixels
   */
  draw(labels: readonly AxisLabel[], width: number): void {
    // Draw top border line
    this._border.clear()
    this._border
      .moveTo(0, 0)
      .lineTo(width, 0)
      .stroke({ width: 1, color: this._borderColor })

    // Hide previously active labels
    for (let i = 0; i < this._activeCount; i++) {
      this._labelPool[i]!.visible = false
    }

    this._activeCount = labels.length

    // Render each label, pulling from the pool
    for (let i = 0; i < labels.length; i++) {
      const label = labels[i]!
      const text = this._getOrCreate(i)

      text.text = label.text
      text.style.fill = this._textColor
      text.anchor.set(0.5, 0)
      text.x = label.pixelPosition
      text.y = 6
      text.visible = true
    }
  }

  /** Returns a pooled Text or creates a new one. */
  private _getOrCreate(index: number): Text {
    if (index < this._labelPool.length) {
      return this._labelPool[index]!
    }

    const text = new Text({
      text: '',
      style: {
        fontFamily: 'Inter, -apple-system, sans-serif',
        fontSize: 11,
        fill: this._textColor,
      },
    })
    text.visible = false
    this._labelPool.push(text)
    this.addChild(text)
    return text
  }
}
