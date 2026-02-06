import primitiveTrait from "../Decorators/primitiveTrait";
import mixTraits from "../mixTraits";
import SearchProviderTraits from "./SearchProviderTraits";

export default class CatalogItemsSearchProviderTraits extends mixTraits(
  SearchProviderTraits
) {
  @primitiveTrait({
    type: "string",
    name: "Name",
    description: "Name of the search item provider."
  })
  name: string = "Catalog items";
}
