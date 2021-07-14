import { BaseModel } from "../Models/Definition/Model";
import GroupMixin from "../ModelMixins/GroupMixin";
import ReferenceMixin from "../ModelMixins/ReferenceMixin";

export default function getDereferencedIfExists(
  item: BaseModel | GroupMixin.GroupMixin
): BaseModel | GroupMixin.GroupMixin {
  if (ReferenceMixin.is(item) && item.target) {
    return item.target;
  }
  return item;
}
