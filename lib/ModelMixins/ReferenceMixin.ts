import { observable, runInAction, untracked } from "mobx";
import DeveloperError from "terriajs-cesium/Source/Core/DeveloperError";
import AsyncLoader from "../Core/AsyncLoader";
import Constructor from "../Core/Constructor";
import Result from "../Core/Result";
import Model, { BaseModel, ModelInterface } from "../Models/Definition/Model";
import ModelTraits from "../Traits/ModelTraits";
import { getName } from "./CatalogMemberMixin";

type RequiredTraits = ModelTraits;

interface ReferenceInterface extends ModelInterface<RequiredTraits> {
  readonly isLoadingReference: boolean;
  readonly target: BaseModel | undefined;
  loadReference(): Promise<Result<void>>;
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
    private _target: BaseModel | undefined;

    private _referenceLoader = new AsyncLoader(() => {
      const previousTarget = untracked(() => this._target);
      return this.forceLoadReference(previousTarget).then(target => {
        if (
          target &&
          (target.sourceReference !== this || target.uniqueId !== this.uniqueId)
        ) {
          throw new DeveloperError(
            "The model returned by `forceLoadReference` must be constructed " +
              "with its `sourceReference` set to the Reference model and its " +
              "`uniqueId` set to the same value as the Reference model."
          );
        }
        runInAction(() => {
          this._target = target;
        });
      });
    });

    get loadReferenceResult() {
      return this._referenceLoader.result;
    }

    /**
     * Gets a value indicating whether the reference is currently loading. While this is true,
     * {@link ModelMixin#target} may be undefined or stale.
     */
    get isLoadingReference(): boolean {
      return this._referenceLoader.isLoading;
    }

    /**
     * Gets the target model of the reference. This model must have the same `id` as this model.
     */
    get target(): BaseModel | undefined {
      return this._target;
    }

    /**
     * Asynchronously loads the reference. When the returned promise resolves,
     * {@link ReferenceMixin#target} should return the target of the reference.
     * @param forceReload True to force the load to happen again, even if nothing
     *        appears to have changed since the last time it was loaded.
     *
     * This returns a Result object, it will contain errors if they occur - they will not be thrown.
     * To throw errors, use `(await loadMetadata()).throwIfError()`
     *
     * {@see AsyncLoader}
     */
    async loadReference(forceReload: boolean = false) {
      return (await this._referenceLoader.load(forceReload)).clone(
        `Failed to load reference \`${getName(this)}\``
      );
    }

    /**
     * Forces load of the reference. This method does _not_ need to consider
     * whether the reference is already loaded.
     *
     * You **can not** make changes to observables until **after** an asynchronous call {@see AsyncLoader}.
     *
     * Errors can be thrown here.
     *
     * {@see AsyncLoader}
     */
    protected abstract forceLoadReference(
      previousTarget: BaseModel | undefined
    ): Promise<BaseModel | undefined>;

    dispose() {
      super.dispose();
      this._referenceLoader.dispose();
    }
  }

  return ReferenceMixin;
}

ReferenceMixin.isMixedInto = function(
  model: BaseModel
): model is ReferenceInterface {
  return "loadReference" in model && "target" in model;
};

export default ReferenceMixin;
