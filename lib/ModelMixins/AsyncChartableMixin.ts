import AsyncLoader from "../Core/AsyncLoader";
import Constructor from "../Core/Constructor";
import Chartable, { ChartItem } from "../Models/Chartable";
import Model from "../Models/Model";
import MappableTraits from "../Traits/MappableTraits";
import CatalogMemberMixin from "./CatalogMemberMixin";

function AsyncChartableMixin<T extends Constructor<Model<MappableTraits>>>(
  Base: T
) {
  abstract class AsyncChartableMixin extends Base implements Chartable {
    get isChartable() {
      return true;
    }

    private _chartItemsLoader = new AsyncLoader(
      this.forceLoadChartItems.bind(this)
    );

    /**
     * Gets a value indicating whether chart items are currently loading.
     */
    get isLoadingChartItems(): boolean {
      return this._chartItemsLoader.isLoading;
    }

    /**
     * Loads the chart items. It is safe to call this as often as necessary.
     * If the chart items are already loaded or already loading, it will
     * return the existing promise.
     */
    async loadChartItems() {
      if (CatalogMemberMixin.isMixedInto(this)) await this.loadMetadata();
      await this._chartItemsLoader.load();
    }

    /**
     * Gets the items to show on a chart.
     */
    abstract get chartItems(): ChartItem[];

    /**
     * Forces load of the chart items. This method does _not_ need to consider
     * whether the chart items are already loaded.
     *
     * It is guaranteed that `loadMetadata` has finished before this is called.
     *
     * You **can not** make changes to observables until **after** an asynchronous call {@see AsyncLoader}. If there are no async calls - it can be simulated using `await Promise.resolve()` or `await runLater(() => )`
     */
    protected async forceLoadChartItems() {}

    dispose() {
      super.dispose();
      this._chartItemsLoader.dispose();
    }
  }

  return AsyncChartableMixin;
}

namespace AsyncChartableMixin {
  export interface AsyncChartableMixin
    extends InstanceType<ReturnType<typeof AsyncChartableMixin>> {}
  export function isMixedInto(model: any): model is AsyncChartableMixin {
    return model && model.isChartable;
  }
}

export default AsyncChartableMixin;
