import { computed } from "mobx";
import Constructor from "../Core/Constructor";
import Model from "../Models/Definition/Model";
import StratumOrder from "../Models/Definition/StratumOrder";
import GetCapabilitiesTraits from "../Traits/TraitsClasses/GetCapabilitiesTraits";

type CapabilitiesModel = Model<GetCapabilitiesTraits>;

function GetCapabilitiesMixin<T extends Constructor<CapabilitiesModel>>(
  Base: T
) {
  abstract class GetCapabilitiesMixin extends Base {
    protected abstract get defaultGetCapabilitiesUrl(): string | undefined;

    protected getCapabilitiesUrlOverride(traitValue: string | undefined) {
      if (traitValue !== undefined) {
        return traitValue;
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
