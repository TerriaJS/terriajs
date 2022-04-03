import { computed } from "mobx";
import MapboxImageryProvider from "terriajs-cesium/Source/Scene/MapboxImageryProvider";
import CatalogMemberMixin from "../../../ModelMixins/CatalogMemberMixin";
import MappableMixin, { MapItem } from "../../../ModelMixins/MappableMixin";
import MapboxMapCatalogItemTraits from "../../../Traits/TraitsClasses/MapboxMapCatalogItemTraits";
import CreateModel from "../../Definition/CreateModel";
import proxyCatalogItemUrl from "../proxyCatalogItemUrl";

/**
 *  A raster catalog item representing a layer from the Mapbox server.
 */
export default class MapboxMapCatalogItem extends CatalogMemberMixin(
  MappableMixin(CreateModel(MapboxMapCatalogItemTraits))
) {
  static readonly type = "mapbox-map";
  readonly type = MapboxMapCatalogItem.type;

  @computed
  private get imageryProvider(): MapboxImageryProvider | undefined {
    const mapId = this.mapId;
    const accessToken = this.accessToken;
    if (mapId === undefined || accessToken === undefined) {
      return;
    }

    const url =
      this.url === undefined ? undefined : proxyCatalogItemUrl(this, this.url);
    const imageryProvider = new MapboxImageryProvider({
      url,
      mapId,
      accessToken,
      credit: this.attribution,
      maximumLevel: this.maximumLevel ?? 25,
      minimumLevel: this.minimumLevel,
      format: this.format
    });
    return imageryProvider;
  }

  forceLoadMapItems() {
    return Promise.resolve();
  }

  @computed
  get mapItems(): MapItem[] {
    const imageryProvider = this.imageryProvider;
    if (imageryProvider === undefined) {
      return [];
    }

    const imageryPart = {
      imageryProvider,
      show: this.show,
      alpha: this.opacity,
      clippingRectangle: this.clipToRectangle ? this.cesiumRectangle : undefined
    };
    return [imageryPart];
  }
}
