import { computed, makeObservable } from "mobx";
import ArcGISTiledElevationTerrainProvider from "terriajs-cesium/Source/Core/ArcGISTiledElevationTerrainProvider";
import Credit from "terriajs-cesium/Source/Core/Credit";
import MappableMixin from "../../../ModelMixins/MappableMixin";
import CatalogMemberMixin from "../../../ModelMixins/CatalogMemberMixin";
import UrlMixin from "../../../ModelMixins/UrlMixin";
import ArcGisTerrainCatalogItemTraits from "../../../Traits/TraitsClasses/ArcGisTerrainCatalogItemTraits";
import { ModelConstructorParameters } from "../../Definition/Model";
import CreateModel from "../../Definition/CreateModel";

export default class ArcGisTerrainCatalogItem extends UrlMixin(
  MappableMixin(CatalogMemberMixin(CreateModel(ArcGisTerrainCatalogItemTraits)))
) {
  static type = "arcgis-terrain";

  constructor(...args: ModelConstructorParameters) {
    super(...args);
    makeObservable(this);
  }

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
