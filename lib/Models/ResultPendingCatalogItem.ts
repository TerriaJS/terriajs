import CatalogMemberMixin from "../ModelMixins/CatalogMemberMixin";
import CreateModel from "./CreateModel";
import ResultPendingCatalogItemTraits from "../Traits/ResultPendingCatalogItemTraits";

export default class ResultPendingCatalogItem extends CatalogMemberMixin(
  CreateModel(ResultPendingCatalogItemTraits)
) {
  showsInfo = false;
  isMappable = false;

  loadPromise = Promise.resolve();

  protected forceLoadMetadata() {
    return this.loadPromise;
  }
}
