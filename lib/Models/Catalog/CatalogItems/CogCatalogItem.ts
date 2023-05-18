import { computed } from "mobx";
import isDefined from "../../../Core/isDefined";
import CatalogMemberMixin from "../../../ModelMixins/CatalogMemberMixin";
import MappableMixin, { MapItem } from "../../../ModelMixins/MappableMixin";
import CogCatalogItemTraits from "../../../Traits/TraitsClasses/CogCatalogItemTraits";
import CreateModel from "../../Definition/CreateModel";
import proxyCatalogItemUrl from "../proxyCatalogItemUrl";
import TIFFImageryProvider from "../../../ThirdParty/tiff-imagery-provider";
import Credit from "terriajs-cesium/Source/Core/Credit";
import Proj4Definitions from "../../../Map/Vector/Proj4Definitions";
import Reproject from "../../../Map/Vector/Reproject";
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

  /**
   * Handle all different possible projections of COGs
   * @param code Should be a number representing an EPSG code
   * @returns a Promise that resolves to a proj reprojection function
   */
  projFunc = (code: number) => {
    const sourceEpsgCode = `EPSG:${code}`;
    // Add the projection to our proj4 defs if we dont already have it:
    return Reproject.checkProjection(
      this.terria.configParameters.proj4ServiceBaseUrl,
      sourceEpsgCode
    )
      .then(() => {
        const sourceDef =
          sourceEpsgCode in Proj4Definitions
            ? new proj4.Proj(Proj4Definitions[sourceEpsgCode])
            : undefined;

        return proj4(sourceDef, "EPSG:4326").forward;
      })
      .catch((err) => {
        // TODO: Should we handle the error more formally as per Terria patterns?
        console.log(err);
      });
  };

  @computed get imageryProvider() {
    // TODO: What is this for?
    if (!isDefined(this.url)) {
      return;
    }

    let tifImageryProvider: CogImageryProvider = new CogImageryProvider({
      url: proxyCatalogItemUrl(this, this.url),
      projFunc: this.projFunc,
      renderOptions: {
        /** nodata value, default read from tiff meta */
        nodata: 0
      }
    });

    return tifImageryProvider;
  }
}

export class CogImageryProvider extends TIFFImageryProvider {
  // Set values to please poor cesium types
  defaultNightAlpha = undefined;
  defaultDayAlpha = undefined;
  hasAlphaChannel = true;
  defaultAlpha = <any>undefined;
  defaultBrightness = <any>undefined;
  defaultContrast = <any>undefined;
  defaultGamma = <any>undefined;
  defaultHue = <any>undefined;
  defaultSaturation = <any>undefined;
  defaultMagnificationFilter = undefined as any;
  defaultMinificationFilter = undefined as any;
  proxy = <any>undefined;
  tileDiscardPolicy = <any>undefined;

  getTileCredits(x: number, y: number, level: number): Credit[] {
    return [];
  }

  // // TODO: Do we need to implement this?
  // // Do we need to conform to `ImageryProviderWithGridLayerSupport` to be able to use in 2D mode?
  // requestImageForCanvas: (
  //   x: number,
  //   y: number,
  //   level: number,
  //   canvas: HTMLCanvasElement
  // ) => Promise<HTMLCanvasElement>;
}
