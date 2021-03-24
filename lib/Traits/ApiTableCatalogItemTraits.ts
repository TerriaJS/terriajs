import AutoRefreshingTraits from "./AutoRefreshingTraits";
import CatalogMemberTraits from "./CatalogMemberTraits";
import mixTraits from "./mixTraits";
import ModelTraits from "./ModelTraits";
import objectArrayTrait from "./objectArrayTrait";
import objectTrait from "./objectTrait";
import primitiveArrayTrait from "./primitiveArrayTrait";
import primitiveTrait from "./primitiveTrait";
import TableTraits from "./TableTraits";

export class QueryParamTraits extends ModelTraits {
  @primitiveTrait({
    name: "Parameter name",
    type: "string",
    description: "The name of the query parameter"
  })
  name?: string;

  @primitiveTrait({
    name: "Parameter value",
    type: "string",
    description: "The value of the query parameter"
  })
  value?: string;
}

class KeyToColumnMappingTraits extends ModelTraits {
  @primitiveTrait({
    name: "Key in API response",
    type: "string",
    description:
      "The key in the API response to map to a column. For nested keys, use JSON patch style paths, eg. /path/from/root"
  })
  keyInApiResponse?: string;

  @primitiveTrait({
    name: "Column name",
    type: "string",
    description:
      "The name of the column in the table that this catalog item generates"
  })
  columnName?: string;
}

class ApiStepTraits extends ModelTraits {
  @primitiveTrait({
    type: "string",
    name: "API url",
    description: "The url of the api endpoint to call"
  })
  apiUrl?: string;

  @objectArrayTrait({
    name: "Query parameters",
    type: QueryParamTraits,
    description: "Query parameters to supply to the API",
    idProperty: "name"
  })
  queryParameters: QueryParamTraits[] = [];

  @objectArrayTrait({
    name: "Query parameters for updates",
    type: QueryParamTraits,
    description:
      "Query parameters to supply to the API on subsequent calls after the first call.",
    idProperty: "name"
  })
  updateQueryParameters: QueryParamTraits[] = [];
}

class PositionApiTraits extends ApiStepTraits {
  @primitiveTrait({
    name: "Latitude key",
    type: "string",
    description:
      "The key in the API response's JSON to get the latitude column of the table from"
  })
  latitudeKey?: string;

  @primitiveTrait({
    name: "Longitude key",
    type: "string",
    description:
      "The key in the API response's JSON to get the longitude column of the table from"
  })
  longitudeKey?: string;
}

export class ValueApiTraits extends ApiStepTraits {
  @objectArrayTrait({
    name: "Key to column name mapping",
    type: KeyToColumnMappingTraits,
    description:
      "A list of mappings from a key in the API response's JSON to the name of a column in the table that this catalog item generates.",
    idProperty: "columnName"
  })
  keyToColumnMapping: KeyToColumnMappingTraits[] = [];
}

export default class ApiTableCatalogItemTraits extends mixTraits(
  TableTraits,
  CatalogMemberTraits,
  AutoRefreshingTraits
) {
  @objectArrayTrait({
    name: "APIs",
    type: ValueApiTraits,
    description: "The apis to use to retrieve the columns of the table.",
    idProperty: "apiUrl"
  })
  valueApis: ValueApiTraits[] = [];

  @objectTrait({
    name: "Position step",
    type: PositionApiTraits,
    description:
      "Describes how to get the position column of the table from the API"
  })
  positionApi?: PositionApiTraits;

  @primitiveTrait({
    name: "Id Key",
    type: "string",
    description:
      "The key in the API response's JSON to get the id from. This id will be used to determine which positions are associated with which value."
  })
  idKey?: string;

  @objectArrayTrait({
    name: "Query parameters",
    type: QueryParamTraits,
    description: "Query parameters to supply to the API",
    idProperty: "name"
  })
  queryParameters: QueryParamTraits[] = [];

  @objectArrayTrait({
    name: "Query parameters for updates",
    type: QueryParamTraits,
    description:
      "Query parameters to supply to the API on subsequent calls after the first call.",
    idProperty: "name"
  })
  updateQueryParameters: QueryParamTraits[] = [];
}
