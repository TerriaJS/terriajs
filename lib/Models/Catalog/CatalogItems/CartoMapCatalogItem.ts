import { computed, runInAction } from "mobx";
import Resource from "terriajs-cesium/Source/Core/Resource";
import UrlTemplateImageryProvider from "terriajs-cesium/Source/Scene/UrlTemplateImageryProvider";
import isDefined from "../../../Core/isDefined";
import TerriaError from "../../../Core/TerriaError";
import CatalogMemberMixin from "../../../ModelMixins/CatalogMemberMixin";
import MappableMixin, { MapItem } from "../../../ModelMixins/MappableMixin";
import UrlMixin from "../../../ModelMixins/UrlMixin";
import CartoMapCatalogItemTraits from "../../../Traits/TraitsClasses/CartoMapCatalogItemTraits";
import CreateModel from "../../Definition/CreateModel";
import LoadableStratum from "../../Definition/LoadableStratum";
import { BaseModel } from "../../Definition/Model";
import proxyCatalogItemUrl from "../proxyCatalogItemUrl";
import StratumOrder from "../../Definition/StratumOrder";

export class CartoLoadableStratum extends LoadableStratum(
  CartoMapCatalogItemTraits
) {
  static stratumName = "cartoLoadable";

  constructor(
    readonly catalogItem: CartoMapCatalogItem,
    readonly tileUrl: string,
    readonly tileSubdomains: string[]
  ) {
    super();
  }

  duplicateLoadableStratum(newModel: BaseModel): this {
    return new CartoLoadableStratum(
      newModel as CartoMapCatalogItem,
      this.tileUrl,
      this.tileSubdomains
    ) as this;
  }

  static load(catalogItem: CartoMapCatalogItem): Promise<CartoLoadableStratum> {
    let queryParameters: { auth_token?: string };
    queryParameters = {};
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

    return Promise.resolve()
      .then(() => {
        return resource.post(JSON.stringify(catalogItem.config || {}));
      })
      .then(response => {
        if (response === undefined) {
          throw new TerriaError({
            sender: this,
            title: "Could not load Carto Map layer",
            message:
              "There was an error loading the data for this catalog item."
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
      });
  }
}

StratumOrder.addLoadStratum(CartoLoadableStratum.stratumName);

export default class CartoMapCatalogItem extends MappableMixin(
  UrlMixin(CatalogMemberMixin(CreateModel(CartoMapCatalogItemTraits)))
) {
  static readonly type = "carto";

  get type() {
    return CartoMapCatalogItem.type;
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
    return CartoLoadableStratum.load(this).then(stratum => {
      runInAction(() => {
        this.strata.set(CartoLoadableStratum.stratumName, stratum);
      });
    });
  }

  @computed get cacheDuration(): string {
    if (isDefined(super.cacheDuration)) {
      return super.cacheDuration;
    }
    return "1d";
  }

  @computed get imageryProvider() {
    const stratum = <CartoLoadableStratum>(
      this.strata.get(CartoLoadableStratum.stratumName)
    );

    if (!isDefined(stratum) || !isDefined(stratum.tileUrl)) {
      return;
    }

    let subdomains: string[] | undefined;
    if (isDefined(stratum.tileSubdomains)) {
      subdomains = stratum.tileSubdomains.slice();
    }

    return new UrlTemplateImageryProvider({
      url: proxyCatalogItemUrl(this, stratum.tileUrl),
      maximumLevel: this.maximumLevel,
      minimumLevel: this.minimumLevel,
      credit: this.attribution,
      subdomains: subdomains
    });
  }
}
