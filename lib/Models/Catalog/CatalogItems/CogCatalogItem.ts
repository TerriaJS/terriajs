import { computed } from "mobx";
import isDefined from "../../../Core/isDefined";
import CatalogMemberMixin from "../../../ModelMixins/CatalogMemberMixin";
import MappableMixin, { MapItem } from "../../../ModelMixins/MappableMixin";
import CogCatalogItemTraits from "../../../Traits/TraitsClasses/CogCatalogItemTraits";
import CreateModel from "../../Definition/CreateModel";
import proxyCatalogItemUrl from "../proxyCatalogItemUrl";
import TIFFImageryProvider, {
  TIFFImageryProviderOptions
} from "../../../ThirdParty/tiff-imagery-provider";
import Credit from "terriajs-cesium/Source/Core/Credit";
import Proj4Definitions from "../../../Map/Vector/Proj4Definitions";
import Reproject from "../../../Map/Vector/Reproject";
import Rectangle from "terriajs-cesium/Source/Core/Rectangle";
import { ImageryProvider } from "terriajs-cesium";
import { GridLayer } from "leaflet";
const proj4 = require("proj4").default;
const parseGeoRaster = require("georaster");
import GeoRasterLayer, { GeoRaster } from "georaster-layer-for-leaflet";
import { IPromiseBasedObservable, fromPromise } from "mobx-utils";
export default class CogCatalogItem extends MappableMixin(
  CatalogMemberMixin(CreateModel(CogCatalogItemTraits))
) {
  static readonly type = "cog";

  get type() {
    return CogCatalogItem.type;
  }

  protected async forceLoadMapItems(): Promise<void> {
    // return this.forceLoadMetadata();
    await this.imageryProvider?.readyPromise;

    return Promise.resolve();
  }

  @computed get mapItems(): MapItem[] {
    const imageryProvider = this.imageryProvider;

    if (!isDefined(imageryProvider) || this.isLoadingMapItems) {
      return [];
    }
    return [
      {
        show: this.show,
        alpha: this.opacity,
        imageryProvider,
        // TODO: Properly define the rectangle here, no matter whether leaflet or cesium mode...
        // clippingRectangle: this.clipToRectangle
        //   ? this.cesiumRectangle
        //   : undefined,
        clippingRectangle: imageryProvider.rectangle,
        // Define our method for generating a leaflet layer in a different way, here
        overrideCreateLeafletLayer: this.createGeoRasterLayer
      }
    ];
  }

  // TODO: Should we move this to a separate file?
  @computed get georasterLayer(): IPromiseBasedObservable<
    GridLayer | undefined
  > {
    return fromPromise(
      // parseGeoRaster will request for external .ovr file, most likely will receive a 404 error. This is not a problem.
      parseGeoRaster(this.url)
        .then((georaster: GeoRaster) => {
          return new GeoRasterLayer({
            georaster: georaster,
            opacity: 0.8,
            // Example pixel reclassification function:
            // pixelValuesToColorFn: (values) => {
            //   return mapElevationToRgbaSmoothed(values, 0);
            // },
            resolution: 256,
            debugLevel: 0
          });
        })
        .catch((error: Error) => {
          this.terria.raiseErrorToUser(error);
        })
    );
  }

  createGeoRasterLayer = (
    ip: ImageryProvider,
    clippingRectangle: Rectangle | undefined
  ): GridLayer | undefined => {
    return this.url && this.georasterLayer.state === "fulfilled"
      ? this.georasterLayer.value
      : undefined;
  };

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
      .catch((error: Error) => {
        this.terria.raiseErrorToUser(error);
      });
  };

  @computed get imageryProvider() {
    if (!isDefined(this.url)) {
      return;
    }

    let cogImageryProvider: CogImageryProvider = new CogImageryProvider({
      url: proxyCatalogItemUrl(this, this.url),
      projFunc: this.projFunc,
      renderOptions: {
        /** nodata value, default read from tiff meta */
        nodata: 0
      }
    });

    return cogImageryProvider;
  }
}

export class CogImageryProvider extends TIFFImageryProvider {
  // implements ImageryProviderWithGridLayerSupport
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

  constructor(options: TIFFImageryProviderOptions) {
    super(options);

    // We can extend the constructor here if needed
  }
}
