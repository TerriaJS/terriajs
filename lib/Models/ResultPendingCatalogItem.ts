import { observable } from "mobx";
import CatalogMemberMixin from "../ModelMixins/CatalogMemberMixin";
import ResultPendingCatalogItemTraits from "../Traits/ResultPendingCatalogItemTraits";
import CreateModel from "./CreateModel";

export default class ResultPendingCatalogItem extends CatalogMemberMixin(
  CreateModel(ResultPendingCatalogItemTraits)
) {
  @observable showsInfo = false;
  @observable isMappable = false;

  loadPromise = Promise.resolve();

  protected forceLoadMetadata() {
    return this.loadPromise;
  }
}
