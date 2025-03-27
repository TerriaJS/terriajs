import { computed, makeObservable, override, runInAction } from "mobx";
import Resource from "terriajs-cesium/Source/Core/Resource";
import UrlTemplateImageryProvider from "terriajs-cesium/Source/Scene/UrlTemplateImageryProvider";
import isDefined from "../../../Core/isDefined";
import TerriaError from "../../../Core/TerriaError";
import CatalogMemberMixin from "../../../ModelMixins/CatalogMemberMixin";
import MappableMixin, { MapItem } from "../../../ModelMixins/MappableMixin";
import UrlMixin from "../../../ModelMixins/UrlMixin";
import CartoMapV1CatalogItemTraits from "../../../Traits/TraitsClasses/CartoMapV1CatalogItemTraits";
import CreateModel from "../../Definition/CreateModel";
import LoadableStratum, {
  LockedDownStratum
} from "../../Definition/LoadableStratum";
import { BaseModel, ModelConstructorParameters } from "../../Definition/Model";
import StratumOrder from "../../Definition/StratumOrder";
import proxyCatalogItemUrl from "../proxyCatalogItemUrl";

export class CartoLoadableStratum
  extends LoadableStratum(CartoMapV1CatalogItemTraits)
  implements
    LockedDownStratum<CartoMapV1CatalogItemTraits, CartoLoadableStratum>
{
  static stratumName = "cartoLoadable";

  constructor(
    private readonly catalogItem: CartoMapV1CatalogItem,
    private readonly _tileUrl: string,
    private readonly _tileSubdomains: string[]
  ) {
    super();
  }

  duplicateLoadableStratum(newModel: BaseModel): this {
    return new CartoLoadableStratum(
      newModel as CartoMapV1CatalogItem,
      this._tileUrl,
      this._tileSubdomains
    ) as this;
  }

  static async load(
    catalogItem: CartoMapV1CatalogItem
  ): Promise<CartoLoadableStratum> {
    const queryParameters: { auth_token?: string } = {};
    if (catalogItem.auth_token) {
      queryParameters.auth_token = catalogItem.auth_token;
    }

    if (catalogItem.url === undefined) {
      return Promise.reject(
        new TerriaError({
          title: "Unable to load Carto Map layer",
          message:
            "The Carto Map layer cannot be loaded the catalog item does not have a `url`."
        })
      );
    }

    const resource = new Resource({
      url: catalogItem.url,
      headers: {
        "Content-Type": "application/json"
      },
      queryParameters: queryParameters
    });

    const response = await resource.post(
      JSON.stringify(catalogItem.config || {})
    );
    if (response === undefined) {
      throw new TerriaError({
        sender: this,
        title: "Could not load Carto Map layer",
        message: "There was an error loading the data for this catalog item."
      });
    }
    const map = JSON.parse(response);
    let url: string;
    let subdomains: string[];
    const metadataUrl =
      map.metadata && map.metadata.url && map.metadata.url.raster;
    if (metadataUrl) {
      url = metadataUrl.urlTemplate;
      subdomains = metadataUrl.subdomains;
    } else {
      throw new TerriaError({
        sender: this,
        title: "No URL",
        message: "Unable to find a usable URL for the Carto Map layer."
      });
    }
    const stratum = new CartoLoadableStratum(catalogItem, url, subdomains);
    return stratum;
  }

  get tileUrl() {
    return this._tileUrl;
  }

  get tileSubdomains() {
    return this._tileSubdomains;
  }
}

StratumOrder.addLoadStratum(CartoLoadableStratum.stratumName);

export default class CartoMapV1CatalogItem extends MappableMixin(
  UrlMixin(CatalogMemberMixin(CreateModel(CartoMapV1CatalogItemTraits)))
) {
  static readonly type = "carto";

  constructor(...args: ModelConstructorParameters) {
    super(...args);
    makeObservable(this);
  }

  get type() {
    return CartoMapV1CatalogItem.type;
  }

  @computed get mapItems(): MapItem[] {
    if (isDefined(this.imageryProvider)) {
      return [
        {
          alpha: this.opacity,
          show: this.show,
          imageryProvider: this.imageryProvider,
          clippingRectangle: this.clipToRectangle
            ? this.cesiumRectangle
            : undefined
        }
      ];
    }
    return [];
  }

  protected forceLoadMapItems(): Promise<void> {
    return CartoLoadableStratum.load(this).then((stratum) => {
      runInAction(() => {
        this.strata.set(CartoLoadableStratum.stratumName, stratum);
      });
    });
  }

  @override
  get cacheDuration(): string {
    if (isDefined(super.cacheDuration)) {
      return super.cacheDuration;
    }
    return "1d";
  }

  @computed get imageryProvider() {
    if (!isDefined(this.tileUrl)) {
      return;
    }

    return new UrlTemplateImageryProvider({
      url: proxyCatalogItemUrl(this, this.tileUrl),
      maximumLevel: this.maximumLevel ?? 25,
      minimumLevel: this.minimumLevel ?? 0,
      credit: this.attribution,
      subdomains: this.tileSubdomains?.slice(),
      tileHeight: this.tileHeight,
      tileWidth: this.tileWidth
    });
  }
}
