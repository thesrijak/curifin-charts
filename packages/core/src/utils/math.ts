/**
 * Clamps `value` to the inclusive range [`min`, `max`].
 */
export function clamp(value: number, min: number, max: number): number {
  return value < min ? min : value > max ? max : value
}

/**
 * Linearly interpolates between `a` and `b` by factor `t` (0–1).
 * Returns `a` when `t = 0`, `b` when `t = 1`.
 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

/**
 * Maps `value` from the range [`inMin`, `inMax`] to [`outMin`, `outMax`].
 * Useful for converting between data coordinates and pixel coordinates.
 */
export function mapRange(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number,
): number {
  return ((value - inMin) / (inMax - inMin)) * (outMax - outMin) + outMin
}

/**
 * Computes a "nice" rounded number for axis tick generation.
 *
 * Given a raw range value, returns a nearby round number (1, 2, 5, or 10
 * multiplied by a power of 10) that produces clean axis labels.
 *
 * @param value - The raw range or step value to round.
 * @param round - If true, rounds to the nearest nice number.
 *                If false, returns the next nice number >= value.
 */
export function niceNumber(value: number, round: boolean): number {
  const exponent = Math.floor(Math.log10(value))
  const fraction = value / Math.pow(10, exponent)

  let nice: number
  if (round) {
    if (fraction < 1.5) nice = 1
    else if (fraction < 3) nice = 2
    else if (fraction < 7) nice = 5
    else nice = 10
  } else {
    if (fraction <= 1) nice = 1
    else if (fraction <= 2) nice = 2
    else if (fraction <= 5) nice = 5
    else nice = 10
  }

  return nice * Math.pow(10, exponent)
}

/**
 * Deep merges `source` into `target`, returning a new object.
 * Neither `target` nor `source` are mutated.
 *
 * - Nested plain objects are merged recursively.
 * - Arrays and non-plain-object values from `source` replace those in `target`.
 * - `undefined` values in `source` are skipped (do not overwrite `target`).
 */
export function deepMerge<T extends Record<string, unknown>>(target: T, source: Partial<T>): T {
  const result = { ...target }

  for (const key of Object.keys(source) as Array<keyof T>) {
    const sourceVal = source[key]

    if (sourceVal === undefined) continue

    const targetVal = target[key]

    if (
      isPlainObject(targetVal) &&
      isPlainObject(sourceVal)
    ) {
      result[key] = deepMerge(
        targetVal as Record<string, unknown>,
        sourceVal as Record<string, unknown>,
      ) as T[keyof T]
    } else {
      result[key] = sourceVal as T[keyof T]
    }
  }

  return result
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * Rounds `value` to `significantFigures` significant digits.
 * Useful for formatting prices on the y-axis.
 *
 * @example
 * roundToSignificantFigures(142.3567, 4) // 142.4
 * roundToSignificantFigures(0.003456, 2) // 0.0035
 */
export function roundToSignificantFigures(value: number, significantFigures: number): number {
  if (value === 0) return 0

  const d = Math.ceil(Math.log10(Math.abs(value)))
  const power = significantFigures - d
  const magnitude = Math.pow(10, power)

  return Math.round(value * magnitude) / magnitude
}
