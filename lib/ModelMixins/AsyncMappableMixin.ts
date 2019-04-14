import { computed, observable, runInAction } from "mobx";
import { createTransformer, fromPromise, IPromiseBasedObservable } from "mobx-utils";
import DataSource from "terriajs-cesium/Source/DataSources/DataSource";
import when from "terriajs-cesium/Source/ThirdParty/when";
import Constructor from "../Core/Constructor";
import filterOutUndefined from "../Core/filterOutUndefined";
import Mappable, { ImageryParts } from "../Models/Mappable";
import Terria from "../Models/Terria";

interface RequiredInstance {
    terria: Terria;
}

export default function AsyncMappableMixin<T extends Constructor<RequiredInstance>>(Base: T) {
    abstract class AsyncMappableMixin extends Base implements Mappable {
        get isLoadingMapItems(): boolean {
            return this._isLoadingMapItems;
        }

        @observable
        private _isLoadingMapItems = false;

        private _mapItemsPromise: Promise<void> | undefined = undefined;

        abstract get mapItems(): (DataSource | ImageryParts)[];

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
                newPromise.then((result) => {
                    runInAction(() => {
                        this._isLoadingMapItems = false;
                    });
                    return result;
                }).catch((e) => {
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
