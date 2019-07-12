import CatalogMemberMixin from "../ModelMixins/CatalogMemberMixin";
import CreateModel from "./CreateModel";
import ResultPendingCatalogItemTraits from "../Traits/ResultPendingCatalogItemTraits";

export default class ResultPendingCatalogItem extends CatalogMemberMixin(
  CreateModel(ResultPendingCatalogItemTraits)
) {
  readonly showsInfo = true;
  readonly isMappable = true;

  loadPromise = Promise.resolve();

  protected forceLoadMetadata() {
    return this.loadPromise;
  }
}
