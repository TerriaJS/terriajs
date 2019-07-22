import { computed, observable, runInAction, untracked } from "mobx";
import Constructor from "../Core/Constructor";
import Model, { BaseModel, ModelInterface } from "../Models/Model";
import ModelTraits from "../Traits/ModelTraits";
import AsyncLoader from "../Core/AsyncLoader";
import DeveloperError from "terriajs-cesium/Source/Core/DeveloperError";

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
    @observable
    private _dereferenced: BaseModel | undefined;

    private _referenceLoader = new AsyncLoader(() => {
      const previousTarget = untracked(() => this._dereferenced);
      return this.forceLoadReference(previousTarget).then(target => {
        if (
          target &&
          target.uniqueId !== undefined &&
          target.uniqueId !== this.uniqueId
        ) {
          throw new DeveloperError(
            "The model returned by `forceLoadReference` must have the same `id` as the `ReferenceMixin` itself."
          );
        }
        this._dereferenced = target;
      });
    });

    /**
     * Forces load of the reference. This method does _not_ need to consider
     * whether the reference is already loaded.
     */
    protected abstract forceLoadReference(
      previousTarget: BaseModel | undefined
    ): Promise<BaseModel | undefined>;

    /**
     * Gets a value indicating whether the reference is currently loading. While this is true,
     * {@link ModelMixin#dereferenced} may be undefined or stale.
     */
    get isLoadingReference(): boolean {
      return this._referenceLoader.isLoading;
    }

    /**
     * Gets the target model of the reference. This model must have the same `id` as this model.
     */
    get dereferenced(): BaseModel | undefined {
      return this._dereferenced;
    }

    /**
     * Asynchronously loads the reference. When the returned promise resolves,
     * {@link ReferenceMixin#dereferenced} should return the target of the reference.
     */
    loadReference(): Promise<void> {
      return this._referenceLoader.load();
    }
  }

  return ReferenceMixin;
}

ReferenceMixin.is = function(model: BaseModel): model is ReferenceInterface {
  return "loadReference" in model && "dereferenced" in model;
};

export default ReferenceMixin;
