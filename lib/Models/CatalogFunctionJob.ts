import { observable } from "mobx";
import CatalogMemberMixin from "../ModelMixins/CatalogMemberMixin";
import CreateModel from "./CreateModel";
import CatalogFunctionJobTraits from "../Traits/CatalogFunctionJobTraits";

export default class CatalogFunctionJob extends CatalogMemberMixin(
  CreateModel(CatalogFunctionJobTraits)
) {
  @observable showsInfo = false;
  @observable isMappable = false;

  loadPromise = Promise.resolve();

  protected forceLoadMetadata() {
    return this.loadPromise;
  }
}
