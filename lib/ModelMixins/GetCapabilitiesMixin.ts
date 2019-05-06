import { computed } from "mobx";
import Constructor from "../Core/Constructor";
import Model from "../Models/Model";
import StratumOrder from "../Models/StratumOrder";
import GetCapabilitiesTraits from "../Traits/GetCapabilitiesTraits";

type CapabilitiesModel = Model<GetCapabilitiesTraits>;

function GetCapabilitiesMixin<T extends Constructor<CapabilitiesModel>>(
  Base: T
) {
  abstract class GetCapabilitiesMixin extends Base {
    protected abstract get defaultGetCapabilitiesUrl(): string | undefined;

    @computed
    get getCapabilitiesUrl(): string | undefined {
      const getCapabilitiesUrl = this.flattened.getCapabilitiesUrl;
      if (getCapabilitiesUrl) {
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
