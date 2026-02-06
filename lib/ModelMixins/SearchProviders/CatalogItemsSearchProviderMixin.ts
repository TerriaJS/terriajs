import { computed, makeObservable } from "mobx";
import { fromPromise } from "mobx-utils";
import AbstractConstructor from "../../Core/AbstractConstructor";
import isDefined from "../../Core/isDefined";
import Model from "../../Models/Definition/Model";
import SearchProviderTraits from "../../Traits/SearchProviders/SearchProviderTraits";
import SearchProviderMixin from "./SearchProviderMixin";

type CatalogItemsSearchProviderModel = Model<SearchProviderTraits>;

function CatalogItemsSearchProviderMixin<
  T extends AbstractConstructor<CatalogItemsSearchProviderModel>
>(Base: T) {
  abstract class CatalogItemsSearchProviderMixin extends SearchProviderMixin(
    Base
  ) {
    constructor(...args: any[]) {
      super(...args);
      makeObservable(this);
    }

    @computed get resultsAreReferences() {
      return (
        isDefined(this.terria.catalogIndex?.loadPromise) &&
        fromPromise(this.terria.catalogIndex!.loadPromise).state === "fulfilled"
      );
    }

    get hasCatalogItemsSearchProviderMixin() {
      return true;
    }
  }

  return CatalogItemsSearchProviderMixin;
}

namespace CatalogItemsSearchProviderMixin {
  export interface Instance
    extends InstanceType<ReturnType<typeof CatalogItemsSearchProviderMixin>> {}

  export function isMixedInto(model: any): model is Instance {
    return model && model.hasCatalogItemsSearchProviderMixin;
  }
}

export default CatalogItemsSearchProviderMixin;
