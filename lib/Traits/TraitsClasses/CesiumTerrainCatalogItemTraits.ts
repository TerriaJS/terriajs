import CatalogMemberTraits from "./CatalogMemberTraits";
import MappableTraits from "./MappableTraits";
import mixTraits from "../mixTraits";
import primitiveTrait from "../Decorators/primitiveTrait";
import UrlTraits from "./UrlTraits";

export default class CesiumTerrainCatalogItemTraits extends mixTraits(
  UrlTraits,
  MappableTraits,
  CatalogMemberTraits
) {
  @primitiveTrait({
    name: "Ion Asset ID",
    type: "number",
    description: "The ID of the Cesium Ion Asset. If this is set url is ignored"
  })
  ionAssetId?: number;

  @primitiveTrait({
    name: "Ion Access Token",
    type: "string",
    description:
      "The Cesium Ion access token to use to access the terrain. If not specified, the token"
  })
  ionAccessToken?: string;

  @primitiveTrait({
    name: "Ion Server",
    type: "string",
    description:
      "the Cesium Ion access token to use to access the terrain. If not specified, the default Ion server, `https://api.cesium.com/`"
  })
  ionServer?: string;
}
