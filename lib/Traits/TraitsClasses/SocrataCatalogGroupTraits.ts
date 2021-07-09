import { JsonObject } from "../../Core/Json";
import anyTrait from "../Decorators/anyTrait";
import objectArrayTrait from "../Decorators/objectArrayTrait";
import primitiveArrayTrait from "../Decorators/primitiveArrayTrait";
import primitiveTrait from "../Decorators/primitiveTrait";
import mixTraits from "../mixTraits";
import ModelTraits from "../ModelTraits";
import CatalogMemberTraits from "./CatalogMemberTraits";
import GroupTraits from "./GroupTraits";
import UrlTraits from "./UrlTraits";

export class FacetFilterTraits extends ModelTraits {
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

export default class SocrataCatalogGroupTraits extends mixTraits(
  UrlTraits,
  CatalogMemberTraits,
  GroupTraits
) {
  @primitiveArrayTrait({
    name: "Facet groups",
    description:
      "Facets to include in group structure. By default, `tags` and `categories` will be used,",
    type: "string"
  })
  facetGroups: string[] = ["tags", "categories"];

  @objectArrayTrait({
    name: "Facets filter",
    type: FacetFilterTraits,
    description: "Facets (key/value pairs) to use to filter datasets.",
    idProperty: "name"
  })
  facetFilters?: FacetFilterTraits[];

  @anyTrait({
    name: "Filter Query",
    description: `Gets or sets the filter query to pass to Socrata when querying the available data sources and their groups.`
  })
  filterQuery: JsonObject = {};
}
