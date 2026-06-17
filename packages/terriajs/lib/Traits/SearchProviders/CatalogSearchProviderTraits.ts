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
}
