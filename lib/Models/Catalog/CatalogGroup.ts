import CatalogMemberMixin from "../../ModelMixins/CatalogMemberMixin";
import GroupMixin from "../../ModelMixins/GroupMixin";
import CatalogGroupTraits from "../../Traits/TraitsClasses/CatalogGroupTraits";
import CreateModel from "../Definition/CreateModel";

export default class CatalogGroup extends GroupMixin(
  CatalogMemberMixin(CreateModel(CatalogGroupTraits))
) {
  static readonly type = "group";

  get type() {
    return CatalogGroup.type;
  }

  forceLoadMembers(): Promise<void> {
    return Promise.resolve();
  }
}
