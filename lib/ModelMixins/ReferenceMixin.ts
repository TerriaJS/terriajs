import {
  computed,
  observable,
  runInAction,
  untracked,
  makeObservable
} from "mobx";
import DeveloperError from "terriajs-cesium/Source/Core/DeveloperError";
import AbstractConstructor from "../Core/AbstractConstructor";
import AsyncLoader from "../Core/AsyncLoader";
import Result from "../Core/Result";
import TerriaError from "../Core/TerriaError";
import Model, { BaseModel, ModelInterface } from "../Models/Definition/Model";
import ReferenceTraits from "../Traits/TraitsClasses/ReferenceTraits";
import { getName } from "./CatalogMemberMixin";
import { applyItemProperties } from "./GroupMixin";

interface ReferenceInterface extends ModelInterface<ReferenceTraits> {
  readonly isLoadingReference: boolean;
  readonly target: BaseModel | undefined;
  loadReference(): Promise<Result<void>>;
}

type BaseType = Model<ReferenceTraits>;

/**
 * A mixin for a Model that acts as a "reference" to another Model, which is its "true"
 * representation. The reference is "dereferenced" to obtain the other model, but only
 * after an optional asynchronous operation is completed. For example, a `CkanCatalogItem`
 * acts as a reference to another type of catalog item. Once the CKAN dataset record is
 * loaded, the `CkanCatalogItem` may be dereferenced to obtain the `WebMapServiceCatalogItem`,
 * `GeoJsonCatalogItem`, or whatever else representing the dataset.
 */
function ReferenceMixin<T extends AbstractConstructor<BaseType>>(Base: T) {
  abstract class ReferenceMixinClass
    extends Base
    implements ReferenceInterface
  {
    /** A "weak" reference has a target which doesn't include the `sourceReference` property.
     * This means the reference is treated more like a shortcut to the target. So share links, for example, will use the target instead of sourceReference. */
    protected readonly weakReference: boolean = false;

    @observable
    private _target: BaseModel | undefined;

    private _referenceLoader = new AsyncLoader(async () => {
      const previousTarget = untracked(() => this._target);
      const target = await this.forceLoadReference(previousTarget);

      if (!target) {
        throw new DeveloperError("Failed to create reference");
      }
      if (target?.uniqueId !== this.uniqueId) {
        throw new DeveloperError(
          "The model returned by `forceLoadReference` must be constructed with its `uniqueId` set to the same value as the Reference model."
        );
      }
      if (!this.weakReference && target?.sourceReference !== this) {
        throw new DeveloperError(
          "The model returned by `forceLoadReference` must be constructed with its `sourceReference` set to the Reference model."
        );
      }
      if (this.weakReference && target?.sourceReference) {
        throw new DeveloperError(
          'This is a "weak" reference, so the model returned by `forceLoadReference` must not have a `sourceReference` set.'
        );
      }
      runInAction(() => {
        this._target = target;
      });
    });

    constructor(...args: any[]) {
      super(...args);
      makeObservable(this);
    }

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
     * If this a nested reference return the target of the final reference.
     */
    @computed
    get nestedTarget(): BaseModel | undefined {
      return ReferenceMixin.isMixedInto(this._target)
        ? this._target.nestedTarget
        : this._target;
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
    async loadReference(forceReload: boolean = false): Promise<Result<void>> {
      const result = (await this._referenceLoader.load(forceReload)).clone(
        `Failed to load reference \`${getName(this)}\``
      );

      if (!result.error && this.target) {
        runInAction(() => {
          // Copy knownContainerUniqueIds to target
          this.knownContainerUniqueIds.forEach((id) =>
            !this.target!.knownContainerUniqueIds.includes(id)
              ? this.target!.knownContainerUniqueIds.push(id)
              : null
          );
        });

        applyItemProperties(this, this.target);
      }

      return result;
    }

    /**
     * Recursively load a nested chain of references till the given maxDepth.
     *
     * If this reference points to another reference and so on.. then this
     * method will load them all up to the given depth.
     *
     * @param maxDepth The maximum depth up to which the references should be resolved.
     * @returns A promise that is fulfilled with a Result value when all the references have been loaded.
     */
    async recursivelyLoadReference(maxDepth: number): Promise<Result<void>> {
      let currentTarget: BaseModel | undefined = this;
      const errors: TerriaError[] = [];
      while (maxDepth > 0 && ReferenceMixin.isMixedInto(currentTarget)) {
        (await currentTarget.loadReference()).pushErrorTo(errors);
        currentTarget = currentTarget.target;
        maxDepth -= 1;
      }
      const maybeError = TerriaError.combine(
        errors,
        "Failed to recursively load reference `${this.uniqueId}`"
      );
      return Result.none(maybeError);
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

  return ReferenceMixinClass;
}

namespace ReferenceMixin {
  export interface Instance
    extends InstanceType<ReturnType<typeof ReferenceMixin>> {}
  export function isMixedInto(model: any): model is Instance {
    return model && "loadReference" in model;
  }
}

export default ReferenceMixin;
