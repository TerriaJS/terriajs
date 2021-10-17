import primitiveTrait from "../Decorators/primitiveTrait";
import mixTraits from "../mixTraits";
import ModelTraits from "../ModelTraits";
import SearchProviderTraits from "./SearchProviderTraits";

export default class LocationSearchProviderTraits extends mixTraits(
  SearchProviderTraits
) {
  @primitiveTrait({
    type: "string",
    name: "URL",
    description: "The URL of search provider."
  })
  url: string = "";

  @primitiveTrait({
    type: "number",
    name: "recommendedListLength",
    description: "Maximum amount of entries in the suggestion list."
  })
  recommendedListLength: number = 5;

  @primitiveTrait({
    type: "number",
    name: "URL",
    description: "Time to move to the result location.",
    isNullable: true
  })
  flightDurationSeconds?: number = 1.5;

  @primitiveTrait({
    type: "boolean",
    name: "Is open",
    description:
      "True if the search results of this search provider are visible; otherwise, false.",
    isNullable: true
  })
  isOpen: boolean = true;
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
