import { computed, observable, runInAction } from "mobx";
import Constructor from "../Core/Constructor";
import Mappable, { MapItem } from "../Models/Mappable";
import Model from "../Models/Model";
import MappableTraits from "../Traits/MappableTraits";

export default function AsyncMappableMixin<
  T extends Constructor<Model<MappableTraits>>
>(Base: T) {
  abstract class AsyncMappableMixin extends Base implements Mappable {
    // TODO
    get isMappable() {
      return true;
    }

    get isLoadingMapItems(): boolean {
      return this._isLoadingMapItems;
    }

    @observable
    private _isLoadingMapItems = false;

    private _mapItemsPromise: Promise<void> | undefined = undefined;

    abstract get mapItems(): MapItem[];

    /**
     * Gets a promise for loaded map items. This method does _not_ need to consider
     * whether the map items already loaded.
     */
    protected abstract get loadMapItemsPromise(): Promise<void>;

    @computed({ keepAlive: true })
    private get loadMapItemsKeepAlive(): Promise<void> {
      return this.loadMapItemsPromise;
    }

    /**
     * Asynchronously loads map items. When the returned promise resolves,
     * {@link AsyncMappableMixin#mapItems} should return all map items.
     */
    loadMapItems(): Promise<void> {
      const newPromise = this.loadMapItemsKeepAlive;
      if (newPromise !== this._mapItemsPromise) {
        if (this._mapItemsPromise) {
          // TODO - cancel old promise
          //this._mapItemsPromise.cancel();
        }

        this._mapItemsPromise = newPromise;

        runInAction(() => {
          this._isLoadingMapItems = true;
        });
        newPromise
          .then(result => {
            runInAction(() => {
              this._isLoadingMapItems = false;
            });
            return result;
          })
          .catch(e => {
            runInAction(() => {
              this._isLoadingMapItems = false;
            });
            throw e;
          });
      }

      return newPromise;
    }
  }

  return AsyncMappableMixin;
}
