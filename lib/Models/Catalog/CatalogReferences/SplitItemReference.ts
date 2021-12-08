import getDereferencedIfExists from "../../../Core/getDereferencedIfExists";
import ReferenceMixin from "../../../ModelMixins/ReferenceMixin";
import SplitItemReferenceTraits from "../../../Traits/TraitsClasses/SplitItemReferenceTraits";
import CreateModel from "../../Definition/CreateModel";
import { BaseModel } from "../../Definition/Model";

/**
 * This item is a reference to a copy of the original item from which it was created.
 *
 * It is used to create a split copy of a workbench item, so that when creating a
 * share url, we don't have to export the definition traits of the copy
 * separately. This reduces share url size and avoids exporting any sensitive
 * data that the traits may have.
 */
export default class SplitItemReference extends ReferenceMixin(
  CreateModel(SplitItemReferenceTraits)
) {
  static readonly type = "split-reference";

  get type() {
    return SplitItemReference.type;
  }

  protected async forceLoadReference(
    previousTarget: BaseModel | undefined
  ): Promise<BaseModel | undefined> {
    if (this.splitSourceItemId === undefined || this.uniqueId === undefined) {
      return;
    }

    let sourceItem = this.terria.getModelById(
      BaseModel,
      this.splitSourceItemId
    );
    if (sourceItem === undefined) {
      return;
    }

    // Ensure the target we create is a concrete item
    sourceItem = getDereferencedIfExists(sourceItem);
    const target = sourceItem.duplicateModel(this.uniqueId, this);
    return target;
  }
}
