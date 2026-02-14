// ---- Public API for @curifin/react ----

// Components
export { CurifinChart } from './components/CurifinChart.js'
export type { CurifinChartProps } from './components/CurifinChart.js'
export { CandleSeries } from './components/CandleSeries.js'
export type { CandleSeriesProps } from './components/CandleSeries.js'
export { LineSeriesComponent as LineSeries } from './components/LineSeries.js'
export type { LineSeriesProps } from './components/LineSeries.js'

// Hooks
export { useChart } from './hooks/useChart.js'
export { useCandlestickSeries } from './hooks/useCandlestickSeries.js'
export { useLineSeries } from './hooks/useLineSeries.js'

// Context
export { ChartContext, useChartContext } from './context/ChartContext.js'

// Re-export all types from @curifin/core for consumer convenience
export type {
  DeepPartial,
  Point,
  PixelPoint,
  Rect,
  Margin,
  RgbaColor,
  Color,
  OHLCVData,
  LineData,
  SeriesType,
  LineStyle,
  CandlestickSeriesOptions,
  LineSeriesOptions,
  AreaSeriesOptions,
  ChartTheme,
  CrosshairMode,
  CrosshairLineOptions,
  CrosshairOptions,
  WatermarkOptions,
  TimeScaleOptions,
  PriceScaleOptions,
  ChartOptions,
  ChartOptionsInput,
  AxisLabel,
  TimeRange,
  PriceRange,
  VisibleBarRange,
  PriceScaleMode,
} from '@curifin/core'

// Re-export runtime values from @curifin/core
export {
  Chart,
  DEFAULT_DARK_THEME,
  DEFAULT_LIGHT_THEME,
  DEFAULT_CHART_OPTIONS,
  mergeChartOptions,
  CandlestickSeries,
  LineSeries as CoreLineSeries,
  AreaSeries,
  TimeScale,
  PriceScale,
} from '@curifin/core'
