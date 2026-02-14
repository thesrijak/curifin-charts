import { useEffect, useRef, useState } from 'react'
import { Chart } from '@curifin/core'
import type { ChartOptionsInput } from '@curifin/core'

/**
 * Creates and manages a Chart instance attached to a container ref.
 *
 * - Creates the chart on mount, destroys on unmount.
 * - Option changes are applied via `applyOptions` — the chart is never recreated.
 * - Handles async PixiJS initialization gracefully.
 * - Safe under React StrictMode (double-invoke of effects).
 *
 * @param containerRef - Ref to the DOM element that will hold the chart canvas
 * @param options - Partial chart options
 * @returns `{ chart }` where chart is null until initialization completes
 */
export function useChart(
  containerRef: React.RefObject<HTMLDivElement | null>,
  options?: ChartOptionsInput,
) {
  const [chart, setChart] = useState<Chart | null>(null)
  const optionsRef = useRef(options)
  optionsRef.current = options

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let destroyed = false
    let instance: Chart | null = null

    Chart.create(container, optionsRef.current).then((c) => {
      if (destroyed) {
        c.destroy()
        return
      }
      instance = c
      setChart(c)
    })

    return () => {
      destroyed = true
      if (instance) {
        instance.destroy()
        instance = null
      }
      setChart(null)
    }
  }, [containerRef])

  // Apply option changes without recreating the chart
  useEffect(() => {
    if (!chart || !options) return
    chart.applyOptions(options)
  }, [chart, options])

  return { chart }
}
