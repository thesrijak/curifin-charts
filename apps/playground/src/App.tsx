import { useEffect, useMemo, useRef, useState } from 'react'
import {
  CurifinChart,
  CandleSeries,
  LineSeries,
  DEFAULT_DARK_THEME,
  useChart,
  useCandlestickSeries,
  useLineSeries,
} from '@curifin/react'
import type { ChartOptionsInput, LineData } from '@curifin/react'
import { generateMockOHLCV, generateMovingAverage, generateMockLineData } from './mockData.js'

const chartOptions: ChartOptionsInput = {
  autoSize: true,
  theme: DEFAULT_DARK_THEME,
}

const sectionLabel: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 500,
  color: '#787b86',
  marginBottom: 6,
  marginTop: 16,
  paddingLeft: 16,
}

const chartBorder: React.CSSProperties = {
  borderRadius: 4,
  overflow: 'hidden',
  border: '1px solid #2a2e39',
  margin: '0 16px',
}

export function App() {
  const ohlcvData = useMemo(() => generateMockOHLCV(500, 150, 60), [])
  const ma20 = useMemo(() => generateMovingAverage(ohlcvData, 20), [ohlcvData])
  const ma50 = useMemo(() => generateMovingAverage(ohlcvData, 50), [ohlcvData])
  const lineData = useMemo(() => generateMockLineData(500, 50, 60), [])
  const areaData = useMemo(() => generateMockLineData(500, 100, 60), [])

  const lastBar = ohlcvData[ohlcvData.length - 1]!

  const [crosshairPrice, setCrosshairPrice] = useState<number | null>(null)
  const [crosshairTime, setCrosshairTime] = useState<number | null>(null)

  const displayPrice = crosshairPrice ?? lastBar.close
  const priceChange = displayPrice - ohlcvData[0]!.open
  const priceChangePercent = (priceChange / ohlcvData[0]!.open) * 100
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
    <div style={{ minHeight: '100%', paddingBottom: 24 }}>
      {/* Header */}
      <header
        style={{
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #2a2e39',
          position: 'sticky',
          top: 0,
          background: '#0b0e14',
          zIndex: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <h1 style={{ fontSize: 16, fontWeight: 600, color: '#d1d4dc' }}>
            Curifin Charts
          </h1>
          <span style={{ fontSize: 11, color: '#787b86' }}>Playground</span>
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
          <span style={{ fontSize: 13, color: isPositive ? '#26a69a' : '#ef5350' }}>
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

      {/* 1. Candlestick + Moving Averages (Component API) */}
      <h2 style={sectionLabel}>Candlestick + Moving Averages — Component API</h2>
      <div style={chartBorder}>
        <CurifinChart
          height={420}
          options={chartOptions}
          onCrosshairMove={handleCrosshairMove}
        >
          <CandleSeries data={ohlcvData} />
          <LineSeries
            data={ma20}
            options={{ color: '#f5a623', lineWidth: 1.5, lineStyle: 'solid' }}
          />
          <LineSeries
            data={ma50}
            options={{ color: '#7b61ff', lineWidth: 1.5, lineStyle: 'solid' }}
          />
        </CurifinChart>
      </div>

      {/* 2. Standalone Line Chart (Component API) */}
      <h2 style={sectionLabel}>Line Chart — Component API</h2>
      <div style={chartBorder}>
        <CurifinChart height={250} options={chartOptions}>
          <LineSeries
            data={lineData}
            options={{
              color: '#2196f3',
              lineWidth: 2,
              pointMarkersVisible: false,
            }}
          />
        </CurifinChart>
      </div>

      {/* 3. Area Chart (Hook API) */}
      <h2 style={sectionLabel}>Area Chart — Hook API</h2>
      <AreaChartHookExample data={areaData} />

      {/* 4. Candlestick (Hook API) */}
      <h2 style={sectionLabel}>Candlestick — Hook API</h2>
      <CandlestickHookExample data={ohlcvData} />
    </div>
  )
}

function AreaChartHookExample({ data }: { data: LineData[] }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const { chart } = useChart(containerRef, chartOptions)

  // Use the core AreaSeries via the Chart imperative API
  useEffect(() => {
    if (!chart) return
    const series = chart.addAreaSeries({
      color: '#26a69a',
      lineWidth: 2,
      topColor: '#26a69a',
      bottomColor: '#26a69a',
      fillOpacity: 0.28,
    })
    series.setData(data)
    return () => chart.removeSeries(series)
  }, [chart, data])

  return (
    <div style={chartBorder}>
      <div ref={containerRef} style={{ height: 250 }} />
    </div>
  )
}

function CandlestickHookExample({ data }: { data: readonly import('@curifin/core').OHLCVData[] }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const { chart } = useChart(containerRef, chartOptions)
  useCandlestickSeries(chart, data as import('@curifin/core').OHLCVData[])

  return (
    <div style={chartBorder}>
      <div ref={containerRef} style={{ height: 200 }} />
    </div>
  )
}
