import { action, computed } from "mobx";
import Constructor from "../Core/Constructor";
import filterOutUndefined from "../Core/filterOutUndefined";
import { BaseModel, ModelInterface } from "../Models/Model";
import ModelPropertiesFromTraits from "../Models/ModelPropertiesFromTraits";
import mixGroupTraits from "../Traits/mixGroupTraits";
import ModelTraits from "../Traits/ModelTraits";

class RequiredTraits extends mixGroupTraits(ModelTraits) {
}

function GroupMixin<T extends Constructor<ModelInterface<RequiredTraits> & ModelPropertiesFromTraits<RequiredTraits>>>(Base: T) {
    class GroupMixin extends Base {
        get isGroup() {
            return true;
        }

        @computed get memberModels(): ReadonlyArray<BaseModel> {
            const members = this.members;
            if (members === undefined) {
                return [];
            }
            members;
            return filterOutUndefined(members.map(id => this.terria.getModelById(BaseModel, id)));
        }

        @action
        toggleOpen() {
            this.topStratum.isOpen = !this.isOpen;
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
