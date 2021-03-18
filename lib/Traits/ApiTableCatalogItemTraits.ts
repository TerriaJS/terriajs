import CatalogMemberTraits from "./CatalogMemberTraits";
import mixTraits from "./mixTraits";
import ModelTraits from "./ModelTraits";
import objectArrayTrait from "./objectArrayTrait";
import objectTrait from "./objectTrait";
import primitiveTrait from "./primitiveTrait";
import TableTraits from "./TableTraits";

class ApiStepTraits extends ModelTraits {
  @primitiveTrait({
    type: "string",
    name: "API url",
    description: "The url of the api endpoint to call"
  })
  apiUrl?: string;
}

class KeyToColumnMapping extends ModelTraits {
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

class PositionStepTraits extends ApiStepTraits {
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

  @primitiveTrait({
    name: "Id Key",
    type: "string",
    description:
      "The key in the API response's JSON to get the id from. This id will be used to determine which positions are associated with which value."
  })
  idKey?: string;
}

class ValueStepTraits extends ApiStepTraits {
  @objectArrayTrait({
    name: "Key to column name mapping",
    type: KeyToColumnMapping,
    description:
      "A list of mappings from a key in the API response's JSON to the name of a column in the table that this catalog item generates.",
    idProperty: "columnName"
  })
  keyToColumnMapping: KeyToColumnMapping[] = [];
}

export default class ApiTableCatalogItemTraits extends mixTraits(
  TableTraits,
  CatalogMemberTraits
) {
  @objectTrait({
    name: "Value step",
    type: ValueStepTraits,
    description: "Describes how to get the values of the table from the API"
  })
  valueStep?: ValueStepTraits;

  @objectTrait({
    name: "Position step",
    type: PositionStepTraits,
    description:
      "Describes how to get the position column of the table from the API"
  })
  positionStep?: PositionStepTraits;
}
