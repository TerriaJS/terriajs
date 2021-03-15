import CatalogMemberMixin from "../ModelMixins/CatalogMemberMixin";
import GroupMixin from "../ModelMixins/GroupMixin";
import CatalogGroupTraits from "../Traits/CatalogGroupTraits";
import CreateModel from "./CreateModel";

export default class CatalogGroup extends GroupMixin(
  CatalogMemberMixin(CreateModel(CatalogGroupTraits))
) {
  static readonly type = "group";

  get type() {
    return CatalogGroup.type;
  }

  protected forceLoadMetadata() {
    return () => Promise.resolve(undefined);
  }

  protected forceLoadMembers() {
    return () => Promise.resolve();
  }
}
