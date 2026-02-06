import ModelTraits from "../ModelTraits";
import primitiveTrait from "../Decorators/primitiveTrait";
import objectTrait from "../Decorators/objectTrait";

export class SearchableWebCatalogItemTraits extends ModelTraits {
  @primitiveTrait({
    type: "string",
    name: "url",
    description: "The url of the search webservice"
  })
  url: string | undefined;

  @primitiveTrait({
    type: "string",
    name: "returnFields",
    description: "The fields to return from webservice (separated by comma)"
  })
  returnFields: string | undefined;
}

export default class SearchableCatalogItemTraits extends ModelTraits {
  @primitiveTrait({
    type: "string",
    name: "nameOfCatalogItemSearchField",
    description: "The field in which to search for vector layers"
  })
  nameOfCatalogItemSearchField?: string = "";

  @objectTrait({
    type: SearchableWebCatalogItemTraits,
    name: "catalogItemWebSearch",
    description: "Data of the query webservice"
  })
  catalogItemWebSearch?: SearchableWebCatalogItemTraits;
}
