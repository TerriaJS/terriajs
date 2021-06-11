import CatalogMemberTraits from "./CatalogMemberTraits";
import mixTraits from "./mixTraits";
import primitiveArrayTrait from "./primitiveArrayTrait";
import primitiveTrait from "./primitiveTrait";
import TableTraits from "./TableTraits";
import UrlTraits from "./UrlTraits";
import DimensionTraits from "./DimensionTraits";

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

  @primitiveTrait({
    type: "string",
    name: "Select field",
    description: "Names of fields to 'select' when downloading data"
  })
  selectFields?: string;

  @primitiveTrait({
    type: "string",
    name: "Group by field",
    description: "Names of fields to 'groupBy' when downloading data"
  })
  groupByFields?: string;

  @primitiveArrayTrait({
    type: "string",
    name: "Available fields",
    description: "Names of fields which can be 'selected'"
  })
  availableFields?: DimensionTraits[];

  @primitiveTrait({
    type: "string",
    name: "Aggregate time values",
    description: "Aggregate time values (eg 1 day)."
  })
  aggregateTime?: string;

  @primitiveTrait({
    type: "boolean",
    name: "Use records API",
    description:
      "Use records API instead of export API - this will limit number of records fetched."
  })
  useRecordsApi?: boolean;
}
