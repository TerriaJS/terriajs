import primitiveTrait from "../Decorators/primitiveTrait";
import mixTraits from "../mixTraits";
import { ItemPropertiesTraits } from "./ItemPropertiesTraits";
export default class ReferenceTraits extends mixTraits(ItemPropertiesTraits) {
  @primitiveTrait({
    type: "boolean",
    name: "Is catalog item open in workbench",
    description: "Whether the item in the workbench open or collapsed."
  })
  isOpenInWorkbench?: boolean = true;
}
