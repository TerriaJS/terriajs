import { traitClass } from "../Trait";
import mixTraits from "../mixTraits";
import I3STraits from "./I3STraits";
import Cesium3DTilesCatalogItemTraits from "./Cesium3DTilesCatalogItemTraits";
import primitiveTrait from "../Decorators/primitiveTrait";

@traitClass({
  description: `Creates an I3S item in the catalog from an slpk.`,
  example: {
    url: "https://tiles.arcgis.com/tiles/z2tnIkrLQ2BRzr6P/arcgis/rest/services/SanFrancisco_3DObjects_1_7/SceneServer",
    type: "i3s",
    name: "CoM Melbourne 3D Photo Mesh",
    id: "some-unique-id"
  }
})
export default class I3SCatalogItemTraits extends mixTraits(
  Cesium3DTilesCatalogItemTraits,
  I3STraits
) {
  @primitiveTrait({
    name: "Token",
    description: "Token to use for ArcGIS REST API requests",
    type: "string"
  })
  token?: string;
}
