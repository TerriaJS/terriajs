import { action, computed, isObservableArray, runInAction, toJS } from "mobx";
import Mustache from "mustache";
import AsyncLoader from "../Core/AsyncLoader";
import Constructor from "../Core/Constructor";
import isDefined from "../Core/isDefined";
import { isJsonObject, isJsonString, JsonObject } from "../Core/Json";
import Result from "../Core/Result";
import hasTraits from "../Models/Definition/hasTraits";
import Model, { BaseModel } from "../Models/Definition/Model";
import updateModelFromJson from "../Models/Definition/updateModelFromJson";
import SelectableDimensions, {
  SelectableDimension
} from "../Models/SelectableDimensions/SelectableDimensions";
import ViewingControls, { ViewingControl } from "../Models/ViewingControls";
import CatalogMemberReferenceTraits from "../Traits/TraitsClasses/CatalogMemberReferenceTraits";
import CatalogMemberTraits from "../Traits/TraitsClasses/CatalogMemberTraits";
import AccessControlMixin from "./AccessControlMixin";
import GroupMixin from "./GroupMixin";
import MappableMixin from "./MappableMixin";
import ReferenceMixin from "./ReferenceMixin";

type CatalogMember = Model<CatalogMemberTraits>;

function CatalogMemberMixin<T extends Constructor<CatalogMember>>(Base: T) {
  abstract class CatalogMemberMixin
    extends AccessControlMixin(Base)
    implements SelectableDimensions, ViewingControls
  {
    abstract get type(): string;

    // The names of items in the CatalogMember's info array that contain details of the source of this CatalogMember's data.
    // This should be overridden by children of this class. For an example see the WebMapServiceCatalogItem
    _sourceInfoItemNames: string[] | undefined = undefined;

    get typeName(): string | undefined {
      return;
    }

    private _metadataLoader = new AsyncLoader(
      this.forceLoadMetadata.bind(this)
    );

    get loadMetadataResult() {
      return this._metadataLoader.result;
    }

    /**
     * Gets a value indicating whether metadata is currently loading.
     */
    get isLoadingMetadata(): boolean {
      return this._metadataLoader.isLoading;
    }

    @computed
    get isLoading() {
      return (
        this.isLoadingMetadata ||
        (MappableMixin.isMixedInto(this) && this.isLoadingMapItems) ||
        (ReferenceMixin.isMixedInto(this) && this.isLoadingReference) ||
        (GroupMixin.isMixedInto(this) && this.isLoadingMembers)
      );
    }

    /** Calls AsyncLoader to load metadata. It is safe to call this as often as necessary.
     * If metadata is already loaded or already loading, it will
     * return the existing promise.
     *
     * This returns a Result object, it will contain errors if they occur - they will not be thrown.
     * To throw errors, use `(await loadMetadata()).throwIfError()`
     *
     * {@see AsyncLoader}
     */
    async loadMetadata(): Promise<Result<void>> {
      return (await this._metadataLoader.load()).clone({
        message: `Failed to load \`${getName(this)}\` metadata`,
        importance: -1
      });
    }

    /**
     * Forces load of the metadata. This method does _not_ need to consider
     * whether the metadata is already loaded.
     *
     * You **can not** make changes to observables until **after** an asynchronous call {@see AsyncLoader}.
     *
     * Errors can be thrown here.
     *
     * {@see AsyncLoader}
     */
    protected async forceLoadMetadata() {}

    get hasCatalogMemberMixin() {
      return true;
    }

    @computed
    get inWorkbench() {
      return this.terria.workbench.contains(this);
    }

    @computed
    get name(): string | undefined {
      return super.name || this.uniqueId;
    }

    @computed
    get nameInCatalog(): string | undefined {
      return super.nameInCatalog || this.name;
    }

    @computed
    get nameSortKey() {
      var parts = (this.nameInCatalog || "").split(/(\d+)/);
      return parts.map(function (part) {
        var parsed = parseInt(part, 10);
        if (parsed === parsed) {
          return parsed;
        } else {
          return part.trim().toLowerCase();
        }
      });
    }

    @computed
    get hasDescription(): boolean {
      return (
        (isJsonString(this.description) && this.description.length > 0) ||
        (isObservableArray(this.info) &&
          this.info.some((info) => descriptionRegex.test(info.name || "")))
      );
    }

    @computed
    get infoAsObject() {
      const infoObject: any = {};

      this.info.forEach((infoItem) => {
        if (infoItem.name !== undefined && infoItem.name.length > 0) {
          const infoNameNoSpaces = infoItem.name.replace(/ /g, "");
          if (
            isDefined(infoItem.content) &&
            !isDefined(infoObject[infoNameNoSpaces])
          ) {
            infoObject[infoNameNoSpaces] = infoItem.content;
          } else if (isDefined(infoItem.contentAsObject)) {
            infoObject[infoNameNoSpaces] = infoItem.contentAsObject;
          }
        }
      });

      return infoObject;
    }

    @computed
    get infoWithoutSources() {
      const sourceInfoItemNames = this._sourceInfoItemNames;
      if (sourceInfoItemNames === undefined) {
        return this.info;
      } else {
        return this.info.filter((infoItem) => {
          if (infoItem.name === undefined) return true;
          return sourceInfoItemNames.indexOf(infoItem.name) === -1;
        });
      }
    }

    /** Converts modelDimensions to selectableDimensions
     * This will apply modelDimension JSON value to user stratum
     */
    @computed
    get selectableDimensions(): SelectableDimension[] {
      return (
        this.modelDimensions.map((dim) => ({
          id: dim.id,
          name: dim.name,
          selectedId: dim.selectedId,
          disable: dim.disable,
          allowUndefined: dim.allowUndefined,
          options: dim.options,

          setDimensionValue: (stratumId: string, selectedId: string) => {
            runInAction(() =>
              dim.setTrait(stratumId, "selectedId", selectedId)
            );
            const value = dim.options.find((o) => o.id === selectedId)?.value;
            if (isDefined(value)) {
              const result = updateModelFromJson(
                this,
                stratumId,
                mustacheNestedJsonObject(toJS(value), this)
              );

              result.raiseError(
                this.terria,
                `Failed to update catalog item ${getName(this)}`
              );

              // If no error then call loadMapItems
              if (!result.error && MappableMixin.isMixedInto(this)) {
                this.loadMapItems().then((loadMapItemsResult) => {
                  loadMapItemsResult.raiseError(this.terria);
                });
              }
            }
          }
        })) ?? []
      );
    }

    @computed get viewingControls(): ViewingControl[] {
      return [];
    }

    dispose() {
      super.dispose();
      this._metadataLoader.dispose();
    }
  }

  return CatalogMemberMixin;
}

const descriptionRegex = /description/i;

namespace CatalogMemberMixin {
  export interface Instance
    extends InstanceType<ReturnType<typeof CatalogMemberMixin>> {}
  export function isMixedInto(model: any): model is Instance {
    return model && model.hasCatalogMemberMixin;
  }
}

export default CatalogMemberMixin;

/** Convenience function to get user readable name of a BaseModel */
export const getName = action((model: BaseModel | undefined) => {
  return (
    (CatalogMemberMixin.isMixedInto(model) ? model.name : undefined) ??
    (hasTraits(model, CatalogMemberReferenceTraits, "name")
      ? model.name
      : undefined) ??
    model?.uniqueId ??
    "Unknown model"
  );
});

/** Recursively apply mustache template to all nested string properties in a JSON Object */
function mustacheNestedJsonObject(obj: JsonObject, view: any) {
  return Object.entries(obj).reduce<JsonObject>((acc, [key, value]) => {
    if (isJsonString(value)) {
      acc[key] = Mustache.render(value, view);
    } else if (isJsonObject(value, false)) {
      acc[key] = mustacheNestedJsonObject(value, view);
    } else {
      acc[key] = value;
    }
    return acc;
  }, {});
}
