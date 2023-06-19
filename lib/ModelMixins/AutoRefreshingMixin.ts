import {
  computed,
  IReactionDisposer,
  onBecomeObserved,
  onBecomeUnobserved,
  reaction,
  makeObservable
} from "mobx";
import { now } from "mobx-utils";
import AbstractConstructor from "../Core/AbstractConstructor";
import Model from "../Models/Definition/Model";
import AutoRefreshingTraits from "../Traits/TraitsClasses/AutoRefreshingTraits";
import MappableMixin from "./MappableMixin";

type BaseType = Model<AutoRefreshingTraits> & MappableMixin.Instance;

export default function AutoRefreshingMixin<
  T extends AbstractConstructor<BaseType>
>(Base: T) {
  abstract class AutoRefreshingMixin extends Base {
    _private_autoRefreshDisposer: IReactionDisposer | undefined;
    _private_autorunRefreshEnableDisposer: IReactionDisposer | undefined;

    /** Return the interval in seconds to poll for updates. */
    abstract get refreshInterval(): number | undefined;

    /** Call hook for refreshing the item */
    abstract refreshData(): void;

    constructor(...args: any[]) {
      super(...args);
      makeObservable(this);
      // We should only poll when our map items have consumers
      onBecomeObserved(
        this,
        "mapItems",
        this._private_startAutoRefresh.bind(this)
      );
      onBecomeUnobserved(
        this,
        "mapItems",
        this._private_stopAutoRefresh.bind(this)
      );
    }

    _private_startAutoRefresh() {
      if (!this._private_autorunRefreshEnableDisposer) {
        // Toggle autorefresh when `refreshEnabled` trait changes
        this._private_autorunRefreshEnableDisposer = reaction(
          () => this.refreshEnabled,
          () => {
            if (this.refreshEnabled) {
              this._private_startAutoRefresh();
            } else {
              this._private_stopAutoRefresh();
            }
          }
        );
      }
      if (!this._private_autoRefreshDisposer && this.refreshEnabled) {
        this._private_autoRefreshDisposer = reaction(
          () => this._private_pollingTimer,
          () => {
            if (this.show) this.refreshData();
          }
        );
      }
    }

    _private_stopAutoRefresh() {
      if (this._private_autorunRefreshEnableDisposer) {
        this._private_autorunRefreshEnableDisposer();
        this._private_autorunRefreshEnableDisposer = undefined;
      }
      if (this._private_autoRefreshDisposer) {
        this._private_autoRefreshDisposer();
        this._private_autoRefreshDisposer = undefined;
      }
    }

    @computed
    get _private_pollingTimer(): number | undefined {
      if (this.refreshInterval !== undefined) {
        return now(this.refreshInterval * 1000);
      } else {
        return undefined;
      }
    }

    @computed
    get isPolling() {
      return this._private_pollingTimer !== undefined;
    }

    @computed
    get nextScheduledUpdateTime(): Date | undefined {
      if (
        this.refreshEnabled &&
        this._private_pollingTimer !== undefined &&
        this.refreshInterval !== undefined
      ) {
        return new Date(
          this._private_pollingTimer + this.refreshInterval * 1000
        );
      } else {
        return undefined;
      }
    }
  }

  return AutoRefreshingMixin;
}
