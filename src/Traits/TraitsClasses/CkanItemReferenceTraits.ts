import CkanSharedTraits from "./CkanSharedTraits";
import CatalogMemberReferenceTraits from "./CatalogMemberReferenceTraits";
import mixTraits from "../mixTraits";
import MappableTraits from "./MappableTraits";
import primitiveTrait from "../Decorators/primitiveTrait";
import UrlTraits from "./UrlTraits";

export default class CkanCatalogItemTraits extends mixTraits(
  UrlTraits,
  MappableTraits,
  CkanSharedTraits,
  CatalogMemberReferenceTraits
) {
  @primitiveTrait({
    name: "Dataset ID",
    description: "The CKAN ID of the dataset.",
    type: "string"
  })
  datasetId?: string;

  @primitiveTrait({
    name: "Magda Record Data",
    description: "The Resource ID of the dataset to use",
    type: "string"
  })
  resourceId?: string;
}
