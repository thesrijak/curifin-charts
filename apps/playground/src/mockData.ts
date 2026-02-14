import type { OHLCVData } from '@curifin/core'

/**
 * Generates realistic OHLCV data using a random walk.
 *
 * @param bars - Number of bars to generate
 * @param startPrice - Starting price
 * @param intervalSeconds - Time interval between bars in seconds
 * @returns Array of OHLCV data sorted by time ascending
 */
export function generateMockOHLCV(
  bars = 500,
  startPrice = 150,
  intervalSeconds = 60,
): OHLCVData[] {
  const data: OHLCVData[] = []
  const now = Math.floor(Date.now() / 1000)
  const startTime = now - bars * intervalSeconds
  let price = startPrice

  for (let i = 0; i < bars; i++) {
    const time = startTime + i * intervalSeconds

    // Random walk with slight upward drift
    const volatility = 0.002 + Math.random() * 0.008
    const drift = 0.0001
    const change = price * (drift + volatility * (Math.random() - 0.48))

    const open = price
    const close = open + change

    // High/low extend beyond open/close
    const range = Math.abs(change) + price * volatility * Math.random()
    const high = Math.max(open, close) + range * Math.random()
    const low = Math.min(open, close) - range * Math.random()

    // Volume correlates with price movement magnitude
    const baseVolume = 100000
    const moveRatio = Math.abs(change) / price
    const volume = Math.round(baseVolume * (0.5 + moveRatio * 50 + Math.random()))

    data.push({
      time,
      open: round(open),
      high: round(high),
      low: round(low),
      close: round(close),
      volume,
    })

    price = close
  }

  return data
}

function round(n: number): number {
  return Math.round(n * 100) / 100
}
