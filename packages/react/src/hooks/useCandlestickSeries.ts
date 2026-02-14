import { useEffect, useRef, useState } from 'react'
import type { Chart, CandlestickSeries, CandlestickSeriesOptions, OHLCVData } from '@curifin/core'

/**
 * Creates and manages a CandlestickSeries on the given Chart.
 *
 * - Creates the series when the chart is ready, destroys on unmount.
 * - Updates data via `setData` when the data prop changes.
 * - Updates options via `setOptions` when the options prop changes.
 *
 * @param chart - Chart instance (or null if not yet initialized)
 * @param data - OHLCV data array
 * @param options - Partial candlestick series options
 * @returns The series instance, or null before initialization
 */
export function useCandlestickSeries(
  chart: Chart | null,
  data: OHLCVData[],
  options?: Partial<CandlestickSeriesOptions>,
) {
  const [series, setSeries] = useState<CandlestickSeries | null>(null)
  const optionsRef = useRef(options)
  optionsRef.current = options

  // Create/destroy series
  useEffect(() => {
    if (!chart) return

    const s = chart.addCandlestickSeries(optionsRef.current)
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
