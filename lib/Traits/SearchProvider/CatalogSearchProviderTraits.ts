import mixTraits from "../mixTraits";
import SearchProviderTraits from "./SearchProviderTraits";
import primitiveTrait from "../Decorators/primitiveTrait";

export default class CatalogSearchProviderTraits extends mixTraits(
  SearchProviderTraits
) {
  @primitiveTrait({
    type: "string",
    name: "Name",
    description: "Name of the search provider."
  })
  name: string = "Catalog items";
}
