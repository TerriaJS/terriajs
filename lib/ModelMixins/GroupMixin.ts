import Constructor from "../Core/Constructor";
import { computed } from "mobx";
import Terria from "../Models/TerriaNew";
import { BaseModel } from "../Models/Model";
import ModelReference from "../Definitions/ModelReference";

interface RequiredDefinition {
    members: ReadonlyArray<ModelReference>;
}

interface RequiredInstance {
    flattened: RequiredDefinition;
    terria: Terria;
    members: ReadonlyArray<ModelReference>;
}

export default function GroupMixin<T extends Constructor<RequiredInstance>>(Base: T) {
    class GroupMixin extends Base {
        @computed get memberModels(): ReadonlyArray<BaseModel> {
            return this.flattened.members.map(id => this.terria.getModelById(BaseModel, id));
        }
    }

    return GroupMixin;
}
