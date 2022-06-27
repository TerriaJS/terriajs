import primitiveArrayTrait from "../Decorators/primitiveArrayTrait";
import primitiveTrait from "../Decorators/primitiveTrait";
import mixTraits from "../mixTraits";
import GltfCatalogItemTraits from "./GltfCatalogItemTraits";

export default class AssImpCatalogItemTraits extends mixTraits(
  GltfCatalogItemTraits
) {
  @primitiveArrayTrait({
    type: "string",
    name: "URLs",
    description: `An array of URLs`
  })
  urls?: string[] = [];

  @primitiveTrait({
    type: "string",
    name: "Base URL",
    description: `The base URL that paths in the 3D model (eg textures) are relative to`
  })
  baseUrl?: string;

  @primitiveTrait({
    type: "boolean",
    name: "Debug download GLTF",
    description: `If true, then GLTF output files will be automatically downloaded`
  })
  debugDownloadGltf?: boolean;
}
