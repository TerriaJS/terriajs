import {
  action,
  computed,
  makeObservable,
  observable,
  onBecomeObserved,
  onBecomeUnobserved
} from "mobx";
import EventHelper from "terriajs-cesium/Source/Core/EventHelper";
import type Terria from "../../../Models/Terria";

/**
 * How far the map has got loading its tiles and data, from the events the map
 * raises as it loads. It follows them while something observes whether the
 * map is loading, and stops when nothing does
 */
export class MapProgress {
  @observable private remaining = 0;
  @observable private total = 0;
  @observable private indeterminate = false;
  private readonly events = new EventHelper();

  constructor(private readonly terria: Terria) {
    makeObservable(this);
    onBecomeObserved(this, "isLoading", () => this.follow());
    onBecomeUnobserved(this, "isLoading", () => this.events.removeAll());
  }

  /** Whether the map is loading anything */
  @computed get isLoading(): boolean {
    return this.indeterminate || this.remaining > 0;
  }

  /**
   * How much has loaded, as a whole percentage; undefined while the map can't
   * say how far it's got
   */
  @computed get percentage(): number | undefined {
    if (this.indeterminate) return undefined;
    if (this.remaining <= 0 || this.total <= 0) return 100;
    return Math.floor((1 - this.remaining / this.total) * 100);
  }

  private follow(): void {
    this.events.add(
      this.terria.tileLoadProgressEvent,
      action((remaining: number, total: number) => {
        this.remaining = remaining;
        this.total = total;
      })
    );
    this.events.add(
      this.terria.indeterminateTileLoadProgressEvent,
      action((indeterminate: boolean) => {
        this.indeterminate = indeterminate;
      })
    );
  }
}
