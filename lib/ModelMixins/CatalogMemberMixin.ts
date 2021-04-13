import { computed } from "mobx";
import AsyncLoader from "../Core/AsyncLoader";
import Constructor from "../Core/Constructor";
import isDefined from "../Core/isDefined";
import Model from "../Models/Model";
import CatalogMemberTraits from "../Traits/CatalogMemberTraits";
import AccessControlMixin from "./AccessControlMixin";
import GroupMixin from "./GroupMixin";
import MappableMixin from "./MappableMixin";
import ReferenceMixin from "./ReferenceMixin";

type CatalogMember = Model<CatalogMemberTraits>;

function CatalogMemberMixin<T extends Constructor<CatalogMember>>(Base: T) {
  abstract class CatalogMemberMixin extends AccessControlMixin(Base) {
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
        (ReferenceMixin.is(this) && this.isLoadingReference) ||
        (GroupMixin.isMixedInto(this) && this.isLoadingMembers)
      );
    }

    loadMetadata(): Promise<void> {
      return this._metadataLoader.load();
    }

    /**
     * Forces load of the metadata. This method does _not_ need to consider
     * whether the metadata is already loaded.
     *
     * You **can not** make changes to observables until **after** an asynchronous call {@see AsyncLoader}.
     */
    protected async forceLoadMetadata() {}

    get hasCatalogMemberMixin() {
      return true;
    }

    @computed
    get inWorkbench() {
      return this.terria.workbench.contains(this);
    }

    /**
     * Default value for showsInfo (About Data button)
     */
    get showsInfo() {
      return true;
    }

    @computed
    get nameInCatalog(): string | undefined {
      return super.nameInCatalog || this.name;
    }

    @computed
    get nameSortKey() {
      var parts = (this.nameInCatalog || "").split(/(\d+)/);
      return parts.map(function(part) {
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
        (this.description !== undefined && this.description.length > 0) ||
        (this.info !== undefined &&
          this.info.some(info => descriptionRegex.test(info.name || "")))
      );
    }

    @computed
    get infoAsObject() {
      const infoObject: any = {};

      this.info.forEach(infoItem => {
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
        return this.info.filter(infoItem => {
          if (infoItem.name === undefined) return true;
          return sourceInfoItemNames.indexOf(infoItem.name) === -1;
        });
      }
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
  export interface CatalogMemberMixin
    extends InstanceType<ReturnType<typeof CatalogMemberMixin>> {}
  export function isMixedInto(model: any): model is CatalogMemberMixin {
    return model && model.hasCatalogMemberMixin;
  }
}

export default CatalogMemberMixin;
