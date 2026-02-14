import { useRef, type CSSProperties, type ReactNode } from 'react'
import type { ChartOptionsInput } from '@curifin/core'
import { ChartContext } from '../context/ChartContext.js'
import { useChart } from '../hooks/useChart.js'

/** Props for the CurifinChart component. */
export interface CurifinChartProps {
  /** Chart width. Accepts CSS values. @default '100%' */
  width?: number | string
  /** Chart height in pixels. @default 400 */
  height?: number | string
  /** Partial chart options */
  options?: ChartOptionsInput
  /** Additional CSS class name for the container div */
  className?: string
  /** Additional inline styles for the container div */
  style?: CSSProperties
  /** Series components and other children. Rendered only after chart init. */
  children?: ReactNode
  /** Called when the crosshair moves over the chart */
  onCrosshairMove?: (data: { time: number; price: number; x: number; y: number }) => void
}

/**
 * Root chart component. Creates a Chart instance and provides it
 * to child series components via React context.
 *
 * Children are rendered only after the chart has finished async initialization.
 *
 * @example
 * ```tsx
 * <CurifinChart height={500} options={{ theme: DEFAULT_DARK_THEME }}>
 *   <CandleSeries data={ohlcvData} />
 *   <LineSeries data={lineData} options={{ color: '#ff0000' }} />
 * </CurifinChart>
 * ```
 */
export function CurifinChart({
  width = '100%',
  height = 400,
  options,
  className,
  style,
  children,
  onCrosshairMove,
}: CurifinChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const { chart } = useChart(containerRef, options)

  // Wire crosshair move callback
  if (chart && onCrosshairMove) {
    chart.subscribeCrosshairMove(onCrosshairMove)
  }

  const containerStyle: CSSProperties = {
    position: 'relative',
    overflow: 'hidden',
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
    ...style,
  }

  return (
    <div ref={containerRef} className={className} style={containerStyle}>
      {chart && (
        <ChartContext.Provider value={chart}>
          {children}
        </ChartContext.Provider>
      )}
    </div>
  )
}
