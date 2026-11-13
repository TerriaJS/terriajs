import i18next from "i18next";
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
import TerriaError from "../Core/TerriaError";
import Model from "../Models/Definition/Model";
import AutoRefreshingTraits from "../Traits/TraitsClasses/AutoRefreshingTraits";
import { getName } from "./CatalogMemberMixin";
import MappableMixin from "./MappableMixin";

type BaseType = Model<AutoRefreshingTraits> & MappableMixin.Instance;

export default function AutoRefreshingMixin<
  T extends AbstractConstructor<BaseType>
>(Base: T) {
  abstract class AutoRefreshingMixin extends Base {
    private autoRefreshDisposer: IReactionDisposer | undefined;
    private autorunRefreshEnableDisposer: IReactionDisposer | undefined;
    private refreshError: TerriaError | undefined;

    /** Return the interval in seconds to poll for updates. */
    abstract get refreshInterval(): number | undefined;

    /** Call hook for refreshing the item. Return a promise so failures are reported. */
    abstract refreshData(): void | Promise<void>;

    constructor(...args: any[]) {
      super(...args);
      makeObservable(this);
      // We should only poll when our map items have consumers
      onBecomeObserved(this, "mapItems", this.startAutoRefresh.bind(this));
      onBecomeUnobserved(this, "mapItems", this.stopAutoRefresh.bind(this));
    }

    private startAutoRefresh() {
      if (!this.autorunRefreshEnableDisposer) {
        // Toggle autorefresh when `refreshEnabled` trait changes
        this.autorunRefreshEnableDisposer = reaction(
          () => this.refreshEnabled,
          () => {
            if (this.refreshEnabled) {
              this.startAutoRefresh();
            } else {
              this.stopAutoRefresh();
            }
          }
        );
      }
      if (!this.autoRefreshDisposer && this.refreshEnabled) {
        this.autoRefreshDisposer = reaction(
          () => this._pollingTimer,
          () => {
            if (this.show) this.refresh();
          }
        );
      }
    }

    private refresh() {
      new Promise<void>((resolve) => resolve(this.refreshData())).then(
        () => {
          this.refreshError = undefined;
        },
        (e: unknown) => this.reportRefreshError(e)
      );
    }

    /** Reports the first failure of a run, so a dead feed isn't reported every interval. */
    private reportRefreshError(e: unknown) {
      if (this.refreshError) return;
      this.refreshError = TerriaError.from(e, {
        title: i18next.t(($) => $.models.autoRefreshing.refreshErrorTitle),
        message: i18next.t(($) => $.models.autoRefreshing.refreshErrorMessage, {
          name: getName(this)
        })
      });
      this.terria.errorService.error(this.refreshError, "none");
      this.refreshError.log();
    }

    private stopAutoRefresh() {
      if (this.autorunRefreshEnableDisposer) {
        this.autorunRefreshEnableDisposer();
        this.autorunRefreshEnableDisposer = undefined;
      }
      if (this.autoRefreshDisposer) {
        this.autoRefreshDisposer();
        this.autoRefreshDisposer = undefined;
      }
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
        this.refreshEnabled &&
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
