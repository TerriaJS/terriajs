import { computed, observable, runInAction } from "mobx";
import Constructor from "../Core/Constructor";
import Model, { BaseModel, ModelInterface } from "../Models/Model";
import ModelTraits from "../Traits/ModelTraits";

type RequiredTraits = ModelTraits;

interface ReferenceInterface extends ModelInterface<RequiredTraits> {
    readonly isLoadingReference: boolean;
    readonly dereferenced: BaseModel | undefined;
    loadReference(): Promise<void>;
}
/**
 * A mixin for a Model that acts as a "reference" to another Model, which is its "true"
 * representation. The reference is "dereferenced" to obtain the other model, but only
 * after an optional asynchronous operation is completed. For example, a `CkanCatalogItem`
 * acts as a reference to another type of catalog item. Once the CKAN dataset record is
 * loaded, the `CkanCatalogItem` may be dereferenced to obtain the `WebMapServiceCatalogItem`,
 * `GeoJsonCatalogItem`, or whatever else representing the dataset.
 */
function ReferenceMixin<T extends Constructor<Model<RequiredTraits>>>(Base: T) {
    abstract class ReferenceMixin extends Base implements ReferenceInterface {
        get isLoadingReference(): boolean {
            return this._isLoadingReference;
        }

        @observable
        private _isLoadingReference = false;

        private _referencePromise: Promise<void> | undefined = undefined;

        abstract get dereferenced(): BaseModel | undefined;

        /**
         * Gets a promise for loading the reference to another object. This method
         * does _not_ need to consider whether the target is already loaded.
         */
        protected abstract get loadReferencePromise(): Promise<void>;

        @computed({ keepAlive: true })
        private get loadReferenceKeepAlive(): Promise<void> {
            return this.loadReferencePromise;
        }

        /**
         * Asynchronously loads the reference. When the returned promise resolves,
         * {@link ReferenceMixin#dereferenced} should return the target of the reference.
         */
        loadReference(): Promise<void> {
            const newPromise = this.loadReferenceKeepAlive;
            if (newPromise !== this._referencePromise) {
                if (this._referencePromise) {
                    // TODO - cancel old promise
                    //this._referencePromise.cancel();
                }

                this._referencePromise = newPromise;

                runInAction(() => {
                    this._isLoadingReference = true;
                });
                newPromise.then((result) => {
                    runInAction(() => {
                        this._isLoadingReference = false;
                    });
                    return result;
                }).catch((e) => {
                    runInAction(() => {
                        this._isLoadingReference = false;
                    });
                    throw e;
                });
            }

            return newPromise;
        }
    }

    return ReferenceMixin;
}

ReferenceMixin.is = function(model: BaseModel): model is ReferenceInterface {
    return 'loadReference' in model && 'dereferenced' in model;
}

export default ReferenceMixin;
