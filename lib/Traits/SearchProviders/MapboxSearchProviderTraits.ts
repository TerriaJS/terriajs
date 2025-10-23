import primitiveTrait from "../Decorators/primitiveTrait";
import mixTraits from "../mixTraits";
import LocationSearchProviderTraits, {
  SearchProviderMapCenterTraits
} from "./LocationSearchProviderTraits";

export default class MapboxSearchProviderTraits extends mixTraits(
  LocationSearchProviderTraits,
  SearchProviderMapCenterTraits
) {
  url: string = "https://api.mapbox.com/search/geocode/v6/";

  @primitiveTrait({
    type: "string",
    name: "Access Token",
    description: "All geocoding requests must include an access token."
  })
  accessToken?: string;

  @primitiveTrait({
    type: "boolean",
    name: "partialMatch",
    description: `Specify whether to return partial match results. 
    When partialMatch is enabled, results will be included that 
    start with the requested string, rather than responses that match it exactly.`
  })
  partialMatch?: boolean = true;

  @primitiveTrait({
    type: "string",
    name: "Country",
    description: "A comma-separated list of ISO 3166 alpha 2 country codes."
  })
  country?: string;

  @primitiveTrait({
    type: "string",
    name: "Language",
    description:
      "The ISO language code to be returned. If not provided, the default is English."
  })
  language: string = "en";

  @primitiveTrait({
    type: "number",
    name: "Limit",
    description: "The number of results to return, up to 10."
  })
  limit: number = 5;

  @primitiveTrait({
    type: "string",
    name: "Types",
    description: `Limit results to one or more types of features, provided as a comma-separated
     list. Pass one or more of the type names as a comma separated list. If no types are specified, 
      all possible types may be returned. Available types are: country, region, postcode, district, 
      place, city, locality, neighborhood, street, address, poi, and category. See the 
      [Administrative unit types](https://docs.mapbox.com/api/search/search-box/#administrative-unit-types) 
      section for details about these types.`
  })
  types?: string;

  @primitiveTrait({
    type: "string",
    name: "Worldview",
    description: `Returns features that are defined differently by audiences that belong to various regional,
     cultural, or political groups. Available worldviews are: ar,cn,in,jp,ma,rs,ru,tr,us. If worldview is not 
     set, the us worldview boundaries are returned by default. For more information about using the worldview 
     parameter, see the [worldviews section](https://docs.mapbox.com/api/search/geocoding/#worldviews).`
  })
  worldview?: string;

  @primitiveTrait({
    type: "boolean",
    name: "latLonSearchOrder",
    description: `When the user searches using coordinates, should the order be 'latitude, longitude'
    the default is true, which is familar with most users from other platforms.`
  })
  latLonSearchOrder?: boolean = true;

  @primitiveTrait({
    type: "boolean",
    name: "showCoordinatesInReverseGeocodeResult",
    description: `When the user searches using coordinates, the first result in the list will be the
    coordinate location. If using in conjunction with another search provider, this behaviour may not
    be desired. Defaults to true.`
  })
  showCoordinatesInReverseGeocodeResult?: boolean = true;
}
