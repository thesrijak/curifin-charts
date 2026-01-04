/**
 * Creates a throttled version of `fn` that is invoked at most once
 * every `interval` milliseconds. Uses trailing-edge invocation:
 * the last call within a throttle window is guaranteed to fire.
 *
 * @param fn - The function to throttle
 * @param interval - Minimum time between invocations in milliseconds
 * @returns A throttled wrapper and a `cancel` method to clear pending calls
 */
export function throttle<T extends (...args: unknown[]) => void>(
  fn: T,
  interval: number,
): T & { cancel: () => void } {
  let lastCallTime = 0
  let timeoutId: ReturnType<typeof setTimeout> | null = null
  let lastArgs: Parameters<T> | null = null

  function throttled(this: unknown, ...args: Parameters<T>): void {
    const now = Date.now()
    const remaining = interval - (now - lastCallTime)

    lastArgs = args

    if (remaining <= 0) {
      if (timeoutId !== null) {
        clearTimeout(timeoutId)
        timeoutId = null
      }
      lastCallTime = now
      fn.apply(this, args)
    } else if (timeoutId === null) {
      timeoutId = setTimeout(() => {
        lastCallTime = Date.now()
        timeoutId = null
        if (lastArgs !== null) {
          fn.apply(this, lastArgs)
          lastArgs = null
        }
      }, remaining)
    }
  }

  throttled.cancel = (): void => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId)
      timeoutId = null
    }
    lastArgs = null
  }

  return throttled as T & { cancel: () => void }
}

/**
 * A requestAnimationFrame-based render scheduler that coalesces
 * multiple render requests within the same frame into a single callback.
 * Prevents redundant renders when multiple state changes occur
 * between frames.
 *
 * @example
 * const scheduler = createRenderScheduler(() => chart.render())
 * // These three calls result in only one render on the next frame:
 * scheduler.schedule()
 * scheduler.schedule()
 * scheduler.schedule()
 */
export function createRenderScheduler(renderFn: () => void): {
  schedule: () => void
  cancel: () => void
} {
  let frameId: number | null = null

  function schedule(): void {
    if (frameId !== null) return

    frameId = requestAnimationFrame(() => {
      frameId = null
      renderFn()
    })
  }

  function cancel(): void {
    if (frameId !== null) {
      cancelAnimationFrame(frameId)
      frameId = null
    }
  }

  return { schedule, cancel }
}
