import type { OHLCVData, CandlestickSeriesOptions } from '@curifin/core'
import { useChartContext } from '../context/ChartContext.js'
import { useCandlestickSeries } from '../hooks/useCandlestickSeries.js'

/** Props for the CandleSeries component. */
export interface CandleSeriesProps {
  /** OHLCV data array */
  data: OHLCVData[]
  /** Partial candlestick series options */
  options?: Partial<CandlestickSeriesOptions>
  /** Whether this series is visible. @default true */
  visible?: boolean
}

/**
 * Declarative candlestick series component.
 * Must be used inside a `<CurifinChart>`.
 *
 * Renders no DOM — purely imperative, managing the series lifecycle
 * through the Chart's imperative API.
 *
 * @example
 * ```tsx
 * <CurifinChart>
 *   <CandleSeries data={ohlcvData} options={{ upColor: '#00ff00' }} />
 * </CurifinChart>
 * ```
 */
export function CandleSeries({ data, options, visible = true }: CandleSeriesProps) {
  const chart = useChartContext()
  const series = useCandlestickSeries(chart, data, options)

  if (series) {
    series.setVisible(visible)
  }

  return null
}
