import { Container, Graphics, Text } from 'pixi.js'
import type { Color, Rect } from '../types/common.types.js'
import type { CrosshairMode } from '../types/chart.types.js'
import { hexToPixiColor } from '../utils/color.js'

function colorToNum(color: Color): number {
  return typeof color === 'string'
    ? hexToPixiColor(color)
    : (color.r << 16) | (color.g << 8) | color.b
}

export interface CrosshairStyle {
  lineColor: Color
  lineAlpha: number
  lineWidth: number
  labelBackgroundColor: Color
  labelTextColor: Color
  dashLength: number
  gapLength: number
}

const DEFAULT_STYLE: CrosshairStyle = {
  lineColor: '#758696',
  lineAlpha: 0.6,
  lineWidth: 1,
  labelBackgroundColor: '#4c525e',
  labelTextColor: '#ffffff',
  dashLength: 4,
  gapLength: 3,
}

/**
 * Crosshair overlay that shows intersecting dashed lines at the
 * cursor position, with price and time labels on the axes.
 */
export class Crosshair extends Container {
  private readonly _vertLine = new Graphics()
  private readonly _horzLine = new Graphics()
  private readonly _priceLabelBg = new Graphics()
  private readonly _priceLabelText: Text
  private readonly _timeLabelBg = new Graphics()
  private readonly _timeLabelText: Text
  private _style: CrosshairStyle
  private _mode: CrosshairMode = 'normal'

  constructor(style?: Partial<CrosshairStyle>) {
    super()
    this.label = 'crosshair'
    this._style = { ...DEFAULT_STYLE, ...style }
    this.visible = false

    this._priceLabelText = new Text({
      text: '',
      style: {
        fontFamily: 'Inter, -apple-system, sans-serif',
        fontSize: 11,
        fill: 0xffffff,
      },
    })

    this._timeLabelText = new Text({
      text: '',
      style: {
        fontFamily: 'Inter, -apple-system, sans-serif',
        fontSize: 11,
        fill: 0xffffff,
      },
    })

    this.addChild(this._vertLine)
    this.addChild(this._horzLine)
    this.addChild(this._priceLabelBg)
    this.addChild(this._priceLabelText)
    this.addChild(this._timeLabelBg)
    this.addChild(this._timeLabelText)
  }

  get mode(): CrosshairMode {
    return this._mode
  }

  setMode(mode: CrosshairMode): void {
    this._mode = mode
    if (mode === 'hidden') this.hide()
  }

  setStyle(style: Partial<CrosshairStyle>): void {
    this._style = { ...this._style, ...style }
  }

  /**
   * Shows the crosshair at the given position with labels.
   *
   * @param x - Horizontal pixel position within the chart pane
   * @param y - Vertical pixel position within the chart pane
   * @param priceLabel - Formatted price string for the y-axis label
   * @param timeLabel - Formatted time string for the x-axis label
   * @param chartRect - Bounding rect of the chart pane (for line extents)
   * @param priceAxisX - X offset where the price axis label should be drawn
   * @param timeAxisY - Y offset where the time axis label should be drawn
   */
  show(
    x: number,
    y: number,
    priceLabel: string,
    timeLabel: string,
    chartRect: Rect,
    priceAxisX: number,
    timeAxisY: number,
  ): void {
    if (this._mode === 'hidden') return
    this.visible = true

    const s = this._style
    const lineColor = colorToNum(s.lineColor)
    const bgColor = colorToNum(s.labelBackgroundColor)
    const txtColor = colorToNum(s.labelTextColor)

    // Vertical dashed line (full height at x)
    this._vertLine.clear()
    this._drawDashedVert(
      this._vertLine, x,
      chartRect.y, chartRect.y + chartRect.height,
      lineColor, s.lineAlpha, s.lineWidth,
    )

    // Horizontal dashed line (full width at y)
    this._horzLine.clear()
    this._drawDashedHorz(
      this._horzLine, y,
      chartRect.x, chartRect.x + chartRect.width,
      lineColor, s.lineAlpha, s.lineWidth,
    )

    // Price label (on the price axis)
    const pricePadH = 4
    const pricePadV = 2
    this._priceLabelText.text = priceLabel
    this._priceLabelText.style.fill = txtColor
    const pw = this._priceLabelText.width + pricePadH * 2
    const ph = this._priceLabelText.height + pricePadV * 2

    this._priceLabelBg.clear()
    this._priceLabelBg
      .rect(priceAxisX, y - ph / 2, pw, ph)
      .fill({ color: bgColor })
    this._priceLabelBg.visible = true

    this._priceLabelText.anchor.set(0, 0.5)
    this._priceLabelText.x = priceAxisX + pricePadH
    this._priceLabelText.y = y
    this._priceLabelText.visible = true

    // Time label (on the time axis)
    const timePadH = 6
    const timePadV = 2
    this._timeLabelText.text = timeLabel
    this._timeLabelText.style.fill = txtColor
    const tw = this._timeLabelText.width + timePadH * 2
    const th = this._timeLabelText.height + timePadV * 2

    this._timeLabelBg.clear()
    this._timeLabelBg
      .rect(x - tw / 2, timeAxisY, tw, th)
      .fill({ color: bgColor })
    this._timeLabelBg.visible = true

    this._timeLabelText.anchor.set(0.5, 0)
    this._timeLabelText.x = x
    this._timeLabelText.y = timeAxisY + timePadV
    this._timeLabelText.visible = true
  }

  /**
   * Hides the crosshair.
   */
  hide(): void {
    this.visible = false
  }

  /**
   * Snaps the x coordinate to the nearest bar center (magnet mode).
   *
   * @param cursorX - Raw cursor x position
   * @param timestamps - Sorted array of all data timestamps
   * @param timeToPixel - Function that converts a timestamp to pixel x
   * @returns The snapped x position
   */
  magnetSnap(
    cursorX: number,
    timestamps: readonly number[],
    timeToPixel: (time: number) => number,
  ): number {
    if (timestamps.length === 0) return cursorX

    let closest = cursorX
    let minDist = Infinity

    for (const t of timestamps) {
      const px = timeToPixel(t)
      const dist = Math.abs(px - cursorX)
      if (dist < minDist) {
        minDist = dist
        closest = px
      }
    }

    return closest
  }

  // -- Dashed line drawing --

  private _drawDashedVert(
    g: Graphics,
    x: number,
    yStart: number,
    yEnd: number,
    color: number,
    alpha: number,
    width: number,
  ): void {
    const { dashLength, gapLength } = this._style
    let y = yStart
    let drawing = true

    while (y < yEnd) {
      const step = drawing ? dashLength : gapLength
      const end = Math.min(y + step, yEnd)

      if (drawing) {
        g.moveTo(x, y)
          .lineTo(x, end)
          .stroke({ width, color, alpha })
      }

      y = end
      drawing = !drawing
    }
  }

  private _drawDashedHorz(
    g: Graphics,
    y: number,
    xStart: number,
    xEnd: number,
    color: number,
    alpha: number,
    width: number,
  ): void {
    const { dashLength, gapLength } = this._style
    let x = xStart
    let drawing = true

    while (x < xEnd) {
      const step = drawing ? dashLength : gapLength
      const end = Math.min(x + step, xEnd)

      if (drawing) {
        g.moveTo(x, y)
          .lineTo(end, y)
          .stroke({ width, color, alpha })
      }

      x = end
      drawing = !drawing
    }
  }
}
