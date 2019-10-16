import ChartData from "../Charts/ChartData";
import AsyncLoader from "../Core/AsyncLoader";
import Constructor from "../Core/Constructor";
import Chartable, { ChartAxis, ChartItem } from "../Models/Chartable";
import Model from "../Models/Model";
import MappableTraits from "../Traits/MappableTraits";

export default function AsyncChartableMixin<
  T extends Constructor<Model<MappableTraits>>
>(Base: T) {
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
    loadChartItems(): Promise<void> {
      return this._chartItemsLoader.load();
    }

    /**
     * Gets the items to show on a chart.
     */
    abstract get chartItems(): ChartData[];

    /**
     * Gets the items to show on a chart.
     */
    abstract get chartItems2(): ChartItem[];

    /**
     * Forces load of the chart items. This method does _not_ need to consider
     * whether the chart items are already loaded.
     */
    protected abstract forceLoadChartItems(): Promise<void>;
  }

  return AsyncChartableMixin;
}
