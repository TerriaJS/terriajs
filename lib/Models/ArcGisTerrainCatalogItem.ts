import { computed } from "mobx";
import ArcGISTiledElevationTerrainProvider from "terriajs-cesium/Source/Core/ArcGISTiledElevationTerrainProvider";
import IonResource from "terriajs-cesium/Source/Core/IonResource";
import AsyncMappableMixin from "../ModelMixins/AsyncMappableMixin";
import CatalogMemberMixin from "../ModelMixins/CatalogMemberMixin";
import UrlMixin from "../ModelMixins/UrlMixin";
import ArcGisTerrainCatalogItemTraits from "../Traits/ArcGisTerrainCatalogItemTraits";
import CreateModel from "./CreateModel";
import Mappable from "./Mappable";

export default class ArcGisTerrainCatalogItem
  extends UrlMixin(
    AsyncMappableMixin(
      CatalogMemberMixin(CreateModel(ArcGisTerrainCatalogItemTraits))
    )
  )
  implements Mappable {
  static type = "arcgis-terrain";

  get type() {
    return ArcGisTerrainCatalogItem.type;
  }

  protected forceLoadMetadata() {
    return Promise.resolve();
  }

  protected forceLoadMapItems() {
    return Promise.resolve();
  }

  @computed
  get mapItems() {
    if (this.url === undefined) return [];
    return [
      new ArcGISTiledElevationTerrainProvider({
        url: this.url
      })
    ];
  }
}
