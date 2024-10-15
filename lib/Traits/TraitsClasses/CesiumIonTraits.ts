import primitiveTrait from "../Decorators/primitiveTrait";
import ModelTraits from "../ModelTraits";

export default class CesiumIonTraits extends ModelTraits {
  @primitiveTrait({
    type: "number",
    name: "Cesium ion asset ID",
    description:
      "The Cesium ion asset id. If this is set then the `url` is ignored"
  })
  ionAssetId?: number;

  @primitiveTrait({
    type: "string",
    name: "Cesium ion access token",
    description:
      "Cesium ion access token. If not specified, the default token is used."
  })
  ionAccessToken?: string;

  @primitiveTrait({
    type: "string",
    name: "Ion server",
    description:
      "URL of the Cesium ion API server. If not specified, the default Ion server, `https://api.cesium.com/`, is used."
  })
  ionServer?: string;
}
