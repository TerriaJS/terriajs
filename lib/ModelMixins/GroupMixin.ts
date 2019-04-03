import { action, computed } from "mobx";
import Constructor from "../Core/Constructor";
import filterOutUndefined from "../Core/filterOutUndefined";
import Model, { BaseModel } from "../Models/Model";
import GroupTraits from "../Traits/GroupTraits";

function GroupMixin<T extends Constructor<Model<GroupTraits>>>(Base: T) {
    class GroupMixin extends Base {
        get isGroup() {
            return true;
        }

        @computed get memberModels(): ReadonlyArray<BaseModel> {
            const members = this.members;
            if (members === undefined) {
                return [];
            }
            return filterOutUndefined(members.map(id => this.terria.getModelById(BaseModel, id)));
        }

        @action
        toggleOpen(stratumId: string) {
            this.setTrait(stratumId, 'isOpen', !this.isOpen);
        }
    }

    return GroupMixin;
}

namespace GroupMixin {
    export interface GroupMixin extends InstanceType<ReturnType<typeof GroupMixin>> {}
    export function isMixedInto(model: any): model is GroupMixin {
        return model && model.isGroup;
    }
}

export default GroupMixin;
