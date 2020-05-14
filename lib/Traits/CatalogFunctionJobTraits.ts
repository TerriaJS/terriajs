import CatalogMemberTraits from "./CatalogMemberTraits";
import ModelTraits from "./ModelTraits";
import primitiveTrait from "./primitiveTrait";
import mixTraits from "./mixTraits";
import CatalogFunctionTraits from "./CatalogFunctionTraits";
import AutoRefreshingTraits from "./AutoRefreshingTraits";

export class FunctionParameterTraits extends ModelTraits {
  @primitiveTrait({
    type: "string",
    name: "id",
    description: "Id."
  })
  "id"?: string;
  @primitiveTrait({
    type: "string",
    name: "id",
    description: "Id."
  })
  "value"?: string;
}

export default class CatalogFunctionJobTraits extends mixTraits(
  CatalogFunctionTraits,
  AutoRefreshingTraits,
  CatalogMemberTraits
) {}
