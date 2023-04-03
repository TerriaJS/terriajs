import { computed } from "mobx";
// import UrlTemplateImageryProvider from "terriajs-cesium/Source/Scene/UrlTemplateImageryProvider";
import isDefined from "../../../Core/isDefined";
import CatalogMemberMixin from "../../../ModelMixins/CatalogMemberMixin";
import MappableMixin, { MapItem } from "../../../ModelMixins/MappableMixin";
import CogCatalogItemTraits from "../../../Traits/TraitsClasses/CogCatalogItemTraits";
import CreateModel from "../../Definition/CreateModel";
import proxyCatalogItemUrl from "../proxyCatalogItemUrl";
import TIFFImageryProvider from "tiff-imagery-provider";
import ImageryProvider from "terriajs-cesium/Source/Scene/ImageryProvider";

const proj4 = require("proj4").default;

/** See https://cesium.com/learn/cesiumjs/ref-doc/UrlTemplateImageryProvider.html#url for available keywords:
 * - {z}: The level of the tile in the tiling scheme. Level zero is the root of the quadtree pyramid.
 * - {x}: The tile X coordinate in the tiling scheme, where 0 is the Westernmost tile.
 * - {y}: The tile Y coordinate in the tiling scheme, where 0 is the Northernmost tile.
 * - {s}: One of the available subdomains, used to overcome browser limits on the number of simultaneous requests per host.
 */
export default class CogCatalogItem extends MappableMixin(
  CatalogMemberMixin(CreateModel(CogCatalogItemTraits))
) {
  static readonly type = "cog";

  get type() {
    return CogCatalogItem.type;
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

    // TODO: TIFFImageryProvider does not requrie everything we need for ImageryProvider type. Extra properties added at the end but not neat.
    let tifImageryProvider: any = new TIFFImageryProvider({
      url: proxyCatalogItemUrl(this, this.url),
      projFunc: (code) => {
        if (code === 32751) {
          proj4.defs(
            "EPSG:32751",
            "+proj=utm +zone=51 +south +datum=WGS84 +units=m +no_defs +type=crs"
          );
          return proj4("EPSG:32751", "EPSG:4326").forward;
        }
      },
      renderOptions: {
        /** nodata value, default read from tiff meta */
        nodata: 0
      },
      // subdomains: this.subdomains.slice(),
      credit: this.attribution,
      maximumLevel: this.maximumLevel,
      minimumLevel: this.minimumLevel,
      // tileHeight: this.tileHeight,
      // tileWidth: this.tileWidth,
      // pickFeaturesUrl: this.pickFeaturesUrl,
      enablePickFeatures: this.allowFeaturePicking
    });

    // Set values to please poor cesium types
    tifImageryProvider.defaultNightAlpha = undefined;
    tifImageryProvider.defaultNightAlpha = undefined;
    tifImageryProvider.defaultDayAlpha = undefined;
    tifImageryProvider.hasAlphaChannel = true;
    tifImageryProvider.defaultAlpha = <any>undefined;
    tifImageryProvider.defaultBrightness = <any>undefined;
    tifImageryProvider.defaultContrast = <any>undefined;
    tifImageryProvider.defaultGamma = <any>undefined;
    tifImageryProvider.defaultHue = <any>undefined;
    tifImageryProvider.defaultSaturation = <any>undefined;
    tifImageryProvider.defaultMagnificationFilter = undefined as any;
    tifImageryProvider.defaultMinificationFilter = undefined as any;
    tifImageryProvider.proxy = <any>undefined;
    tifImageryProvider.tileDiscardPolicy = <any>undefined;

    return tifImageryProvider;
  }
}

// class CogImageryProvider
//   extends TIFFImageryProvider
// {
//  constructor() {
//   super();
//   // Set values to please poor cesium types
//   defaultNightAlpha = undefined;
//   defaultDayAlpha = undefined;
//   hasAlphaChannel = true;
//   defaultAlpha = <any>undefined;
//   defaultBrightness = <any>undefined;
//   defaultContrast = <any>undefined;
//   defaultGamma = <any>undefined;
//   defaultHue = <any>undefined;
//   defaultSaturation = <any>undefined;
//   defaultMagnificationFilter = undefined as any;
//   defaultMinificationFilter = undefined as any;
//   proxy = <any>undefined;
//   tileDiscardPolicy = <any>undefined;
//  }

// }
