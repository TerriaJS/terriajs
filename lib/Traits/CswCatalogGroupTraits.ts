import { JsonObject } from "../Core/Json";
import anyTrait from "./anyTrait";
import CatalogMemberTraits from "./CatalogMemberTraits";
import GetCapabilitiesTraits from "./GetCapabilitiesTraits";
import GroupTraits from "./GroupTraits";
import mixTraits from "./mixTraits";
import ModelTraits from "./ModelTraits";
import objectTrait from "./objectTrait";
import primitiveTrait from "./primitiveTrait";
import UrlTraits from "./UrlTraits";

export class DomainSpecTraits extends ModelTraits {
  @primitiveTrait({
    type: "string",
    name: "Domain Property Name",
    description: "Domain Property Name."
  })
  domainPropertyName?: string;
  @primitiveTrait({
    type: "string",
    name: "Hierarchy Seperator",
    description: "Hierarchy Seperator."
  })
  hierarchySeparator?: string;
  @primitiveTrait({
    type: "string",
    name: "Query Property Name",
    description: "Query Property Name."
  })
  queryPropertyName?: string;
}

export default class CswCatalogGroupTraits extends mixTraits(
  GetCapabilitiesTraits,
  GroupTraits,
  UrlTraits,
  CatalogMemberTraits
) {
  @primitiveTrait({
    type: "boolean",
    name: "Flatten",
    description:
      "True to flatten the layers into a single list; false to use the layer hierarchy."
  })
  flatten?: boolean;

  @anyTrait({
    name: "Item Properties",
    description: "Sets traits on records"
  })
  itemProperties?: JsonObject;

  @objectTrait({
    type: DomainSpecTraits,
    name: "Domain Specification",
    description: "Domain Specification"
  })
  domainSpecification?: DomainSpecTraits;
}
