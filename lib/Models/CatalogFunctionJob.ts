import { observable } from "mobx";
import CatalogMemberMixin from "../ModelMixins/CatalogMemberMixin";
import CreateModel from "./CreateModel";
import CatalogFunctionJobTraits from "../Traits/CatalogFunctionJobTraits";
import AutoRefreshingMixin from "../ModelMixins/AutoRefreshingMixin";
import AsyncChartableMixin from "../ModelMixins/AsyncChartableMixin";
import AsyncMappableMixin from "../ModelMixins/AsyncMappableMixin";

export default class CatalogFunctionJob extends AsyncChartableMixin(
  AsyncMappableMixin(AutoRefreshingMixin(
  CatalogMemberMixin(CreateModel(CatalogFunctionJobTraits))
  ))) {
  @observable showsInfo = false;
  @observable isMappable = false;

  loadPromise = Promise.resolve();

  protected forceLoadMetadata() {
    return this.loadPromise;
  }
}
