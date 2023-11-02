import { computed } from "mobx";
import UrlTemplateImageryProvider from "terriajs-cesium/Source/Scene/UrlTemplateImageryProvider";
import isDefined from "../../../Core/isDefined";
import CatalogMemberMixin from "../../../ModelMixins/CatalogMemberMixin";
import MappableMixin, { MapItem } from "../../../ModelMixins/MappableMixin";
import UrlTemplateImageryCatalogItemTraits from "../../../Traits/TraitsClasses/UrlTemplateImageryCatalogItemTraits";
import CreateModel from "../../Definition/CreateModel";
import proxyCatalogItemUrl from "../proxyCatalogItemUrl";

/** See https://cesium.com/learn/cesiumjs/ref-doc/UrlTemplateImageryProvider.html#url for available keywords:
 * - {z}: The level of the tile in the tiling scheme. Level zero is the root of the quadtree pyramid.
 * - {x}: The tile X coordinate in the tiling scheme, where 0 is the Westernmost tile.
 * - {y}: The tile Y coordinate in the tiling scheme, where 0 is the Northernmost tile.
 * - {s}: One of the available subdomains, used to overcome browser limits on the number of simultaneous requests per host.
 */
export default class UrlTemplateImageryCatalogItem extends MappableMixin(
  CatalogMemberMixin(CreateModel(UrlTemplateImageryCatalogItemTraits))
) {
  static readonly type = "url-template-imagery";

  get type() {
    return UrlTemplateImageryCatalogItem.type;
  }

  protected forceLoadMapItems(): Promise<void> {
    return Promise.resolve();
  }

  @computed get mapItems(): MapItem[] {
    const imageryProvider = this.imageryProvider;
    if (!isDefined(imageryProvider)) {
      return [];
    }
    return [
      {
        show: this.show,
        alpha: this.opacity,
        imageryProvider,
        clippingRectangle: this.clipToRectangle
          ? this.cesiumRectangle
          : undefined
      }
    ];
  }

  @computed get imageryProvider() {
    if (!isDefined(this.url)) {
      return;
    }

    return new UrlTemplateImageryProvider({
      url: proxyCatalogItemUrl(this, this.url),
      subdomains: this.subdomains.slice(),
      credit: this.attribution,
      maximumLevel: this.maximumLevel,
      minimumLevel: this.minimumLevel,
      tileHeight: this.tileHeight,
      tileWidth: this.tileWidth,
      pickFeaturesUrl: this.pickFeaturesUrl,
      enablePickFeatures: this.allowFeaturePicking
    });
  }
}
