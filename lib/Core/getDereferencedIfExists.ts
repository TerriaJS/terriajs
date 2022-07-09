import GroupMixin from "../ModelMixins/GroupMixin";
import ReferenceMixin from "../ModelMixins/ReferenceMixin";
import { BaseModel } from "../Models/Definition/Model";

export default function getDereferencedIfExists(
  item: BaseModel | GroupMixin.Instance
): BaseModel | GroupMixin.Instance {
  if (ReferenceMixin.isMixedInto(item) && item.target) {
    return item.target;
  }
  return item;
}
