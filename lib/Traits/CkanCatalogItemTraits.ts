import CatalogMemberTraits from "./CatalogMemberTraits";
import MappableTraits from "./MappableTraits";
import DataCustodianTraits from "./DataCustodianTraits";
import mixTraits from "./mixTraits";
import UrlTraits from "./UrlTraits";
import primitiveTrait from "./primitiveTrait";
import objectTrait from "./objectTrait";

export default class CkanCatalogItemTraits extends mixTraits(
  UrlTraits,
  DataCustodianTraits,
  MappableTraits,
  CatalogMemberTraits
) {}
