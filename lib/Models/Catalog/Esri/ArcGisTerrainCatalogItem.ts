import { computed } from "mobx";
import { ArcGISTiledElevationTerrainProvider as ArcGISTiledElevationTerrainProvider } from "cesium";
import { Credit as Credit } from "cesium";
import MappableMixin from "../../../ModelMixins/MappableMixin";
import CatalogMemberMixin from "../../../ModelMixins/CatalogMemberMixin";
import UrlMixin from "../../../ModelMixins/UrlMixin";
import ArcGisTerrainCatalogItemTraits from "../../../Traits/TraitsClasses/ArcGisTerrainCatalogItemTraits";
import CreateModel from "../../Definition/CreateModel";

export default class ArcGisTerrainCatalogItem extends UrlMixin(
  MappableMixin(CatalogMemberMixin(CreateModel(ArcGisTerrainCatalogItemTraits)))
) {
  static type = "arcgis-terrain";

  get type() {
    return ArcGisTerrainCatalogItem.type;
  }

  @computed
  get mapItems() {
    if (this.url === undefined) return [];
    const item = new ArcGISTiledElevationTerrainProvider({
      url: this.url
    });
    if (this.attribution) item.credit = new Credit(this.attribution);
    return [];
  }

  protected forceLoadMapItems(): Promise<void> {
    return Promise.resolve();
  }
}
