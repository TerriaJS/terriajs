import { computed, makeObservable } from "mobx";
import { fromPromise } from "mobx-utils";
import AbstractConstructor from "../../Core/AbstractConstructor";
import isDefined from "../../Core/isDefined";
import Model from "../../Models/Definition/Model";
import SearchProviderTraits from "../../Traits/SearchProviders/SearchProviderTraits";
import SearchProviderMixin from "./SearchProviderMixin";

type CatalogSearchProviderModel = Model<SearchProviderTraits>;

function CatalogSearchProviderMixin<
  T extends AbstractConstructor<CatalogSearchProviderModel>
>(Base: T) {
  abstract class CatalogSearchProviderMixin extends SearchProviderMixin(Base) {
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

    get hasCatalogSearchProviderMixin() {
      return true;
    }
  }

  return CatalogSearchProviderMixin;
}

namespace CatalogSearchProviderMixin {
  export interface Instance
    extends InstanceType<ReturnType<typeof CatalogSearchProviderMixin>> {}

  export function isMixedInto(model: any): model is Instance {
    return model && model.hasCatalogSearchProviderMixin;
  }
}

export default CatalogSearchProviderMixin;
