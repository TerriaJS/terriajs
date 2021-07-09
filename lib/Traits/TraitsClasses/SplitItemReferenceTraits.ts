import ModelTraits from "../ModelTraits";
import primitiveTrait from "../Decorators/primitiveTrait";

export default class SplitItemReferenceTraits extends ModelTraits {
  @primitiveTrait({
    type: "string",
    name: "Split source item id",
    description: "The ID of the original item from which the split was created."
  })
  splitSourceItemId?: string;
}
