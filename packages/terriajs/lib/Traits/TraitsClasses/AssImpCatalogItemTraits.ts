import primitiveArrayTrait from "../Decorators/primitiveArrayTrait";
import primitiveTrait from "../Decorators/primitiveTrait";
import { traitClass } from "../Trait";
import mixTraits from "../mixTraits";
import GltfCatalogItemTraits from "./GltfCatalogItemTraits";

@traitClass({
  description: `Creates one catalog item from url that points to a 3d model.`,
  example: {
    type: "assimp",
    name: "assimp example",
    urls: [
      "https://raw.githubusercontent.com/kovacsv/assimpjs/main/examples/testfiles/cube_with_materials.obj",
      "https://raw.githubusercontent.com/kovacsv/assimpjs/main/examples/testfiles/cube_with_materials.mtl"
    ],
    baseUrl: "https://github.com/kovacsv/assimpjs/raw/main/examples/testfiles/",
    scale: 100,
    origin: {
      latitude: -42.8826,
      longitude: 147.3257,
      height: 100
    },
    rectangle: {
      west: 147.33,
      south: -42.9,
      east: 147.33,
      north: -42.87
    },
    id: "some unique id"
  }
})
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
}
