import Constructor from "../Core/Constructor";
import { computed } from "mobx";
import Terria from "../Models/TerriaNew";
import { BaseModel } from "../Models/Model";
import ModelReference from "../Traits/ModelReference";
import filterOutUndefined from "../Core/filterOutUndefined";

interface RequiredDefinition {
    members: ReadonlyArray<ModelReference> | undefined;
}

interface RequiredInstance {
    flattened: RequiredDefinition;
    terria: Terria;
    members: ReadonlyArray<ModelReference> | undefined;
}

export default function GroupMixin<T extends Constructor<RequiredInstance>>(Base: T) {
    class GroupMixin extends Base {
        @computed get memberModels(): ReadonlyArray<BaseModel> {
            const members = this.flattened.members;
            if (members === undefined) {
                return [];
            }
            return filterOutUndefined(members.map(id => this.terria.getModelById(BaseModel, id)));
        }
    }

    return GroupMixin;
}
