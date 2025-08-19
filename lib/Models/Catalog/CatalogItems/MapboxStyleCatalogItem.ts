import { computed, makeObservable } from "mobx";
import MapboxStyleImageryProvider from "terriajs-cesium/Source/Scene/MapboxStyleImageryProvider";
import CatalogMemberMixin from "../../../ModelMixins/CatalogMemberMixin";
import MappableMixin, { MapItem } from "../../../ModelMixins/MappableMixin";
import MapboxStyleCatalogItemTraits from "../../../Traits/TraitsClasses/MapboxStyleCatalogItemTraits";
import { ModelConstructorParameters } from "../../Definition/Model";
import CreateModel from "../../Definition/CreateModel";

/**
 *  A raster catalog item for rendering styled mapbox layers.
 */
export default class MapboxStyleCatalogItem extends MappableMixin(
  CatalogMemberMixin(CreateModel(MapboxStyleCatalogItemTraits))
) {
  static readonly type = "mapbox-style";
  readonly type = MapboxStyleCatalogItem.type;

  constructor(...args: ModelConstructorParameters) {
    super(...args);
    makeObservable(this);
  }

  forceLoadMapItems() {
    return Promise.resolve();
  }

  @computed
  get imageryProvider(): MapboxStyleImageryProvider | undefined {
    const styleId = this.styleId;
    const accessToken = this.accessToken;

    if (styleId === undefined || accessToken === undefined) {
      return;
    }

    const imageryProvider = new MapboxStyleImageryProvider({
      url: this.url,
      username: this.username,
      styleId,
      accessToken,
      tilesize: this.tilesize,
      //Cesium only checks if scaleFactor is definied or not.
      scaleFactor: this.scaleFactor ? this.scaleFactor : undefined,
      minimumLevel: this.minimumLevel,
      maximumLevel: this.maximumLevel,
      credit: this.attribution
    });
    return imageryProvider;
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
