import { JsonObject } from "../../Core/Json";
import anyTrait from "../Decorators/anyTrait";
import ModelTraits from "../ModelTraits";
import objectArrayTrait from "../Decorators/objectArrayTrait";
import objectTrait from "../Decorators/objectTrait";
import primitiveTrait from "../Decorators/primitiveTrait";

export class SearchParameterTraits extends ModelTraits {
  @primitiveTrait({
    type: "string",
    name: "id",
    description: "ID of the search parameter"
  })
  id?: string;

  @primitiveTrait({
    type: "string",
    name: "Name",
    description: "A human readable name for the search parameter"
  })
  name?: string;

  @anyTrait({
    name: "queryOptions",
    description:
      "Options used when querying the parameter, these options will be passed to the index used for querying the parameter."
  })
  queryOptions?: any;
}

export class ItemSearchTraits extends ModelTraits {
  @primitiveTrait({
    type: "string",
    name: "providerType",
    description: "The type of the search provider."
  })
  providerType?: string;

  @anyTrait({
    name: "providerOptions",
    description: "Options for the search provider."
  })
  providerOptions?: JsonObject;

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

  @objectArrayTrait({
    type: SearchParameterTraits,
    name: "Search parameters",
    description: "Search parameter configurations",
    idProperty: "id"
  })
  parameters?: SearchParameterTraits[];
}

export default class SearchableItemTraits extends ModelTraits {
  @objectTrait({
    type: ItemSearchTraits,
    name: "search",
    description: "Item search configuration"
  })
  search?: ItemSearchTraits;
}
