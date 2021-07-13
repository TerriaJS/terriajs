/**
 * A catalog item to use when we get given a definition we cannot parse
 */
import CreateModel from "../../Definition/CreateModel";
import CatalogMemberMixin from "../../../ModelMixins/CatalogMemberMixin";
import mixTraits from "../../../Traits/mixTraits";
import CatalogMemberTraits from "../../../Traits/TraitsClasses/CatalogMemberTraits";
import primitiveTrait from "../../../Traits/Decorators/primitiveTrait";

export class StubCatalogItemTraits extends mixTraits(CatalogMemberTraits) {
  @primitiveTrait({
    type: "boolean",
    name: "Is experiencing issues",
    description:
      "Whether the catalog item is experiencing issues which may cause its data to be unavailable"
  })
  isExperiencingIssues: boolean = true;
}

export default class StubCatalogItem extends CatalogMemberMixin(
  CreateModel(StubCatalogItemTraits)
) {
  static readonly type = "stub";
  get type() {
    return StubCatalogItem.type;
  }

  forceLoadMetadata() {
    return Promise.resolve();
  }
}
