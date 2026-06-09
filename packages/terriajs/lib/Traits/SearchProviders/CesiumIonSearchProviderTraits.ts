import primitiveTrait from "../Decorators/primitiveTrait";
import mixTraits from "../mixTraits";
import LocationSearchProviderTraits, {
  SearchProviderMapCenterTraits
} from "./LocationSearchProviderTraits";

export default class CesiumIonSearchProviderTraits extends mixTraits(
  LocationSearchProviderTraits,
  SearchProviderMapCenterTraits
) {
  url: string = "https://api.cesium.com/v1/geocode/search";

  @primitiveTrait({
    type: "string",
    name: "Key",
    description:
      "The Cesium ION key. If not provided, will try to use the global cesium ion key."
  })
  key?: string;
}
