import CatalogMemberTraits from "./CatalogMemberTraits";
import GroupTraits from "./GroupTraits";
import mixTraits from "../mixTraits";
import ModelTraits from "../ModelTraits";
import objectArrayTrait from "../Decorators/objectArrayTrait";
import primitiveTrait from "../Decorators/primitiveTrait";
import UrlTraits from "./UrlTraits";

export class RefineTraits extends ModelTraits {
  @primitiveTrait({
    name: "Facet name",
    type: "string",
    description: "Name of facet"
  })
  name?: string;

  @primitiveTrait({
    name: "Facet value",
    type: "string",
    description: "Value of facet to use as filter"
  })
  value?: string;
}

export default class OpenDataSoftCatalogGroupTraits extends mixTraits(
  UrlTraits,
  CatalogMemberTraits,
  GroupTraits
) {
  @primitiveTrait({
    type: "boolean",
    name: "Flatten",
    description:
      "True to flatten the layers into a single list; false to use the layer hierarchy."
  })
  flatten?: boolean = false;

  @objectArrayTrait({
    name: "Facets filter",
    type: RefineTraits,
    description: "Facets (key/value pairs) to use to filter datasets.",
    idProperty: "name"
  })
  facetFilters?: RefineTraits[];
}
