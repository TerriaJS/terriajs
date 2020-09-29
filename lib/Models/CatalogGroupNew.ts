import { computed } from "mobx";

import CatalogMemberMixin, {
  CatalogMember
} from "../ModelMixins/CatalogMemberMixin";
import GroupMixin from "../ModelMixins/GroupMixin";
import CatalogGroupTraits from "../Traits/CatalogGroupTraits";
import CreateModel from "./CreateModel";
import filterOutUndefined from "../Core/filterOutUndefined";
import ModelReference from "../Traits/ModelReference";
import { BaseModel } from "../Models/Model";

export default class CatalogGroup extends GroupMixin(
  CatalogMemberMixin(CreateModel(CatalogGroupTraits))
) {
  static readonly type = "group";

  get type() {
    return CatalogGroup.type;
  }

  @computed
  get members() {
    const members = super.members;
    if (this.preserveOrder) return members;
    else {
      // this memberModels bit is stolen from the GroupMixin memberModels
      // using it directly would create a infinite loop
      const memberModels = filterOutUndefined(
        members.map(id =>
          ModelReference.isRemoved(id)
            ? undefined
            : (this.terria.getModelById(BaseModel, id) as CatalogMember)
        )
      );
      return memberModels
        .sort(function(a, b) {
          if (a.nameInCatalog === undefined || b.nameInCatalog === undefined)
            return 0;
          if (a.nameInCatalog < b.nameInCatalog) return -1;
          if (a.nameInCatalog > b.nameInCatalog) return 1;
          return 0;
        })
        .map(m => m.uniqueId as ModelReference);
    }
  }

  protected forceLoadMetadata(): Promise<void> {
    return Promise.resolve(undefined);
  }

  protected forceLoadMembers(): Promise<void> {
    return Promise.resolve();
  }
}
