import ModelTraits from "../ModelTraits";
import primitiveTrait from "../Decorators/primitiveTrait";

export default class SearchProviderTraits extends ModelTraits {
  @primitiveTrait({
    type: "string",
    name: "Name",
    description: "Name of the search provider."
  })
  name: string = "unknown";

  @primitiveTrait({
    type: "number",
    name: "Minimum characters",
    description: "Minimum number of characters required for search to start",
    isNullable: true
  })
  minCharacters?: number;
}
