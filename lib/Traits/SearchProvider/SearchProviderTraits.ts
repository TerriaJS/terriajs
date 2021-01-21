import ModelTraits from "../ModelTraits";
import primitiveTrait from "../primitiveTrait";

export default class SearchProviderTraits extends ModelTraits {
  @primitiveTrait({
    type: "string",
    name: "Name",
    description: "Name of the search provider."
  })
  name: string = "unknown";

  @primitiveTrait({
    type: "boolean",
    name: "Open by default",
    description: "Wheter are this search provider results open by default",
    isNullable: true
  })
  openByDefault: boolean = true;

  @primitiveTrait({
    type: "number",
    name: "Minimum characters",
    description: "Minimum number of characters required for search to start",
    isNullable: true
  })
  minCharacters?: number;
}
