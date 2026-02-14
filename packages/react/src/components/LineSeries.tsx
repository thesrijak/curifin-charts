import type { LineData, LineSeriesOptions } from '@curifin/core'
import { useChartContext } from '../context/ChartContext.js'
import { useLineSeries } from '../hooks/useLineSeries.js'

/** Props for the LineSeries component. */
export interface LineSeriesProps {
  /** Line data array */
  data: LineData[]
  /** Partial line series options */
  options?: Partial<LineSeriesOptions>
  /** Whether this series is visible. @default true */
  visible?: boolean
}

/**
 * Declarative line series component.
 * Must be used inside a `<CurifinChart>`.
 *
 * Renders no DOM — purely imperative, managing the series lifecycle
 * through the Chart's imperative API.
 *
 * @example
 * ```tsx
 * <CurifinChart>
 *   <LineSeries data={lineData} options={{ color: '#2196f3' }} />
 * </CurifinChart>
 * ```
 */
export function LineSeriesComponent({ data, options, visible = true }: LineSeriesProps) {
  const chart = useChartContext()
  const series = useLineSeries(chart, data, options)

  if (series) {
    series.setVisible(visible)
  }

  return null
}
