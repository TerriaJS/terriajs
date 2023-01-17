import objectArrayTrait from "../Decorators/objectArrayTrait";
import primitiveTrait from "../Decorators/primitiveTrait";
import mixTraits from "../mixTraits";
import ApiRequestTraits from "./ApiRequestTraits";
import AutoRefreshingTraits from "./AutoRefreshingTraits";
import CatalogMemberTraits from "./CatalogMemberTraits";
import LegendOwnerTraits from "./LegendOwnerTraits";
import TableTraits from "./Table/TableTraits";
import primitiveArrayTrait from "../Decorators/primitiveArrayTrait";

export class ApiTableRequestTraits extends mixTraits(ApiRequestTraits) {
  @primitiveTrait({
    name: "Kind",
    type: "string",
    description:
      "Determines how table rows are constructed from this API.\n" +
      '* PER_ROW: Row major, values are specific to a row in the table eg. [{"col1": 12, "col2": 13}] \n' +
      "* PER_ID: Values are the same for all objects with the same id.\n" +
      '* COLUMN_MAJOR: API response is in a column major format, eg. [{"row1": 12, "row2": 13}]. The keys in each list item (eg. "row1") will be used as the row id.\n'
  })
  kind?: "PER_ROW" | "PER_ID" | "COLUMN_MAJOR" = "PER_ROW";

  @primitiveArrayTrait({
    name: "Column major column names",
    type: "string",
    description:
      'Used when `kind` is "COLUMN_MAJOR". The name of each column in the order they appear in the API response.'
  })
  columnMajorColumnNames?: string[] = ["value"];
}

export default class ApiTableCatalogItemTraits extends mixTraits(
  TableTraits,
  CatalogMemberTraits,
  LegendOwnerTraits,
  AutoRefreshingTraits,
  ApiRequestTraits
) {
  @objectArrayTrait({
    name: "APIs",
    type: ApiTableRequestTraits,
    description:
      'The apis to use to retrieve the data of the table. Note: you **must** define which columns to use from API response in the `columns` `TableColumnTraits` - for example `[{name:"some-key-in-api-response", ...}]`',
    idProperty: "url"
  })
  apis: ApiTableRequestTraits[] = [];

  @primitiveTrait({
    name: "Id key",
    type: "string",
    description: "The name of the id property shared between all APIs"
  })
  idKey?: string;

  @primitiveTrait({
    name: "Should append new data",
    type: "string",
    description:
      "When true, new data received through APIs will be appended to existing data. If false, new data will replace existing data."
  })
  shouldAppendNewData?: boolean = true;
}
