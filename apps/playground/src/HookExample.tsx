import { useRef } from 'react'
import { useChart, useCandlestickSeries, DEFAULT_DARK_THEME } from '@curifin/react'
import type { OHLCVData, ChartOptionsInput } from '@curifin/react'

const hookChartOptions: ChartOptionsInput = {
  autoSize: true,
  theme: DEFAULT_DARK_THEME,
}

interface HookExampleProps {
  data: OHLCVData[]
}

/**
 * Demonstrates using the hook API directly, without the component wrapper.
 */
export function HookExample({ data }: HookExampleProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const { chart } = useChart(containerRef, hookChartOptions)
  useCandlestickSeries(chart, data)

  return (
    <div style={{ padding: '0 16px 16px' }}>
      <h2
        style={{
          fontSize: 14,
          fontWeight: 500,
          color: '#787b86',
          marginBottom: 8,
        }}
      >
        Hook API Example
      </h2>
      <div
        ref={containerRef}
        style={{
          height: 200,
          borderRadius: 4,
          overflow: 'hidden',
          border: '1px solid #2a2e39',
        }}
      />
    </div>
  )
}
