import primitiveTrait from "../Decorators/primitiveTrait";
import mixTraits from "../mixTraits";
import ReferenceTraits from "./ReferenceTraits";

export default class SplitItemReferenceTraits extends mixTraits(
  ReferenceTraits
) {
  @primitiveTrait({
    type: "string",
    name: "Split source item id",
    description: "The ID of the original item from which the split was created."
  })
  splitSourceItemId?: string;
}
