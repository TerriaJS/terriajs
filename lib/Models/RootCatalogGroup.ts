import CatalogMemberMixin from "../ModelMixins/CatalogMemberMixin";
import GroupMixin from "../ModelMixins/GroupMixin";
import CatalogGroupTraits from "../Traits/CatalogGroupTraits";
import CreateModel from "./CreateModel";

export default class RootCatalogGroup extends GroupMixin(
  CatalogMemberMixin(CreateModel(CatalogGroupTraits))
) {
  static readonly type = "root-group";
  static readonly rootGroupId = "/";

  get type() {
    return RootCatalogGroup.type;
  }

  get uniqueId() {
    return RootCatalogGroup.rootGroupId;
  }
  set uniqueId(val) {
    console.warn(
      `Setting unique ID on RootGroup with ${val}, but Terria treats root group as /`
    );
  }

  protected forceLoadMetadata(): Promise<void> {
    return Promise.resolve(undefined);
  }

  protected forceLoadMembers(): Promise<void> {
    return Promise.resolve();
  }
}
