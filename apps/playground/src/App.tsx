import { useMemo, useState } from 'react'
import {
  CurifinChart,
  CandleSeries,
  DEFAULT_DARK_THEME,
} from '@curifin/react'
import type { ChartOptionsInput } from '@curifin/react'
import { generateMockOHLCV } from './mockData.js'
import { HookExample } from './HookExample.js'

const chartOptions: ChartOptionsInput = {
  autoSize: true,
  theme: DEFAULT_DARK_THEME,
}

export function App() {
  const mockData = useMemo(() => generateMockOHLCV(500, 150, 60), [])
  const lastBar = mockData[mockData.length - 1]!

  const [crosshairPrice, setCrosshairPrice] = useState<number | null>(null)
  const [crosshairTime, setCrosshairTime] = useState<number | null>(null)

  const displayPrice = crosshairPrice ?? lastBar.close
  const priceChange = displayPrice - mockData[0]!.open
  const priceChangePercent = (priceChange / mockData[0]!.open) * 100
  const isPositive = priceChange >= 0

  const handleCrosshairMove = (data: { time: number; price: number }) => {
    setCrosshairPrice(data.price)
    setCrosshairTime(data.time)
  }

  const formatTime = (unix: number) => {
    const d = new Date(unix * 1000)
    return d.toLocaleString()
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header
        style={{
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #2a2e39',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <h1 style={{ fontSize: 16, fontWeight: 600, color: '#d1d4dc' }}>
            Curifin Charts
          </h1>
          <span style={{ fontSize: 11, color: '#787b86' }}>
            Playground
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
          <span
            style={{
              fontSize: 20,
              fontWeight: 600,
              color: isPositive ? '#26a69a' : '#ef5350',
            }}
          >
            {displayPrice.toFixed(2)}
          </span>
          <span
            style={{
              fontSize: 13,
              color: isPositive ? '#26a69a' : '#ef5350',
            }}
          >
            {isPositive ? '+' : ''}
            {priceChange.toFixed(2)} ({isPositive ? '+' : ''}
            {priceChangePercent.toFixed(2)}%)
          </span>
          {crosshairTime && (
            <span style={{ fontSize: 11, color: '#787b86' }}>
              {formatTime(crosshairTime)}
            </span>
          )}
        </div>
      </header>

      {/* Component API chart */}
      <div style={{ flex: 1, minHeight: 0, padding: '0 16px' }}>
        <CurifinChart
          height="100%"
          options={chartOptions}
          onCrosshairMove={handleCrosshairMove}
        >
          <CandleSeries data={mockData} />
        </CurifinChart>
      </div>

      {/* Hook API chart */}
      <HookExample data={mockData} />
    </div>
  )
}
