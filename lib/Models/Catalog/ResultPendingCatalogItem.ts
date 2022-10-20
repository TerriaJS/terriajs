import { observable, makeObservable } from "mobx";
import CatalogMemberMixin from "../../ModelMixins/CatalogMemberMixin";
import ResultPendingCatalogItemTraits from "../../Traits/TraitsClasses/ResultPendingCatalogItemTraits";
import CreateModel from "../Definition/CreateModel";

export default class ResultPendingCatalogItem extends CatalogMemberMixin(
  CreateModel(ResultPendingCatalogItemTraits)
) {
  @observable disableAboutData = true;

  loadPromise: Promise<any> = Promise.resolve();

  constructor() {
    // TODO: [mobx-undecorate] verify the constructor arguments and the arguments of this automatically generated super call
    super();

    makeObservable(this);
  }

  protected forceLoadMetadata() {
    return this.loadPromise;
  }
}
