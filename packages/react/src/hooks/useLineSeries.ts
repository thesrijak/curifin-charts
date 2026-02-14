import { useEffect, useRef, useState } from 'react'
import type { Chart, LineSeries, LineSeriesOptions, LineData } from '@curifin/core'

/**
 * Creates and manages a LineSeries on the given Chart.
 *
 * - Creates the series when the chart is ready, destroys on unmount.
 * - Updates data via `setData` when the data prop changes.
 * - Updates options via `setOptions` when the options prop changes.
 *
 * @param chart - Chart instance (or null if not yet initialized)
 * @param data - Line data array
 * @param options - Partial line series options
 * @returns The series instance, or null before initialization
 */
export function useLineSeries(
  chart: Chart | null,
  data: LineData[],
  options?: Partial<LineSeriesOptions>,
) {
  const [series, setSeries] = useState<LineSeries | null>(null)
  const optionsRef = useRef(options)
  optionsRef.current = options

  // Create/destroy series
  useEffect(() => {
    if (!chart) return

    const s = chart.addLineSeries(optionsRef.current)
    setSeries(s)

    return () => {
      chart.removeSeries(s)
      setSeries(null)
    }
  }, [chart])

  // Update data
  useEffect(() => {
    if (!series) return
    series.setData(data)
  }, [series, data])

  // Update options
  useEffect(() => {
    if (!series || !options) return
    series.setOptions(options)
  }, [series, options])

  return series
}
