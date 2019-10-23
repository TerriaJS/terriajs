import Terria from "./Terria";
import { BaseModel } from "./Model";
import GroupMixin from "../ModelMixins/GroupMixin";
import ReferenceMixin from "../ModelMixins/ReferenceMixin";
import CommonStrata from "./CommonStrata";

/**
 * Opens or closes a model, which is likely to include a {@link GroupMixin}.
 * If the model is a reference, it will be dereferenced first. If it is a group,
 * its `isOpen` trait will be set according to the value of the `isOpen` parameter
 * in the `stratum` indicated. If after doing this the group is open, its members
 * will be loaded with a call to `loadMembers`. If this model is not a group or
 * turns out not to be one after dereferencing, this function does nothing.
 *
 * @param group The model to open if it is a group.
 * @param [isOpen=true] True if the group should be opened. False if it should be closed.
 * @param stratum The stratum in which to mark the group opened or closed.
 */
export default function openGroup(
  group: BaseModel,
  isOpen: boolean = true,
  stratum: string = CommonStrata.user
): Promise<void> {
  if (ReferenceMixin.is(group)) {
    return group.loadReference().then(() => {
      if (group.target) {
        return openGroup(group.target, isOpen, stratum);
      }
    });
  } else if (GroupMixin.isMixedInto(group)) {
    group.setTrait(stratum, "isOpen", isOpen);
    if (group.isOpen) {
      return group.loadMembers();
    }
  }

  return Promise.resolve();
}
