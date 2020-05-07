import Constructor from "../Core/Constructor";
import Model from "../Models/Model";
import CatalogFunctionTraits from "../Traits/CatalogFunctionTraits";
import { runInAction, observable } from "mobx";
import CatalogFunctionMixin from "./CatalogFunctionMixin";
import CatalogMemberMixin from "./CatalogMemberMixin";

type CatalogFunction = Model<CatalogFunctionTraits>;

function CatalogFunctionJobMixin<T extends Constructor<CatalogFunction>>(Base: T) {
  abstract class CatalogFunctionJobMixin extends CatalogMemberMixin(Base) {
    @observable showsInfo = false;
    @observable isMappable = false;
  
    loadPromise = Promise.resolve();
  
    protected forceLoadMetadata() {
      return this.loadPromise;
    }

    get hasCatalogFunctionJobMixin() {
      return true;
    }
  }

  return CatalogFunctionJobMixin;
}

namespace CatalogFunctionJobMixin {
  export interface CatalogFunctionJobMixin
    extends InstanceType<ReturnType<typeof CatalogFunctionJobMixin>> {}
  export function isMixedInto(model: any): model is CatalogFunctionJobMixin {
    return model && model.hasCatalogFunctionJobMixin;
  }
}

export default CatalogFunctionJobMixin;
