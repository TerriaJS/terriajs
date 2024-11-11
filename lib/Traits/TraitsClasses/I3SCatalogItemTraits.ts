import { traitClass } from "../Trait";
import mixTraits from "../mixTraits";
import I3STraits from "./I3STraits";
import Cesium3DTilesCatalogItemTraits from "./Cesium3DTilesCatalogItemTraits";

@traitClass({
  description: `Creates an I3S item in the catalog from an slpk.`,
  example: {
    type: "I3S",
    name: "CoM Melbourne 3D Photo Mesh",
    id: "some-unique-id"
  }
})
export default class I3SCatalogItemTraits extends mixTraits(
  Cesium3DTilesCatalogItemTraits,
  I3STraits
) {}
