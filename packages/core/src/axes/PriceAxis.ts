import { Container, Graphics, Text } from 'pixi.js'
import type { AxisLabel } from '../types/axis.types.js'
import type { Color } from '../types/common.types.js'
import { hexToPixiColor } from '../utils/color.js'

/** Fixed width of the price axis bar in logical pixels. */
export const PRICE_AXIS_WIDTH = 70

function colorToNum(color: Color): number {
  return typeof color === 'string'
    ? hexToPixiColor(color)
    : (color.r << 16) | (color.g << 8) | color.b
}

/**
 * Formats a price value with locale-aware number formatting.
 * Adjusts decimal places based on price magnitude.
 */
function formatPrice(value: number): string {
  const abs = Math.abs(value)

  let digits: number
  if (abs >= 10000) digits = 0
  else if (abs >= 100) digits = 2
  else if (abs >= 1) digits = 2
  else if (abs >= 0.01) digits = 4
  else if (abs >= 0.0001) digits = 6
  else digits = 8

  return new Intl.NumberFormat(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value)
}

/** Options for rendering the last price label. */
export interface LastPriceLabel {
  /** The current close price */
  price: number
  /** Pixel y-position on the price axis */
  pixelPosition: number
  /** Background color (typically up/down color) */
  backgroundColor: Color
  /** Text color for the label */
  textColor: Color
}

/**
 * Renders the vertical price axis alongside the chart pane.
 *
 * Uses a pool of PixiJS Text objects for axis tick labels and
 * a separate highlighted label for the last (current) price.
 */
export class PriceAxis extends Container {
  private readonly _border = new Graphics()
  private readonly _labelPool: Text[] = []
  private _activeCount = 0
  private _textColor: number
  private _borderColor: number
  private _side: 'left' | 'right'

  // Last price label elements
  private readonly _lastPriceBg = new Graphics()
  private readonly _lastPriceText: Text

  constructor(
    position: 'left' | 'right',
    textColor: Color,
    borderColor: Color,
  ) {
    super()
    this.label = 'priceAxis'
    this._side = position
    this._textColor = colorToNum(textColor)
    this._borderColor = colorToNum(borderColor)

    this.addChild(this._border)

    // Last price label (initially hidden)
    this._lastPriceText = new Text({
      text: '',
      style: {
        fontFamily: 'Inter, -apple-system, sans-serif',
        fontSize: 11,
        fill: 0xffffff,
        fontWeight: 'bold',
      },
    })
    this._lastPriceBg.visible = false
    this._lastPriceText.visible = false
    this.addChild(this._lastPriceBg)
    this.addChild(this._lastPriceText)
  }

  get side(): 'left' | 'right' {
    return this._side
  }

  setSide(side: 'left' | 'right'): void {
    this._side = side
  }

  setColors(textColor: Color, borderColor: Color): void {
    this._textColor = colorToNum(textColor)
    this._borderColor = colorToNum(borderColor)
  }

  /**
   * Draws the price axis labels and border.
   *
   * @param labels - Pre-computed labels from PriceScale.getAxisLabels()
   * @param height - Full chart pane height in logical pixels
   */
  draw(labels: readonly AxisLabel[], height: number): void {
    const isRight = this._side === 'right'

    // Draw border line
    this._border.clear()
    const borderX = isRight ? 0 : PRICE_AXIS_WIDTH
    this._border
      .moveTo(borderX, 0)
      .lineTo(borderX, height)
      .stroke({ width: 1, color: this._borderColor })

    // Hide previously active labels
    for (let i = 0; i < this._activeCount; i++) {
      this._labelPool[i]!.visible = false
    }

    this._activeCount = labels.length

    for (let i = 0; i < labels.length; i++) {
      const label = labels[i]!
      const text = this._getOrCreate(i)

      text.text = formatPrice(label.value)
      text.style.fill = this._textColor

      if (isRight) {
        text.anchor.set(0, 0.5)
        text.x = 8
      } else {
        text.anchor.set(1, 0.5)
        text.x = PRICE_AXIS_WIDTH - 8
      }
      text.y = label.pixelPosition
      text.visible = true
    }
  }

  /**
   * Draws a highlighted label for the current/last price.
   * Call with `null` to hide it.
   */
  drawLastPrice(info: LastPriceLabel | null): void {
    if (!info) {
      this._lastPriceBg.visible = false
      this._lastPriceText.visible = false
      return
    }

    const isRight = this._side === 'right'
    const bgColor = colorToNum(info.backgroundColor)
    const txtColor = colorToNum(info.textColor)

    const labelHeight = 18
    const y = info.pixelPosition - labelHeight / 2

    // Background rectangle
    this._lastPriceBg.clear()
    this._lastPriceBg
      .rect(0, y, PRICE_AXIS_WIDTH, labelHeight)
      .fill({ color: bgColor })
    this._lastPriceBg.visible = true

    // Text
    this._lastPriceText.text = formatPrice(info.price)
    this._lastPriceText.style.fill = txtColor

    if (isRight) {
      this._lastPriceText.anchor.set(0, 0.5)
      this._lastPriceText.x = 8
    } else {
      this._lastPriceText.anchor.set(1, 0.5)
      this._lastPriceText.x = PRICE_AXIS_WIDTH - 8
    }
    this._lastPriceText.y = info.pixelPosition
    this._lastPriceText.visible = true
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
