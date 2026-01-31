/** Event map for all interaction events emitted by the manager. */
export interface InteractionEventMap {
  crosshairMove: { x: number; y: number }
  crosshairLeave: undefined
  pan: { deltaX: number; deltaY: number }
  zoom: { delta: number; anchorX: number }
}

type EventHandler<T> = (data: T) => void

/**
 * Minimal typed event emitter. No external dependencies.
 */
class EventEmitter<TMap extends object> {
  private _listeners = new Map<keyof TMap, Set<EventHandler<never>>>()

  on<K extends keyof TMap>(event: K, handler: EventHandler<TMap[K]>): void {
    let set = this._listeners.get(event)
    if (!set) {
      set = new Set()
      this._listeners.set(event, set)
    }
    set.add(handler as EventHandler<never>)
  }

  off<K extends keyof TMap>(event: K, handler: EventHandler<TMap[K]>): void {
    this._listeners.get(event)?.delete(handler as EventHandler<never>)
  }

  emit<K extends keyof TMap>(event: K, data: TMap[K]): void {
    const set = this._listeners.get(event)
    if (!set) return
    for (const handler of set) {
      ;(handler as EventHandler<TMap[K]>)(data)
    }
  }

  removeAll(): void {
    this._listeners.clear()
  }
}

/**
 * Manages all user interaction with the chart canvas.
 *
 * Attaches native browser mouse, wheel, and touch events and translates
 * them into semantic chart events (crosshairMove, pan, zoom, etc.).
 * All listeners are cleanly removable via `destroy()`.
 */
export class InteractionManager extends EventEmitter<InteractionEventMap> {
  private _canvas: HTMLCanvasElement | null = null
  private _boundHandlers: Array<[string, EventListener]> = []

  // Pan state
  private _isPanning = false
  private _lastMouseX = 0
  private _lastMouseY = 0

  // Pinch zoom state
  private _lastPinchDistance = 0
  private _activeTouches = 0

  /**
   * Attaches all event listeners to the canvas element.
   * Must be called after the renderer has initialized.
   */
  attach(canvas: HTMLCanvasElement): void {
    this._canvas = canvas

    this._bindEvent('mousemove', this._onMouseMove)
    this._bindEvent('mousedown', this._onMouseDown)
    this._bindEvent('mouseup', this._onMouseUp)
    this._bindEvent('mouseleave', this._onMouseLeave)
    this._bindEvent('wheel', this._onWheel, { passive: false })

    // Touch events
    this._bindEvent('touchstart', this._onTouchStart, { passive: false })
    this._bindEvent('touchmove', this._onTouchMove, { passive: false })
    this._bindEvent('touchend', this._onTouchEnd)
    this._bindEvent('touchcancel', this._onTouchEnd)
  }

  /**
   * Removes all event listeners and clears internal state.
   */
  destroy(): void {
    if (this._canvas) {
      for (const [event, handler] of this._boundHandlers) {
        this._canvas.removeEventListener(event, handler)
      }
    }
    this._boundHandlers = []
    this._canvas = null
    this._isPanning = false
    this.removeAll()
  }

  // -- Mouse handlers --

  private _onMouseMove = (e: Event): void => {
    const me = e as MouseEvent
    const rect = this._canvas!.getBoundingClientRect()
    const x = me.clientX - rect.left
    const y = me.clientY - rect.top

    if (this._isPanning) {
      const deltaX = x - this._lastMouseX
      const deltaY = y - this._lastMouseY
      this._lastMouseX = x
      this._lastMouseY = y
      this.emit('pan', { deltaX, deltaY })
    } else {
      this.emit('crosshairMove', { x, y })
    }
  }

  private _onMouseDown = (e: Event): void => {
    const me = e as MouseEvent
    const rect = this._canvas!.getBoundingClientRect()
    this._isPanning = true
    this._lastMouseX = me.clientX - rect.left
    this._lastMouseY = me.clientY - rect.top
  }

  private _onMouseUp = (): void => {
    this._isPanning = false
  }

  private _onMouseLeave = (): void => {
    this._isPanning = false
    this.emit('crosshairLeave', undefined)
  }

  // -- Wheel handler --

  private _onWheel = (e: Event): void => {
    const we = e as WheelEvent
    we.preventDefault()

    const rect = this._canvas!.getBoundingClientRect()
    const anchorX = we.clientX - rect.left

    // Normalize delta across browsers and input devices.
    // deltaMode: 0 = pixels, 1 = lines (~40px), 2 = pages (~800px)
    let delta = we.deltaY
    if (we.deltaMode === 1) delta *= 40
    else if (we.deltaMode === 2) delta *= 800

    // Clamp to avoid extreme jumps from trackpad acceleration
    delta = Math.max(-300, Math.min(300, delta))

    // Convert to a scale factor: positive delta = zoom out
    const normalizedDelta = delta / 300

    this.emit('zoom', { delta: normalizedDelta, anchorX })
  }

  // -- Touch handlers --

  private _onTouchStart = (e: Event): void => {
    const te = e as TouchEvent
    te.preventDefault()
    this._activeTouches = te.touches.length

    if (te.touches.length === 1) {
      // Single finger → start pan
      const touch = te.touches[0]!
      const rect = this._canvas!.getBoundingClientRect()
      this._isPanning = true
      this._lastMouseX = touch.clientX - rect.left
      this._lastMouseY = touch.clientY - rect.top
    } else if (te.touches.length === 2) {
      // Two fingers → start pinch zoom
      this._isPanning = false
      this._lastPinchDistance = this._getPinchDistance(te.touches)
    }
  }

  private _onTouchMove = (e: Event): void => {
    const te = e as TouchEvent
    te.preventDefault()

    if (te.touches.length === 1 && this._isPanning) {
      // Single finger pan
      const touch = te.touches[0]!
      const rect = this._canvas!.getBoundingClientRect()
      const x = touch.clientX - rect.left
      const y = touch.clientY - rect.top
      const deltaX = x - this._lastMouseX
      const deltaY = y - this._lastMouseY
      this._lastMouseX = x
      this._lastMouseY = y
      this.emit('pan', { deltaX, deltaY })
    } else if (te.touches.length === 2) {
      // Pinch zoom
      const currentDistance = this._getPinchDistance(te.touches)
      if (this._lastPinchDistance > 0) {
        const scaleFactor = currentDistance / this._lastPinchDistance

        // Find midpoint of the two touches for zoom anchor
        const rect = this._canvas!.getBoundingClientRect()
        const anchorX = (
          (te.touches[0]!.clientX + te.touches[1]!.clientX) / 2
        ) - rect.left

        // Convert scale factor to delta: > 1 means zoom in (negative delta)
        const delta = -(scaleFactor - 1)

        this.emit('zoom', { delta, anchorX })
      }
      this._lastPinchDistance = currentDistance
    }
  }

  private _onTouchEnd = (e: Event): void => {
    const te = e as TouchEvent
    this._activeTouches = te.touches.length

    if (te.touches.length === 0) {
      this._isPanning = false
      this._lastPinchDistance = 0
      this.emit('crosshairLeave', undefined)
    } else if (te.touches.length === 1) {
      // Went from 2 → 1 finger: reset pan origin
      const touch = te.touches[0]!
      const rect = this._canvas!.getBoundingClientRect()
      this._isPanning = true
      this._lastMouseX = touch.clientX - rect.left
      this._lastMouseY = touch.clientY - rect.top
      this._lastPinchDistance = 0
    }
  }

  // -- Helpers --

  private _getPinchDistance(touches: TouchList): number {
    const t0 = touches[0]!
    const t1 = touches[1]!
    return Math.hypot(t1.clientX - t0.clientX, t1.clientY - t0.clientY)
  }

  private _bindEvent(
    event: string,
    handler: (e: Event) => void,
    options?: AddEventListenerOptions,
  ): void {
    this._canvas!.addEventListener(event, handler, options)
    this._boundHandlers.push([event, handler])
  }
}
