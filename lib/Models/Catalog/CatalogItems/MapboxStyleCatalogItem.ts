import { computed, makeObservable } from "mobx";
import MapboxStyleImageryProvider from "terriajs-cesium/Source/Scene/MapboxStyleImageryProvider";
import CatalogMemberMixin from "../../../ModelMixins/CatalogMemberMixin";
import MappableMixin, { MapItem } from "../../../ModelMixins/MappableMixin";
import ModelTraits from "../../../Traits/ModelTraits";
import MapboxStyleCatalogItemTraits from "../../../Traits/TraitsClasses/MapboxStyleCatalogItemTraits";
import CreateModel from "../../Definition/CreateModel";
import { BaseModel } from "../../Definition/Model";
import Terria from "../../Terria";

/**
 *  A raster catalog item for rendering styled mapbox layers.
 */
export default class MapboxStyleCatalogItem extends MappableMixin(
  CatalogMemberMixin(CreateModel(MapboxStyleCatalogItemTraits))
) {
  static readonly type = "mapbox-style";
  readonly type = MapboxStyleCatalogItem.type;

  constructor(
    id: string | undefined,
    terria: Terria,
    sourceReference?: BaseModel | undefined,
    strata?: Map<string, ModelTraits> | undefined
  ) {
    super(id, terria, sourceReference, strata);

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
      scaleFactor: this.scaleFactor,
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
