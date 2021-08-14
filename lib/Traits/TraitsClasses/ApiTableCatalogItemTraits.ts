import ApiRequestTraits from "./ApiRequestTraits";
import AutoRefreshingTraits from "./AutoRefreshingTraits";
import CatalogMemberTraits from "./CatalogMemberTraits";
import mixTraits from "../mixTraits";
import objectArrayTrait from "../Decorators/objectArrayTrait";
import primitiveTrait from "../Decorators/primitiveTrait";
import TableTraits from "./TableTraits";

export class ApiTableRequestTraits extends mixTraits(ApiRequestTraits) {
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
  AutoRefreshingTraits,
  ApiRequestTraits
) {
  @objectArrayTrait({
    name: "APIs",
    type: ApiTableRequestTraits,
    description:
      'The apis to use to retrieve the columns of the table. Note: you **must** define which columns to use from API response in the `columns` `TableColumnTraits` - for example `[{name:"some-key-in-api-response", ...}]`',
    idProperty: "url"
  })
  apis: ApiTableRequestTraits[] = [];

  @primitiveTrait({
    name: "Id key",
    type: "string",
    description: "The name of the id property shared between all APIs"
  })
  idKey?: string;
}
