import { computed } from "mobx";
import filterOutUndefined from "../Core/filterOutUndefined";
import CatalogMemberMixin from "../ModelMixins/CatalogMemberMixin";
import GroupMixin from "../ModelMixins/GroupMixin";
import CatalogGroupTraits from "../Traits/CatalogGroupTraits";
import ModelReference from "../Traits/ModelReference";
import CreateModel from "./CreateModel";
import { BaseModel } from "./Model";

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
            : this.terria.getModelById(BaseModel, id)
        )
      );
      return filterOutUndefined(
        memberModels
          .sort(function(a, b) {
            if (
              !CatalogMemberMixin.isMixedInto(a) ||
              a.nameInCatalog === undefined ||
              !CatalogMemberMixin.isMixedInto(b) ||
              b.nameInCatalog === undefined
            )
              return 0;
            if (a.nameInCatalog < b.nameInCatalog) return -1;
            if (a.nameInCatalog > b.nameInCatalog) return 1;
            return 0;
          })
          .map(m => m.uniqueId)
      );
    }
  }

  protected forceLoadMetadata(): Promise<void> {
    return Promise.resolve(undefined);
  }

  protected forceLoadMembers(): Promise<void> {
    return Promise.resolve();
  }
}
