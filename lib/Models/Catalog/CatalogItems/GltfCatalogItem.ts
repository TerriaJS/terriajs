import GltfMixin from "../../../ModelMixins/GltfMixin";
import GltfCatalogItemTraits from "../../../Traits/TraitsClasses/GltfCatalogItemTraits";
import CreateModel from "../../Definition/CreateModel";
export default class GltfCatalogItem extends GltfMixin(
  CreateModel(GltfCatalogItemTraits)
) {
  static readonly type = "gltf";

  get type() {
    return GltfCatalogItem.type;
  }
}
