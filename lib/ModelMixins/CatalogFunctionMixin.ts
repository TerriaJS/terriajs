import Constructor from "../Core/Constructor";
import Model from "../Models/Model";
import CatalogFunctionTraits from "../Traits/CatalogFunctionTraits";
import CatalogMemberMixin from "./CatalogMemberMixin";
import FunctionParameter from "../Models/FunctionParameters/FunctionParameter";

type CatalogFunctionMixin = Model<CatalogFunctionTraits>;

function CatalogFunctionMixin<T extends Constructor<CatalogFunctionMixin>>(
  Base: T
) {
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
