import CatalogMemberTraits from "./CatalogMemberTraits";
import objectArrayTrait from "./objectArrayTrait";
import primitiveTrait from "./primitiveTrait";
import ModelTraits from "./ModelTraits";

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

export default class CatalogFunctionTraits extends CatalogMemberTraits {
  @objectArrayTrait({
    type: FunctionParameterTraits,
    idProperty: 'id',
    name: "parameters",
    description: "Function Parameters"
  })
  parameters?: FunctionParameterTraits;
}


