import primitiveTrait from "../Decorators/primitiveTrait";
import mixTraits from "../mixTraits";
import LocationSearchProviderTraits from "./LocationSearchProviderTraits";

export default class WebFeatureServiceSearchProviderTraits extends mixTraits(
  LocationSearchProviderTraits
) {
  @primitiveTrait({
    type: "string",
    name: "Search property name",
    description: "Which property to look for the search text in"
  })
  searchPropertyName?: string;

  @primitiveTrait({
    type: "string",
    name: "Search property type name",
    description: "Type of the properties to search"
  })
  searchPropertyTypeName?: string;
}
