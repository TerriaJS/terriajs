import ModelTraits from "../ModelTraits";
import primitiveTrait from "../Decorators/primitiveTrait";

export default class GetCapabilitiesTraits extends ModelTraits {
  @primitiveTrait({
    type: "string",
    name: "GetCapabilities URL",
    description:
      "The URL at which to access to the OGC GetCapabilities service."
  })
  getCapabilitiesUrl?: string;

  @primitiveTrait({
    type: "string",
    name: "GetCapabilities Cache Duration",
    description: "The amount of time to cache GetCapabilities responses."
  })
  getCapabilitiesCacheDuration: string = "1d";
}
