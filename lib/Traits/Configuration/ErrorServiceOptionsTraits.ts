import anyTrait from "../Decorators/anyTrait";
import primitiveTrait from "../Decorators/primitiveTrait";
import ModelTraits from "../ModelTraits";

export class ErrorServiceOptionsTraits extends ModelTraits {
  @primitiveTrait({
    name: "Provider",
    type: "boolean",
    description: "Error service provider"
  })
  provider!: "rollbar";

  @anyTrait({
    name: "Configuration",
    description: ""
  })
  configuration: any;
}
