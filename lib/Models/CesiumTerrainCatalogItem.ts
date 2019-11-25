import { computed } from "mobx";
import CesiumTerrainProvider from "terriajs-cesium/Source/Core/CesiumTerrainProvider";
import IonResource from "terriajs-cesium/Source/Core/IonResource";
import AsyncMappableMixin from "../ModelMixins/AsyncMappableMixin";
import CatalogMemberMixin from "../ModelMixins/CatalogMemberMixin";
import UrlMixin from "../ModelMixins/UrlMixin";
import CesiumTerrainCatalogItemTraits from "../Traits/CesiumTerrainCatalogItemTraits";
import CreateModel from "./CreateModel";
import Mappable from "./Mappable";

export default class CesiumTerrainCatalogItem
  extends UrlMixin(
    AsyncMappableMixin(
      CatalogMemberMixin(CreateModel(CesiumTerrainCatalogItemTraits))
    )
  )
  implements Mappable {
  static type = "cesium-terrain";

  get type() {
    return CesiumTerrainCatalogItem.type;
  }

  protected forceLoadMetadata() {
    return Promise.resolve();
  }

  protected forceLoadMapItems() {
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
