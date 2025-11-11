import primitiveArrayTrait from "../Decorators/primitiveArrayTrait";
import primitiveTrait from "../Decorators/primitiveTrait";
import mixTraits from "../mixTraits";
import ModelTraits from "../ModelTraits";
import SearchProviderTraits from "./SearchProviderTraits";

/* eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging */
class LocationSearchProviderTraits extends mixTraits(SearchProviderTraits) {
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

  @primitiveArrayTrait({
    type: "string",
    name: "Attribution",
    description: "The attribution text for this search provider.",
    isNullable: true
  })
  attributions: string[] = [];

  @primitiveTrait({
    type: "boolean",
    name: "Autocomplete enabled",
    description:
      "Whether the autocomplete is supported for this search provider"
  })
  get autocompleteEnabled() {
    return true;
  }
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

/* eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging */
interface LocationSearchProviderTraits {
  // Add traits here that you want to override from some Mixin or Model class
  // without generating TS2611 type error.
  autocompleteEnabled: LocationSearchProviderTraits["autocompleteEnabled"];
}

export default LocationSearchProviderTraits;
