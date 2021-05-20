import AutoRefreshingTraits from "./AutoRefreshingTraits";
import CatalogMemberTraits from "./CatalogMemberTraits";
import mixTraits from "./mixTraits";
import ModelTraits from "./ModelTraits";
import objectArrayTrait from "./objectArrayTrait";
import primitiveTrait from "./primitiveTrait";
import TableTraits from "./TableTraits";

export class QueryParamTraits extends ModelTraits {
  @primitiveTrait({
    name: "Parameter name",
    type: "string",
    description: "The name of the query parameter."
  })
  name?: string;

  @primitiveTrait({
    name: "Parameter value",
    type: "string",
    description:
      "The value of the query parameter. Parameter values starting with" +
      " `DATE!`, eg. `DATE!HH:MM`, will be replaced wih the current date and" +
      " time, formatted according to the format string following the `!`." +
      " For more information on the format string format, see the " +
      " [dateformat](https://github.com/felixge/node-dateformat) library."
  })
  value?: string;
}

export class ApiTraits extends ModelTraits {
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

  @primitiveTrait({
    name: "Kind",
    type: "string",
    description:
      "Determines how table rows are constructed from this API.\n" +
      "* PER_ROW: values are specific to a row in the table\n" +
      "* PER_ID: values are the same for all objects with the same id\n"
  })
  kind?: "PER_ROW" | "PER_ID" = "PER_ROW";
}

export default class ApiTableCatalogItemTraits extends mixTraits(
  TableTraits,
  CatalogMemberTraits,
  AutoRefreshingTraits
) {
  @objectArrayTrait({
    name: "APIs",
    type: ApiTraits,
    description:
      'The apis to use to retrieve the columns of the table. Note: you **must** define which columns to use from API response in the `columns` `TableColumnTraits` - for example `[{name:"some-key-in-api-response", ...}]`',
    idProperty: "apiUrl"
  })
  apis: ApiTraits[] = [];

  @objectArrayTrait({
    name: "Query parameters",
    type: QueryParamTraits,
    description: "Query parameters to supply to the API.",
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

  @primitiveTrait({
    name: "Id key",
    type: "string",
    description: "The name of the id property shared between all APIs"
  })
  idKey?: string;
}
