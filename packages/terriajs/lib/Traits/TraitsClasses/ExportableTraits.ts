import primitiveTrait from "../Decorators/primitiveTrait";
import ModelTraits from "../ModelTraits";

export default class ExportableTraits extends ModelTraits {
  @primitiveTrait({
    name: "Disable export",
    description: "Disable user export functionality",
    type: "boolean"
  })
  disableExport?: boolean = false;
}
