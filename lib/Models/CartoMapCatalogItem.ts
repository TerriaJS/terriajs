import CreateModel from "./CreateModel";
import CatalogMemberMixin from "../ModelMixins/CatalogMemberMixin";
import UrlMixin from "../ModelMixins/UrlMixin";
import AsyncMappableMixin from "../ModelMixins/AsyncMappableMixin";
import CartoMapCatalogItemTraits from "../Traits/CartoMapCatalogItemTraits";
import Mappable from "./Mappable";
import proxyCatalogItemUrl from "./proxyCatalogItemUrl";
import { computed, runInAction } from "mobx";
import TerriaError from "../Core/TerriaError";
import UrlTemplateImageryProvider from "terriajs-cesium/Source/Scene/UrlTemplateImageryProvider";
import Resource from "terriajs-cesium/Source/Core/Resource";
import Rectangle from "terriajs-cesium/Source/Core/Rectangle";
import isDefined from "../Core/isDefined";
import LoadableStratum from "./LoadableStratum";
import StratumOrder from "./StratumOrder";
import { BaseModel } from "./Model";

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
      throw new TerriaError({
        title: "Unable to load Carto Map layer",
        message:
          "The Carto Map layer cannot be loaded the catalog item does not have a `url`."
      });
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

        const map = JSON.parse(<string>response);

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

export default class CartoMapCatalogItem
  extends AsyncMappableMixin(
    UrlMixin(CatalogMemberMixin(CreateModel(CartoMapCatalogItemTraits)))
  )
  implements Mappable {
  static readonly type = "carto";

  get type() {
    return CartoMapCatalogItem.type;
  }

  get isMappable() {
    return true;
  }

  @computed get mapItems() {
    if (isDefined(this.imageryProvider)) {
      return [
        {
          alpha: this.opacity,
          show: this.show,
          imageryProvider: this.imageryProvider
        }
      ];
    }
    return [];
  }

  protected forceLoadMetadata(): Promise<void> {
    return Promise.resolve();
  }

  protected forceLoadMapItems(): Promise<void> {
    return CartoLoadableStratum.load(this).then(stratum => {
      runInAction(() => {
        this.strata.set(CartoLoadableStratum.stratumName, stratum);
      });
    });
  }

  @computed get imageryProvider() {
    const stratum = <CartoLoadableStratum>(
      this.strata.get(CartoLoadableStratum.stratumName)
    );

    if (!isDefined(stratum) || !isDefined(stratum.tileUrl)) {
      return;
    }

    let rectangle: Rectangle | undefined;
    if (isDefined(this.rectangle)) {
      const { west, south, east, north } = this.rectangle;
      if (
        isDefined(west) &&
        isDefined(south) &&
        isDefined(east) &&
        isDefined(north)
      ) {
        rectangle = Rectangle.fromDegrees(west, south, east, north);
      }
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
      subdomains: subdomains,
      rectangle: rectangle
    });
  }
}
