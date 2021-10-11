import { observable, makeObservable } from "mobx";
import CatalogMemberMixin from "../../ModelMixins/CatalogMemberMixin";
import ResultPendingCatalogItemTraits from "../../Traits/TraitsClasses/ResultPendingCatalogItemTraits";
import CreateModel from "../Definition/CreateModel";
import { BaseModel } from "../Definition/Model";
import Terria from "../Terria";

export default class ResultPendingCatalogItem extends CatalogMemberMixin(
  CreateModel(ResultPendingCatalogItemTraits)
) {
  @observable disableAboutData = true;

  loadPromise: Promise<any> = Promise.resolve();

  constructor(
    id: string | undefined,
    terria: Terria,
    sourceReference?: BaseModel | undefined,
    strata?: Map<string, ResultPendingCatalogItemTraits> | undefined
  ) {
    super(id, terria, sourceReference, strata);

    makeObservable(this);
  }

  protected forceLoadMetadata() {
    return this.loadPromise;
  }
}
