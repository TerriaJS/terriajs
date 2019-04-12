import { computed } from "mobx";
import { createTransformer, fromPromise, IPromiseBasedObservable } from "mobx-utils";
import DataSource from "terriajs-cesium/Source/DataSources/DataSource";
import when from "terriajs-cesium/Source/ThirdParty/when";
import Constructor from "../Core/Constructor";
import filterOutUndefined from "../Core/filterOutUndefined";
import { ImageryParts } from "../Models/Mappable";
import Terria from "../Models/Terria";

interface RequiredInstance {
    terria: Terria;
}

export default function AsyncMappableMixin<T extends Constructor<RequiredInstance>>(Base: T) {
    function handlePromiseRejection(this: AsyncMappableMixin, promise: Promise<DataSource | ImageryParts>): IPromiseBasedObservable<DataSource | ImageryParts | undefined> {
        return fromPromise(promise.catch((e: any) => {
            this.terria.error.raiseEvent(e);
            return undefined;
        }));
    }

    abstract class AsyncMappableMixin extends Base {
        abstract get asyncMapItems(): Promise<DataSource | ImageryParts>[];

        private handlePromiseRejection = createTransformer(handlePromiseRejection.bind(this));

        @computed
        get mapItems(): (DataSource | ImageryParts)[] {
            return filterOutUndefined(this.asyncMapItems.map(promise => {
                return this.handlePromiseRejection(promise).case({
                    fulfilled: (mappable) => mappable
                });
            }));
        }
    }

    return AsyncMappableMixin;
}
