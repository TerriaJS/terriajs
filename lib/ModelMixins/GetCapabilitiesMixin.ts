import { computed, makeObservable, override } from "mobx";
import AbstractConstructor from "../Core/AbstractConstructor";
import Model from "../Models/Definition/Model";
import StratumOrder from "../Models/Definition/StratumOrder";
import GetCapabilitiesTraits from "../Traits/TraitsClasses/GetCapabilitiesTraits";

type BaseType = Model<GetCapabilitiesTraits>;

function GetCapabilitiesMixin<T extends AbstractConstructor<BaseType>>(
  Base: T
) {
  abstract class GetCapabilitiesMixin extends Base {
    protected abstract get defaultGetCapabilitiesUrl(): string | undefined;

    constructor(...args: any[]) {
      super(...args);
      makeObservable(this);
    }

    @override
    get getCapabilitiesUrl(): string | undefined {
      const getCapabilitiesUrl = super.getCapabilitiesUrl;
      if (getCapabilitiesUrl !== undefined) {
        return getCapabilitiesUrl;
      } else {
        return this.defaultGetCapabilitiesUrl;
      }
    }
  }
  return GetCapabilitiesMixin;
}

namespace GetCapabilitiesMixin {
  export const getCapabilitiesStratumName = "getCapabilities";
  StratumOrder.addLoadStratum(getCapabilitiesStratumName);
}

export default GetCapabilitiesMixin;
