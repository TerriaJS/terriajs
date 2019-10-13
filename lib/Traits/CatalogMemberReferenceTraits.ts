import ModelTraits from "./ModelTraits";
import objectTrait from "./objectTrait";
import ReferenceHintTraits from "./ReferenceHintTraits";

export default class CatalogMemberReferenceTraits extends ModelTraits {
  @objectTrait({
    name: "Hints",
    description:
      "Hints that control how this reference is displayed in the " +
      "user interface before it is loaded.",
    type: ReferenceHintTraits
  })
  hints?: ReferenceHintTraits;
}
