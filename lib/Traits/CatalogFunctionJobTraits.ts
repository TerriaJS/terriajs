import CatalogMemberTraits from "./CatalogMemberTraits";
import ModelTraits from "./ModelTraits";
import primitiveTrait from "./primitiveTrait";
import objectArrayTrait from "./objectArrayTrait";
import mixTraits from "./mixTraits";
import AutoRefreshingTraits from "./AutoRefreshingTraits";
import CatalogFunctionTraits from "./CatalogFunctionTraits";

export class FunctionParameterTraits extends ModelTraits {
  @primitiveTrait({
    type: "string",
    name: "id",
    description:
      "Id."
  })
  "id"?: string;
  @primitiveTrait({
    type: "string",
    name: "id",
    description:
      "Id."
  })
  "value"?: string;
}

export default class CatalogFunctionJobTraits extends mixTraits(CatalogFunctionTraits, AutoRefreshingTraits, CatalogMemberTraits) {

}
