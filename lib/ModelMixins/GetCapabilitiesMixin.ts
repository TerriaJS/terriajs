import Constructor from "../Core/Constructor";
import Model from "../Models/Definition/Model";
import { TraitOverrides } from "../Models/Definition/ModelPropertiesFromTraits";
import StratumOrder from "../Models/Definition/StratumOrder";
import GetCapabilitiesTraits from "../Traits/TraitsClasses/GetCapabilitiesTraits";

type CapabilitiesModel = Model<GetCapabilitiesTraits>;

function GetCapabilitiesMixin<T extends Constructor<CapabilitiesModel>>(
  Base: T
) {
  abstract class GetCapabilitiesMixin extends Base {
    get _newTraitOverrides(): TraitOverrides<GetCapabilitiesTraits> {
      const superOverrides = super._newTraitOverrides;
      return {
        ...superOverrides,
        getCapabilitiesUrl: () => {
          const value = superOverrides.getCapabilitiesUrl();
          if (value !== undefined) {
            return value;
          } else {
            return this.defaultGetCapabilitiesUrl;
          }
        }
      };
    }

    protected abstract get defaultGetCapabilitiesUrl(): string | undefined;
  }
  return GetCapabilitiesMixin;
}

namespace GetCapabilitiesMixin {
  export const getCapabilitiesStratumName = "getCapabilities";
  StratumOrder.addLoadStratum(getCapabilitiesStratumName);
}

export default GetCapabilitiesMixin;
