import { computed, runInAction } from "mobx";
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
import StratumOrder from "../../Definition/StratumOrder";
import LoadableStratum from "../../Definition/LoadableStratum";
import i18next from "i18next";
import { BaseModel } from "../../Definition/Model";
import { TerriaError } from "terriajs-plugin-api";
import Rectangle from "terriajs-cesium/Source/Core/Rectangle";
import { RectangleTraits } from "../../../Traits/TraitsClasses/MappableTraits";
import createStratumInstance from "../../Definition/createStratumInstance";
import { ImageryProviderWithGridLayerSupport } from "../../../Map/Leaflet/ImageryProviderLeafletGridLayer";
const proj4 = require("proj4").default;

export default class CogCatalogItem extends MappableMixin(
  CatalogMemberMixin(CreateModel(CogCatalogItemTraits))
) {
  static readonly type = "cog";

  get type() {
    return CogCatalogItem.type;
  }

  // // Creating the Leaflet Layer
  // // TODO: Dont have this here, instead all Mappables should implement our new function createLeafletLayer(imageryProvider, clippingRectangle)
  // private _createImageryLayer: (
  //   ip: ImageryProvider,
  //   clippingRectangle: Rectangle | undefined
  // ) => GridLayer = computedFn((ip, clippingRectangle) => {
  //   const layerOptions = {
  //     bounds: clippingRectangle && rectangleToLatLngBounds(clippingRectangle)
  //   };

  //   // TODO: instantiate a new GeorasterLayer, pass in the rectabnlge in the options
  //   const geoRasterLayer = new GeorasterLayer...

  //   return geoRasterLayer
  // });

  // imageryProvider: CogImageryProvider;

  // protected async forceLoadMetadata(): Promise<void> {
  //   const stratum = await CogStratum.load(this);
  //   runInAction(() => {
  //     this.strata.set(CogStratum.stratumName, stratum);
  //   });
  // }

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

export class CogImageryProvider
  extends TIFFImageryProvider
  implements ImageryProviderWithGridLayerSupport
{
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
