import { Container } from 'pixi.js'

/**
 * Manages child containers keyed by series ID.
 * Each series renders into its own Container, enabling independent
 * visibility toggling and z-order control.
 */
export class SeriesLayer extends Container {
  private readonly _series = new Map<string, Container>()

  constructor() {
    super()
    this.label = 'series'
  }

  /**
   * Adds a new series container. If a container with this ID already
   * exists, it is returned without creating a duplicate.
   */
  add(id: string): Container {
    const existing = this._series.get(id)
    if (existing) return existing

    const container = new Container()
    container.label = id
    this._series.set(id, container)
    this.addChild(container)
    return container
  }

  /**
   * Removes a series container and destroys its children.
   */
  remove(id: string): void {
    const container = this._series.get(id)
    if (!container) return

    this._series.delete(id)
    this.removeChild(container)
    container.destroy({ children: true })
  }

  /**
   * Returns the container for a series, or `undefined` if not found.
   */
  get(id: string): Container | undefined {
    return this._series.get(id)
  }

  /**
   * Returns true if a series with this ID exists.
   */
  has(id: string): boolean {
    return this._series.has(id)
  }

  /**
   * Returns all series IDs.
   */
  ids(): string[] {
    return [...this._series.keys()]
  }
}
