import CatalogMemberMixin from "../ModelMixins/CatalogMemberMixin";
import CreateModel from "./CreateModel";
import ResultPendingCatalogItemTraits from "../Traits/ResultPendingCatalogItemTraits";

export default class ResultPendingCatalogItem extends CatalogMemberMixin(
    CreateModel(ResultPendingCatalogItemTraits)
) {
    loadPromise = Promise.resolve();

    get loadMetadataPromise() {
        return this.loadPromise;
    }
}
