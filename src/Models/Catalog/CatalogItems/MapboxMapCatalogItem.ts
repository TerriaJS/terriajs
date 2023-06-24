import { computed, makeObservable } from "mobx";
import { MapboxImageryProvider } from "cesium";
import CatalogMemberMixin from "../../../ModelMixins/CatalogMemberMixin";
import MappableMixin, { MapItem } from "../../../ModelMixins/MappableMixin";
import MapboxMapCatalogItemTraits from "../../../Traits/TraitsClasses/MapboxMapCatalogItemTraits";
import CreateModel from "../../Definition/CreateModel";
import { ModelConstructorParameters } from "../../Definition/Model";
import proxyCatalogItemUrl from "../proxyCatalogItemUrl";

/**
 *  A raster catalog item representing a layer from the Mapbox server.
 */
export default class MapboxMapCatalogItem extends CatalogMemberMixin(
  MappableMixin(CreateModel(MapboxMapCatalogItemTraits))
) {
  static readonly type = "mapbox-map";
  readonly type = MapboxMapCatalogItem.type;

  constructor(...args: ModelConstructorParameters) {
    super(...args);
    makeObservable(this);
  }

  @computed
  get _private_imageryProvider(): MapboxImageryProvider | undefined {
    const mapId = this.mapId;
    const accessToken = this.accessToken;
    if (mapId === undefined || accessToken === undefined) {
      return;
    }

    const url =
      this.url === undefined ? undefined : proxyCatalogItemUrl(this, this.url);
    const _private_imageryProvider = new MapboxImageryProvider({
      url,
      mapId,
      accessToken,
      credit: this.attribution,
      maximumLevel: this.maximumLevel ?? 25,
      minimumLevel: this.minimumLevel,
      format: this.format
    });
    return _private_imageryProvider;
  }

  _protected_forceLoadMapItems() {
    return Promise.resolve();
  }

  @computed
  get mapItems(): MapItem[] {
    const imageryProvider = this._private_imageryProvider;
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
