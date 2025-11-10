import primitiveTrait from "../Decorators/primitiveTrait";
import mixTraits from "../mixTraits";
import LocationSearchProviderTraits, {
  SearchProviderMapCenterTraits
} from "./LocationSearchProviderTraits";

export default class NominatimSearchProviderTraits extends mixTraits(
  LocationSearchProviderTraits,
  SearchProviderMapCenterTraits
) {
  url: string = "//nominatim.openstreetmap.org/search";

  @primitiveTrait({
    type: "string",
    name: "Key",
    description: "The Nominatim key."
  })
  key?: string;

  @primitiveTrait({
    type: "string",
    name: "Primary country",
    description: "Name of the country to prioritize the search results."
  })
  countryCodes?: string;

  @primitiveTrait({
    type: "number",
    name: "Max results",
    description: "The maximum number of results to return."
  })
  maxResults: number = 5;

  attributions: string[] = [
    "© <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap contributors</a>"
  ];
}
