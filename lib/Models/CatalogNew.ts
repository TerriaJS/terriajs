import Terria from "./Terria";
import CatalogGroup from "./CatalogGroupNew";
import { computed } from "mobx";
import { USER_ADDED_CATEGORY_NAME } from "../Core/addedByUser";
import isDefined from "../Core/isDefined";
import hasTraits from "./hasTraits";
import CatalogMemberTraits from "../Traits/CatalogMemberTraits";
import Model, { BaseModel } from "./Model";
import CommonStrata from "./CommonStrata";
import ModelReference from "../Traits/ModelReference";

class UserAddedDataGroup extends CatalogGroup {
    add(member: BaseModel) {
        const members = this.getTrait(CommonStrata.user, "members") || [];
        this.setTrait(
            CommonStrata.user,
            "members",
            members.concat([member.id])
        );
    }

    remove(member: BaseModel) {
        const members = this.getTrait(CommonStrata.user, "members") || [];
        const index = members.indexOf(member.id);
        if (index !== -1) {
            members.splice(index, 1);
            this.setTrait(CommonStrata.user, "members", members);
        }
    }
}

export default class Catalog {
    readonly group: CatalogGroup;
    readonly terria: Terria;

    constructor(terria: Terria) {
        this.terria = terria;
        this.group = new CatalogGroup("/", this.terria);
    }

    get userAddedDataGroup(): UserAddedDataGroup {
        let group = <UserAddedDataGroup>(
            this.group.memberModels.find(m => m.id === USER_ADDED_CATEGORY_NAME)
        );
        if (isDefined(group)) {
            return group;
        }

        group = new UserAddedDataGroup(USER_ADDED_CATEGORY_NAME, this.terria);
        group.setTrait(CommonStrata.user, "name", USER_ADDED_CATEGORY_NAME);
        group.setTrait(
            CommonStrata.user,
            "description",
            "The group for data that was added by the user via the Add Data panel."
        );
        this.terria.addModel(group);
        this.group.setTrait(CommonStrata.user, "members", [group.id]);
        return group;
    }

    get userAddedDataGroupIfItExists(): CatalogGroup | undefined {
        const group = <CatalogGroup>(
            this.group.memberModels.find(m => m.id === USER_ADDED_CATEGORY_NAME)
        );
        return group;
    }
}
