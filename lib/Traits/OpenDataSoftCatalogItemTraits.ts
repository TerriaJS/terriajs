import CatalogMemberTraits from "./CatalogMemberTraits";
import mixTraits from "./mixTraits";
import primitiveArrayTrait from "./primitiveArrayTrait";
import primitiveTrait from "./primitiveTrait";
import { DimensionTraits } from "./SdmxCommonTraits";
import TableTraits from "./TableTraits";
import UrlTraits from "./UrlTraits";

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

  @primitiveTrait({
    type: "string",
    name: "Geo point 2d field name",
    description: "Field to use as geo point 2d (i.e. lat long)."
  })
  geoPoint2dFieldName?: string;

  @primitiveTrait({
    type: "string",
    name: "Datetime field name",
    description: "Field to use as datetime."
  })
  timeFieldName?: string;

  @primitiveTrait({
    type: "string",
    name: "Color field name",
    description: "Field to use as color."
  })
  colorFieldName?: string;

  @primitiveTrait({
    type: "string",
    name: "Region field name",
    description: "Field to use as region mapping."
  })
  regionFieldName?: string;

  @primitiveArrayTrait({
    type: "string",
    name: "Select field",
    description: "Names of fields to 'select' when downloading data"
  })
  selectFields?: string[];

  @primitiveArrayTrait({
    type: "string",
    name: "Available fields",
    description: "Names of fields which can be 'selected'"
  })
  availableFields?: DimensionTraits[];
}
