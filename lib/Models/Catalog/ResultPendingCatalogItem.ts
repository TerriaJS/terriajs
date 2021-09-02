import { observable } from "mobx";
import CatalogMemberMixin from "../../ModelMixins/CatalogMemberMixin";
import ResultPendingCatalogItemTraits from "../../Traits/TraitsClasses/ResultPendingCatalogItemTraits";
import CreateModel from "../Definition/CreateModel";

export default class ResultPendingCatalogItem extends CatalogMemberMixin(
  CreateModel(ResultPendingCatalogItemTraits)
) {
  @observable disableAboutData = true;

  loadPromise: Promise<any> = Promise.resolve();

  protected forceLoadMetadata() {
    return this.loadPromise;
  }
}
