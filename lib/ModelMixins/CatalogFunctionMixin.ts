import Constructor from "../Core/Constructor";
import Model from "../Models/Model";
import CatalogFunctionTraits from "../Traits/CatalogFunctionTraits";
import CatalogMemberMixin from "./CatalogMemberMixin";
import FunctionParameter from "../Models/FunctionParameter";
import { runInAction } from "mobx";
import CommonStrata from "../Models/CommonStrata";
import createStratumInstance from "../Models/createStratumInstance";
import { InfoSectionTraits } from "../Traits/CatalogMemberTraits";
import isDefined from "../Core/isDefined";
import CatalogFunctionJobMixin from "./CatalogFunctionJobMixin";


type CatalogFunctionMixin = Model<CatalogFunctionTraits>;

function CatalogFunctionMixin<T extends Constructor<CatalogFunctionMixin>>(Base: T) {
  abstract class CatalogFunctionMixin extends CatalogMemberMixin(Base) {
    abstract async invoke(): Promise<void>;

    abstract get functionParameters(): FunctionParameter[];

    get hasCatalogFunctionMixin() {
      return true;
    }
  }

  return CatalogFunctionMixin;
}

namespace CatalogFunctionMixin {
  export interface CatalogFunctionMixin
    extends InstanceType<ReturnType<typeof CatalogFunctionMixin>> {}
  export function isMixedInto(model: any): model is CatalogFunctionMixin {
    return model && model.hasCatalogFunctionMixin;
  }
}

export default CatalogFunctionMixin;
