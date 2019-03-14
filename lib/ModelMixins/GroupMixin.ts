import { action, computed } from "mobx";
import Constructor from "../Core/Constructor";
import filterOutUndefined from "../Core/filterOutUndefined";
import StratumFromTraits from "../ModelInterfaces/StratumFromTraits";
import { BaseModel } from "../Models/Model";
import Terria from "../Models/Terria";
import ModelReference from "../Traits/ModelReference";

interface RequiredDefinition {
    members: ReadonlyArray<ModelReference> | undefined;
    isOpen: boolean | undefined;
}

interface RequiredInstance {
    terria: Terria;
    topStratum: StratumFromTraits<RequiredDefinition>
    members: ReadonlyArray<ModelReference> | undefined;
    isOpen: boolean | undefined;
}

function GroupMixin<T extends Constructor<RequiredInstance>>(Base: T) {
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
