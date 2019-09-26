import { computed, observable, runInAction } from "mobx";
import Constructor from "../Core/Constructor";
import Mappable, { MapItem } from "../Models/Mappable";
import Model from "../Models/Model";
import MappableTraits from "../Traits/MappableTraits";
import AsyncLoader from "../Core/AsyncLoader";

export default function AsyncMappableMixin<
  T extends Constructor<Model<MappableTraits>>
>(Base: T) {
  abstract class AsyncMappableMixin extends Base implements Mappable {
    get isMappable() {
      return true;
    }

    private _mapItemsLoader = new AsyncLoader(
      this.forceLoadMapItems.bind(this)
    );

    /**
     * Gets a value indicating whether map items are currently loading.
     */
    get isLoadingMapItems(): boolean {
      return this._mapItemsLoader.isLoading;
    }

    /**
     * Loads the map items. It is safe to call this as often as necessary.
     * If the map items are already loaded or already loading, it will
     * return the existing promise.
     */
    loadMapItems(): Promise<void> {
      return this._mapItemsLoader.load();
    }

    abstract get mapItems(): MapItem[];

    /**
     * Forces load of the maps items. This method does _not_ need to consider
     * whether the map items are already loaded.
     */
    protected abstract forceLoadMapItems(): Promise<void>;
  }

  return AsyncMappableMixin;
}
