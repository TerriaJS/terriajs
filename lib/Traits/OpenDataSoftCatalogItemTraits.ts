import CatalogMemberTraits from "./CatalogMemberTraits";
import mixTraits from "./mixTraits";
import UrlTraits from "./UrlTraits";
import primitiveTrait from "./primitiveTrait";
import MappableTraits from "./MappableTraits";
import TableTraits from "./TableTraits";
import primitiveArrayTrait from "./primitiveArrayTrait";

export default class OpenDataSoftCatalogItemTraits extends mixTraits(
  TableTraits,
  UrlTraits,
  CatalogMemberTraits
) {
  @primitiveTrait({
    type: "string",
    name: "Dataset ID",
    description: "OpenDataSoft Dataset id (`dataset_id`)."
  })
  datasetId?: string;

  @primitiveArrayTrait({
    type: "string",
    name: "Select field",
    description: "Names of fields to 'select' when downloading data"
  })
  selectFields?: string[];
}
