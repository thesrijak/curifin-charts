import { createContext, useContext } from 'react'
import type { Chart } from '@curifin/core'

/**
 * React context holding the Chart instance.
 * Provided by `CurifinChart`, consumed by series components.
 */
export const ChartContext = createContext<Chart | null>(null)

/**
 * Returns the Chart instance from the nearest `CurifinChart` provider.
 * Throws if used outside of a `CurifinChart` component.
 */
export function useChartContext(): Chart {
  const chart = useContext(ChartContext)
  if (!chart) {
    throw new Error(
      '[@curifin/react] useChartContext must be used inside a <CurifinChart> component. ' +
      'Wrap your series components with <CurifinChart>.',
    )
  }
  return chart
}
