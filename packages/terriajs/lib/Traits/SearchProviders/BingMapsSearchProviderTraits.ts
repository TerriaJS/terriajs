import primitiveTrait from "../Decorators/primitiveTrait";
import mixTraits from "../mixTraits";
import LocationSearchProviderTraits, {
  SearchProviderMapCenterTraits
} from "./LocationSearchProviderTraits";

export default class BingMapsSearchProviderTraits extends mixTraits(
  LocationSearchProviderTraits,
  SearchProviderMapCenterTraits
) {
  url: string = "https://dev.virtualearth.net/";

  @primitiveTrait({
    type: "string",
    name: "Key",
    description: "The Bing Maps key."
  })
  key?: string;

  @primitiveTrait({
    type: "string",
    name: "Primary country",
    description: "Name of the country to prioritize the search results."
  })
  primaryCountry: string = "Australia";

  @primitiveTrait({
    type: "string",
    name: "Culture",
    description: `Use the culture parameter to specify a culture for your request.
    The culture parameter provides the result in the language of the culture.
    For a list of supported cultures, see [Supported Culture Codes](https://docs.microsoft.com/en-us/bingmaps/rest-services/common-parameters-and-types/supported-culture-codes)`
  })
  culture: string = "en-au";

  @primitiveTrait({
    type: "number",
    name: "Max results",
    description: "The maximum number of results to return."
  })
  maxResults: number = 5;
}
