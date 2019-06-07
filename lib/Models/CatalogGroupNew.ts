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

  get loadMetadataPromise(): Promise<void> {
    return Promise.resolve(undefined);
  }

  protected get loadMembersPromise(): Promise<void> {
    return Promise.resolve();
  }
}
