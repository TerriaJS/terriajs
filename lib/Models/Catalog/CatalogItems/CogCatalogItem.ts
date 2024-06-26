import i18next from "i18next";
import { computed, override } from "mobx";
import proj4 from "proj4-fully-loaded";
import TextureMagnificationFilter from "terriajs-cesium/Source/Renderer/TextureMagnificationFilter";
import TextureMinificationFilter from "terriajs-cesium/Source/Renderer/TextureMinificationFilter";
import TIFFImageryProvider, {
  TIFFImageryProviderOptionsWithUrl
} from "terriajs-tiff-imagery-provider";
import isDefined from "../../../Core/isDefined";
import CatalogMemberMixin from "../../../ModelMixins/CatalogMemberMixin";
import MappableMixin, { MapItem } from "../../../ModelMixins/MappableMixin";
import CogCatalogItemTraits from "../../../Traits/TraitsClasses/CogCatalogItemTraits";
import CreateModel from "../../Definition/CreateModel";
import proxyCatalogItemUrl from "../proxyCatalogItemUrl";

export default class CogCatalogItem extends MappableMixin(
  CatalogMemberMixin(CreateModel(CogCatalogItemTraits))
) {
  static readonly type = "cog";

  get type() {
    return CogCatalogItem.type;
  }

  protected async forceLoadMapItems(): Promise<void> {
    if (this.imageryProvider) {
      await this.imageryProvider.readyPromise;
    } else {
      // Handle the case where imageryProvider is undefined
      console.error("ImageryProvider is undefined.");
    }
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

    // Ensure imageryProvider is fully initialized here
    if (!imageryProvider.ready) {
      // Return an empty array or a loading state if not ready
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
        // @ts-expect-error - The return type of 'requestImage' method in our custom ImageryProvider can be ImageData, which is not currently allowed in Cesium's type definitions, but is fine.
        imageryProvider: this.imageryProvider,
        clippingRectangle: this.cesiumRectangle
      }
    ];
  }

  projFunc = (code: number) => {
    if (![4326, 3857, 900913].includes(code)) {
      try {
        const prj = proj4("EPSG:4326", `EPSG:${code}`);
        if (prj)
          return {
            project: prj.forward,
            unproject: prj.inverse
          };
      } catch (e) {
        console.error(e);
      }
    }
  };

  @computed get imageryProvider() {
    if (!isDefined(this.url)) {
      return;
    }

    // Construct the options object with properties from CogCatalogItemTraits
    const cogOptions: TIFFImageryProviderOptionsWithUrl = {
      url: proxyCatalogItemUrl(this, this.url),
      // requestOptions: this.requestOptions,
      credit: this.credit,
      tileSize: this.tileSize,
      maximumLevel: this.maximumLevel,
      minimumLevel: this.minimumLevel,
      enablePickFeatures: this.allowFeaturePicking,
      hasAlphaChannel: this.hasAlphaChannel,
      cache: this.cache,
      resampleMethod: this.resampleMethod,
      projFunc: this.projFunc
    };

    const cogImageryProvider: CogImageryProvider = new CogImageryProvider(
      cogOptions
    );

    return cogImageryProvider;
  }
}

export class CogImageryProvider extends TIFFImageryProvider {
  _defaultMagnificationFilter = TextureMagnificationFilter.NEAREST;
  _defaultMinificationFilter = TextureMinificationFilter.NEAREST;

  constructor(options: TIFFImageryProviderOptionsWithUrl) {
    super(options);

    // We can extend the constructor here if needed
  }
}
