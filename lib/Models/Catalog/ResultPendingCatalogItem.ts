import { observable, makeObservable } from "mobx";
import CatalogMemberMixin from "../../ModelMixins/CatalogMemberMixin";
import ResultPendingCatalogItemTraits from "../../Traits/TraitsClasses/ResultPendingCatalogItemTraits";
import { ModelConstructorParameters } from "../Definition/Model";
import CreateModel from "../Definition/CreateModel";
import { TraitOverrides } from "../Definition/ModelPropertiesFromTraits";

export default class ResultPendingCatalogItem extends CatalogMemberMixin(
  CreateModel(ResultPendingCatalogItemTraits)
) {
  loadPromise: Promise<any> = Promise.resolve();

  constructor(...args: ModelConstructorParameters) {
    super(...args);
    makeObservable(this);
  }

  protected forceLoadMetadata() {
    return this.loadPromise;
  }

  get _newTraitOverrides(): TraitOverrides<ResultPendingCatalogItemTraits> {
    const superOverrides = super._newTraitOverrides;
    return {
      ...superOverrides,
      disableAboutData: () => true
    };
  }
}
