import ModelTraits from "../ModelTraits";
import primitiveTrait from "../primitiveTrait";
import SearchProviderTraits from "./SearchProviderTraits";

export default class LocationSearchProviderTraits extends SearchProviderTraits {
  @primitiveTrait({
    type: "string",
    name: "URL",
    description: "The URL of search provider."
  })
  url: string = "";

  @primitiveTrait({
    type: "boolean",
    name: "Open by default",
    description:
      "True if the geocoder should query as the user types to autocomplete."
  })
  autocomplete?: boolean;

  @primitiveTrait({
    type: "number",
    name: "URL",
    description: "Time to move to the result location."
  })
  flightDurationSeconds?: number;
}

export class SearchProviderMapCenterTraits extends ModelTraits {
  @primitiveTrait({
    type: "boolean",
    name: "Map center",
    description:
      "Whether the current location of the map center is supplied with search request"
  })
  mapCenter: boolean = true;
}
