import { JsonObject } from "../Core/Json";
import anyTrait from "./anyTrait";
import ModelTraits from "./ModelTraits";
import objectTrait from "./objectTrait";
import primitiveTrait from "./primitiveTrait";

export class ItemSearchTraits extends ModelTraits {
  @primitiveTrait({
    type: "string",
    name: "providerType",
    description: "The type of the search provider."
  })
  providerType?: string;

  @anyTrait({
    name: "options",
    description: "Options for the search provider."
  })
  options?: JsonObject;

  @primitiveTrait({
    type: "string",
    name: "resultTemplate",
    description:
      "Template string to format the item result. You can pass a mustache template and refer to variables in {@ItemSearchResult.properties}. The template can also have HTML markup or markdown formatting."
  })
  resultTemplate?: string;

  @primitiveTrait({
    type: "string",
    name: "highlightColor",
    description:
      "A color to use for highlighting the selected result. Defaults to {@HighlightColorTraits.highlightColor} or {@Terria.baseMapContrastColor}"
  })
  highlightColor?: string;
}

export default class SearchableItemTraits extends ModelTraits {
  @objectTrait({
    type: ItemSearchTraits,
    name: "search",
    description: "Item search configuration"
  })
  search?: ItemSearchTraits;
}
