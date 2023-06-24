import objectTrait from "../Decorators/objectTrait";
import primitiveTrait from "../Decorators/primitiveTrait";
import mixTraits from "../mixTraits";
import AutoRefreshingTraits from "./AutoRefreshingTraits";
import CatalogMemberTraits from "./CatalogMemberTraits";
import EnumDimensionTraits from "./DimensionTraits";
import FeatureInfoUrlTemplateTraits from "./FeatureInfoTraits";
import LegendOwnerTraits from "./LegendOwnerTraits";
import TableTraits from "./Table/TableTraits";
import UrlTraits from "./UrlTraits";

export default class OpenDataSoftCatalogItemTraits extends mixTraits(
  AutoRefreshingTraits,
  TableTraits,
  FeatureInfoUrlTemplateTraits,
  UrlTraits,
  CatalogMemberTraits,
  LegendOwnerTraits
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

  @objectTrait({
    type: EnumDimensionTraits,
    name: "Available fields",
    description: "Names of fields which can be 'selected'"
  })
  availableFields?: EnumDimensionTraits;

  @primitiveTrait({
    type: "string",
    name: "Aggregate time values",
    description:
      "Aggregate time values (eg 1 day). See https://help.opendatasoft.com/apis/ods-search-v2/#group-by-clause"
  })
  aggregateTime?: string;

  @primitiveTrait({
    type: "string",
    name: "Refresh interval template",
    description:
      'Template used to calculate refresh interval based on Opendatasoft dataset object. This template is rendered using dataset JSON object as view. For example `"{{metas.custom.update-frequency}}"` will use `"update-frequency"` custom metadata property. This supports "human readable" time strings - for example "15 minutes" and "60 sec".'
  })
  refreshIntervalTemplate?: string;
}
