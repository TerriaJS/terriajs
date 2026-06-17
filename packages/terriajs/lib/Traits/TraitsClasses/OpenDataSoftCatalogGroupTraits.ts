import CatalogMemberTraits from "./CatalogMemberTraits";
import GroupTraits from "./GroupTraits";
import mixTraits from "../mixTraits";
import ModelTraits from "../ModelTraits";
import objectArrayTrait from "../Decorators/objectArrayTrait";
import primitiveTrait from "../Decorators/primitiveTrait";
import UrlTraits from "./UrlTraits";
import LegendOwnerTraits from "./LegendOwnerTraits";
import { traitClass } from "../Trait";

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

@traitClass({
  description: `Creates one catalog group from url that points to an opendatasoft service.`,
  example: {
    name: "opendatasoft-group example",
    type: "opendatasoft-group",
    url: "https://data.bmcc.nsw.gov.au",
    facetFilters: [
      {
        name: "features",
        value: "geo"
      }
    ],
    id: "some unique id"
  }
})
export default class OpenDataSoftCatalogGroupTraits extends mixTraits(
  UrlTraits,
  CatalogMemberTraits,
  LegendOwnerTraits,
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
