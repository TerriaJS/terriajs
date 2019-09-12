import {
  computed,
  IReactionDisposer,
  onBecomeObserved,
  onBecomeUnobserved,
  reaction
} from "mobx";
import { now } from "mobx-utils";
import Constructor from "../Core/Constructor";
import Model from "../Models/Model";
import MappableTraits from "../Traits/MappableTraits";

type AutoRefreshing = Model<MappableTraits>;

export default function AutoRefreshingMixin<
  T extends Constructor<AutoRefreshing>
>(Base: T) {
  abstract class AutoRefreshingMixin extends Base {
    _autoRefreshDisposer: IReactionDisposer | undefined;

    /* Return the interval in seconds to poll for updates. */
    abstract get refreshInterval(): number | undefined;

    /* Call hook for refreshing the item */
    abstract refreshData(): void;

    constructor(...args: any[]) {
      super(...args);
      // We should only poll when our map items have consumers
      onBecomeObserved(this, "mapItems", () => {
        this._autoRefreshDisposer = reaction(
          () => this._pollingTimer,
          () => {
            this.refreshData();
          }
        );
      });
      onBecomeUnobserved(this, "mapItems", () => {
        if (this._autoRefreshDisposer) {
          this._autoRefreshDisposer();
          this._autoRefreshDisposer = undefined;
        }
      });
    }

    @computed
    private get _pollingTimer(): number | undefined {
      if (this.refreshInterval !== undefined) {
        return now(this.refreshInterval * 1000);
      } else {
        return undefined;
      }
    }

    @computed
    get isPolling() {
      return this._pollingTimer !== undefined;
    }

    @computed
    get nextScheduledUpdateTime(): Date | undefined {
      if (
        this._pollingTimer !== undefined &&
        this.refreshInterval !== undefined
      ) {
        return new Date(this._pollingTimer + this.refreshInterval * 1000);
      } else {
        return undefined;
      }
    }
  }

  return AutoRefreshingMixin;
}
