import { computed, observable, runInAction } from "mobx";
import Constructor from "../Core/Constructor";
import Model from "../Models/Model";
import CatalogMemberTraits from "../Traits/CatalogMemberTraits";
import { createTransformer } from "mobx-utils";
import AsyncLoader from "../Core/AsyncLoader";

type CatalogMember = Model<CatalogMemberTraits>;

function CatalogMemberMixin<T extends Constructor<CatalogMember>>(Base: T) {
  abstract class CatalogMemberMixin extends Base {
    abstract get type(): string;

    private _metadataLoader = new AsyncLoader(
      this.forceLoadMetadata.bind(this)
    );

    /**
     * Gets a value indicating whether metadata is currently loading.
     */
    get isLoadingMetadata(): boolean {
      return this._metadataLoader.isLoading;
    }

    loadMetadata(): Promise<void> {
      return this._metadataLoader.load();
    }

    /**
     * Forces load of the metadata. This method does _not_ need to consider
     * whether the metadata is already loaded.
     */
    protected abstract forceLoadMetadata(): Promise<void>;

    get hasCatalogMemberMixin() {
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
