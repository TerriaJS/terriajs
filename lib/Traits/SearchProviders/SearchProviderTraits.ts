import ModelTraits from "../ModelTraits";
import primitiveTrait from "../Decorators/primitiveTrait";

/* eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging */
class SearchProviderTraits extends ModelTraits {
  @primitiveTrait({
    type: "string",
    name: "Name",
    description: "Name of the search provider."
  })
  name: string = "unknown";

  @primitiveTrait({
    type: "number",
    name: "Minimum characters",
    description:
      "Minimum number of characters required for search to start. If not defined fallbacks to minCharacters value defined as part of searchBarConfig.",
    isNullable: true
  })
  get minCharacters(): number | undefined {
    return;
  }
}

/* eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging */
interface SearchProviderTraits {
  // Add traits here that you want to override from some Mixin or Model class
  // without generating TS2611 type error.
  name: SearchProviderTraits["name"];
  minCharacters: SearchProviderTraits["minCharacters"];
}

export default SearchProviderTraits;
