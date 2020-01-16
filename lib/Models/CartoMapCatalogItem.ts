import CreateModel from "./CreateModel";
import CatalogMemberMixin from "../ModelMixins/CatalogMemberMixin";
import UrlMixin from "../ModelMixins/UrlMixin";
import CartoMapCatalogItemTraits from "../Traits/CartoMapCatalogItemTraits";
import Mappable from "./Mappable";
import proxyCatalogItemUrl from "./proxyCatalogItemUrl";
import { computed, runInAction } from "mobx";
import TerriaError from "../Core/TerriaError";
import UrlTemplateImageryProvider from "terriajs-cesium/Source/Scene/UrlTemplateImageryProvider";
import Resource from "terriajs-cesium/Source/Core/Resource";
import Rectangle from "terriajs-cesium/Source/Core/Rectangle";
import isDefined from "../Core/isDefined";
import CommonStrata from "./CommonStrata";

export default class CartoMapCatalogItem
  extends UrlMixin(CatalogMemberMixin(CreateModel(CartoMapCatalogItemTraits)))
  implements Mappable {
  static readonly type = "carto";

  get type() {
    return CartoMapCatalogItem.type;
  }

  get isMappable() {
    return true;
  }

  loadMapItems(): Promise<void> {
    if (isDefined(this.tileUrl)) {
      return Promise.resolve();
    }

    let queryParameters: { auth_token?: string };
    queryParameters = {};
    if (this.auth_token) {
      queryParameters.auth_token = this.auth_token;
    }

    if (this.url === undefined) {
      throw new TerriaError({
        title: "Unable to load Carto Map layer",
        message:
          "The Carto Map layer cannot be loaded the catalog item does not have a `url`."
      });
    }

    const resource = new Resource({
      url: this.url,
      headers: {
        "Content-Type": "application/json"
      },
      queryParameters: queryParameters
    });

    let promise = resource.post(JSON.stringify(this.config || {}));
    if (promise === undefined) {
      throw new TerriaError({
        sender: this,
        title: "Could not load Carto Map layer",
        message: "There was an error loading the data for this catalog item."
      });
    }

    return promise.then(response => {
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

      runInAction(() => {
        this.setTrait(CommonStrata.user, "tileUrl", url);
        if (!isDefined(this.tileSubdomains)) {
          this.setTrait(CommonStrata.user, "tileSubdomains", subdomains);
        }
      });

      return Promise.resolve();
    });
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

  @computed get imageryProvider() {
    if (!isDefined(this.tileUrl)) {
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
    if (isDefined(this.tileSubdomains)) {
      subdomains = this.tileSubdomains.slice();
    }

    return new UrlTemplateImageryProvider({
      url: proxyCatalogItemUrl(this, this.tileUrl),
      maximumLevel: this.maximumLevel,
      minimumLevel: this.minimumLevel,
      credit: this.attribution,
      subdomains: subdomains,
      rectangle: rectangle
    });
  }
}
