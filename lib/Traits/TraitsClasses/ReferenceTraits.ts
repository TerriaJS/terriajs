import ModelTraits from "../ModelTraits";
import primitiveTrait from "../Decorators/primitiveTrait";

export default class ReferenceTraits extends ModelTraits {
  @primitiveTrait({
    type: "boolean",
    name: "Is catalog item open in workbench",
    description: "Whether the item in the workbench open or collapsed."
  })
  isOpenInWorkbench?: boolean = true;
}
