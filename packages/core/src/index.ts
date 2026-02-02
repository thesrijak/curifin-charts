// ---- Public API for @curifin/core ----

// Types (re-exported as type-only for consumers)
export type {
  DeepPartial,
  Point,
  PixelPoint,
  Rect,
  Margin,
  RgbaColor,
  Color,
} from './types/common.types.js'

export type {
  OHLCVData,
  LineData,
  SeriesType,
  LineStyle,
  CandlestickSeriesOptions,
  LineSeriesOptions,
  AreaSeriesOptions,
} from './types/series.types.js'

export type {
  ChartTheme,
  CrosshairMode,
  CrosshairLineOptions,
  CrosshairOptions,
  WatermarkOptions,
  TimeScaleOptions,
  PriceScaleOptions,
  ChartOptions,
  ChartOptionsInput,
} from './types/chart.types.js'

export type {
  AxisLabel,
  TimeRange,
  PriceRange,
} from './types/axis.types.js'

// Chart — the main entry point
export { Chart } from './chart/Chart.js'

// Chart options and themes
export {
  DEFAULT_DARK_THEME,
  DEFAULT_LIGHT_THEME,
  DEFAULT_CHART_OPTIONS,
  mergeChartOptions,
} from './chart/ChartOptions.js'

// Series classes
export { CandlestickSeries } from './series/CandlestickSeries.js'
export { LineSeries } from './series/LineSeries.js'
export { AreaSeries } from './series/AreaSeries.js'

// Scales — exposed for power users who need direct access
export { TimeScale } from './scales/TimeScale.js'
export { PriceScale } from './scales/PriceScale.js'
export type { VisibleBarRange } from './scales/TimeScale.js'
export type { PriceScaleMode } from './scales/PriceScale.js'
