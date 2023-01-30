import { observable, makeObservable } from "mobx";
import CatalogMemberMixin from "../../ModelMixins/CatalogMemberMixin";
import ResultPendingCatalogItemTraits from "../../Traits/TraitsClasses/ResultPendingCatalogItemTraits";
import { ModelConstructorParameters } from "../Definition/Model";
import CreateModel from "../Definition/CreateModel";

export default class ResultPendingCatalogItem extends CatalogMemberMixin(
  CreateModel(ResultPendingCatalogItemTraits)
) {
  @observable disableAboutData = true;

  loadPromise: Promise<any> = Promise.resolve();

  constructor(...args: ModelConstructorParameters) {
    super(...args);
    makeObservable(this);
  }

  protected forceLoadMetadata() {
    return this.loadPromise;
  }
}
