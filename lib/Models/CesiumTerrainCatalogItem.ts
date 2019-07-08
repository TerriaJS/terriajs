import mixTraits from "../Traits/mixTraits";
import CatalogMemberTraits from "../Traits/CatalogMemberTraits";
import Mappable from "./Mappable";
import ModelTraits from "../Traits/ModelTraits";
import UrlTraits from "../Traits/UrlTraits";
import primitiveArrayTrait from "../Traits/primitiveArrayTrait";
import primitiveTrait from "../Traits/primitiveTrait";
import CreateModel from "./CreateModel";
import UrlMixin from "../ModelMixins/UrlMixin";
import CatalogMemberMixin from "../ModelMixins/CatalogMemberMixin";
import MappableTraits from "../Traits/MappableTraits";
import { computed } from "mobx";
import IonResource from "terriajs-cesium/Source/Core/IonResource";
import CesiumTerrainProvider from "terriajs-cesium/Source/Core/CesiumTerrainProvider";

export class CesiumTerrainCatalogItemTraits extends mixTraits(
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

export default class CesiumTerrainCatalogItem
  extends UrlMixin(
    CatalogMemberMixin(CreateModel(CesiumTerrainCatalogItemTraits))
  )
  implements Mappable {
  static type = "cesium-terrain";

  get type() {
    return CesiumTerrainCatalogItem.type;
  }

  forceLoadMetadata() {
    return Promise.resolve();
  }

  loadMapItems() {
    return Promise.resolve();
  }

  @computed
  get mapItems() {
    let resource: string | Promise<IonResource> = this.url!;
    if (this.ionAssetId !== undefined) {
      resource = IonResource.fromAssetId(this.ionAssetId, {
        accessToken:
          this.ionAccessToken ||
          this.terria.configParameters.cesiumIonAccessToken,
        server: this.ionServer
      });
      // Deal with errors from this better
    }

    return [
      new CesiumTerrainProvider({
        url: resource
      })
    ];
  }
}
