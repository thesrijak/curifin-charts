import type { Rect, Margin } from '../types/common.types.js'
import { TIME_AXIS_HEIGHT } from '../axes/TimeAxis.js'
import { PRICE_AXIS_WIDTH } from '../axes/PriceAxis.js'

/**
 * Computed layout rectangles for the chart regions.
 */
export interface ChartLayoutRects {
  /** The main plot area where series are rendered */
  chartPane: Rect
  /** The time axis region below the chart pane */
  timeAxis: Rect
  /** The price axis region beside the chart pane */
  priceAxis: Rect
}

/**
 * Computes layout rectangles from total size, axis config, and margins.
 */
export function computeLayout(
  totalWidth: number,
  totalHeight: number,
  priceAxisPosition: 'left' | 'right',
  priceAxisVisible: boolean,
  timeAxisVisible: boolean,
  margin: Margin,
): ChartLayoutRects {
  const axisW = priceAxisVisible ? PRICE_AXIS_WIDTH : 0
  const axisH = timeAxisVisible ? TIME_AXIS_HEIGHT : 0

  const paneX = priceAxisPosition === 'left' ? margin.left + axisW : margin.left
  const paneY = margin.top
  const paneW = totalWidth - margin.left - margin.right - axisW
  const paneH = totalHeight - margin.top - margin.bottom - axisH

  const chartPane: Rect = {
    x: paneX,
    y: paneY,
    width: Math.max(0, paneW),
    height: Math.max(0, paneH),
  }

  const priceAxisX = priceAxisPosition === 'right'
    ? paneX + paneW
    : margin.left

  const priceAxis: Rect = {
    x: priceAxisX,
    y: paneY,
    width: axisW,
    height: Math.max(0, paneH),
  }

  const timeAxis: Rect = {
    x: paneX,
    y: paneY + paneH,
    width: Math.max(0, paneW),
    height: axisH,
  }

  return { chartPane, timeAxis, priceAxis }
}
