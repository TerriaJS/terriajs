import primitiveTrait from "../Decorators/primitiveTrait";
import mixTraits from "../mixTraits";
import SearchProviderTraits from "./SearchProviderTraits";

export default class CatalogSearchProviderTraits extends mixTraits(
  SearchProviderTraits
) {
  @primitiveTrait({
    type: "string",
    name: "Name",
    description: "Name of the search provider."
  })
  name: string = "Catalog items";

  @primitiveTrait({
    type: "number",
    name: "Debounce duration",
    description:
      "The debounce duration (in milliseconds) to apply to search input once the provider is loaded. This is applied to prevent excessive searching while the user is typing. The default value is 300ms."
  })
  debounceDuration?: number = 300;
}
