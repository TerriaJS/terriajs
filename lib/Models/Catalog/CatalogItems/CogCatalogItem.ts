import { computed, override } from "mobx";
import isDefined from "../../../Core/isDefined";
import CatalogMemberMixin from "../../../ModelMixins/CatalogMemberMixin";
import MappableMixin, { MapItem } from "../../../ModelMixins/MappableMixin";
import CogCatalogItemTraits from "../../../Traits/TraitsClasses/CogCatalogItemTraits";
import CreateModel from "../../Definition/CreateModel";
import proxyCatalogItemUrl from "../proxyCatalogItemUrl";
import TIFFImageryProvider, {
  TIFFImageryProviderOptionsWithUrl
} from "terriajs-tiff-imagery-provider";
import Credit from "terriajs-cesium/Source/Core/Credit";
import Proj4Definitions from "../../../Map/Vector/Proj4Definitions";
import Reproject from "../../../Map/Vector/Reproject";
import i18next from "i18next";
const proj4 = require("proj4").default;

export default class CogCatalogItem extends MappableMixin(
  CatalogMemberMixin(CreateModel(CogCatalogItemTraits))
) {
  static readonly type = "cog";

  get type() {
    return CogCatalogItem.type;
  }

  protected async forceLoadMapItems(): Promise<void> {
    await this.imageryProvider?.readyPromise;
    return Promise.resolve();
  }

  @override
  get shortReport(): string | undefined {
    if (this.terria.currentViewer.type === "Leaflet") {
      return i18next.t("models.commonModelErrors.3dTypeIn2dMode", this);
    }
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
        // The 'requestImage' method in Cesium's ImageryProvider has a return type that is stricter than necessary.
        // In our custom ImageryProvider, we return ImageData, which is also a valid return type.
        // However, since the current Cesium type definitions do not reflect this flexibility, we use a TypeScript ignore comment ('@ts-ignore')
        // to suppress the type checking error. This is a temporary solution until the type definitions in Cesium are updated to accommodate ImageData.
        // @ts-ignore
        imageryProvider,
        clippingRectangle: imageryProvider.rectangle
      }
    ];
  }

  /**
   * Handle all different possible projections of COGs
   * @param code Should be a number representing an EPSG code
   * @returns a Promise that resolves to a proj reprojection function
   */
  // TODO: This needs to return an object with a project and an unproject function
  projFunc = (code: number) => {
    const sourceEpsgCode = `EPSG:${code}`;
    // Add the projection to our proj4 defs if we dont already have it:
    const project = Reproject.checkProjection(
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

    const unproject = Reproject.checkProjection(
      this.terria.configParameters.proj4ServiceBaseUrl,
      sourceEpsgCode
    )
      .then(() => {
        const sourceDef =
          sourceEpsgCode in Proj4Definitions
            ? new proj4.Proj(Proj4Definitions[sourceEpsgCode])
            : undefined;

        return proj4("EPSG:4326", sourceDef).forward;
      })
      .catch((error: Error) => {
        this.terria.raiseErrorToUser(error);
      });

    return { project, unproject };
  };

  @computed get imageryProvider() {
    if (!isDefined(this.url)) {
      return;
    }

    const cogOptions: TIFFImageryProviderOptionsWithUrl = {
      url: proxyCatalogItemUrl(this, this.url),
      projFunc: this.projFunc,
      renderOptions: {
        /** nodata value, default read from tiff meta */
        nodata: 0
      },
      enablePickFeatures: this.allowFeaturePicking
    };

    const cogImageryProvider: CogImageryProvider = new CogImageryProvider(
      cogOptions
    );

    return cogImageryProvider;
  }
}

export class CogImageryProvider extends TIFFImageryProvider {
  // Set values to please poor cesium types
  defaultNightAlpha = undefined;
  defaultDayAlpha = undefined;
  hasAlphaChannel = true;
  defaultAlpha = undefined as any;
  defaultBrightness = undefined as any;
  defaultContrast = undefined as any;
  defaultGamma = undefined as any;
  defaultHue = undefined as any;
  defaultSaturation = undefined as any;
  defaultMagnificationFilter = undefined as any;
  defaultMinificationFilter = undefined as any;
  proxy = undefined as any;
  tileDiscardPolicy = undefined as any;

  getTileCredits(x: number, y: number, level: number): Credit[] {
    return [];
  }

  constructor(options: TIFFImageryProviderOptionsWithUrl) {
    super(options);

    // We can extend the constructor here if needed
  }
}
