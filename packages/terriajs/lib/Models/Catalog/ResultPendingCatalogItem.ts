import { makeObservable, override } from "mobx";
import CatalogMemberMixin from "../../ModelMixins/CatalogMemberMixin";
import ResultPendingCatalogItemTraits from "../../Traits/TraitsClasses/ResultPendingCatalogItemTraits";
import CreateModel from "../Definition/CreateModel";
import { ModelConstructorParameters } from "../Definition/Model";

export default class ResultPendingCatalogItem extends CatalogMemberMixin(
  CreateModel(ResultPendingCatalogItemTraits)
) {
  loadPromise: Promise<any> = Promise.resolve();

  constructor(...args: ModelConstructorParameters) {
    super(...args);
    makeObservable(this);
  }

  @override
  get disableAboutData() {
    return super.disableAboutData ?? true;
  }

  protected forceLoadMetadata() {
    return this.loadPromise;
  }
}
