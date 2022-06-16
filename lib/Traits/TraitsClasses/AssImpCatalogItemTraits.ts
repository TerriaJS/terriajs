import primitiveArrayTrait from "../Decorators/primitiveArrayTrait";
import mixTraits from "../mixTraits";
import GltfCatalogItemTraits from "./GltfCatalogItemTraits";

export default class ColladaCatalogItemTraits extends mixTraits(
  GltfCatalogItemTraits
) {
  @primitiveArrayTrait({
    type: "string",
    name: "URLs",
    description: `An array of URLs`
  })
  urls?: string[] = [];
}
