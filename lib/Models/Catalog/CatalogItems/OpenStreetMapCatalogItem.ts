import { computed } from "mobx";
import UrlTemplateImageryProvider from "terriajs-cesium/Source/Scene/UrlTemplateImageryProvider";
import URI from "urijs";
import isDefined from "../../../Core/isDefined";
import CatalogMemberMixin from "../../../ModelMixins/CatalogMemberMixin";
import MappableMixin, { MapItem } from "../../../ModelMixins/MappableMixin";
import OpenStreetMapCatalogItemTraits from "../../../Traits/TraitsClasses/OpenStreetMapCatalogItemTraits";
import CreateModel from "../../Definition/CreateModel";
import proxyCatalogItemUrl from "../proxyCatalogItemUrl";

export default class OpenStreetMapCatalogItem extends MappableMixin(
  CatalogMemberMixin(CreateModel(OpenStreetMapCatalogItemTraits))
) {
  static readonly type = "open-street-map";

  get type() {
    return OpenStreetMapCatalogItem.type;
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

  @computed private get imageryProvider() {
    if (!isDefined(this.templateUrl)) {
      return;
    }

    return new UrlTemplateImageryProvider({
      url: cleanAndProxyUrl(this, this.templateUrl),
      subdomains: this.subdomains.slice(),
      credit: this.attribution,
      maximumLevel: this.maximumLevel ?? 25,
      minimumLevel: this.minimumLevel,
      tileHeight: this.tileHeight,
      tileWidth: this.tileWidth
    });
  }

  @computed get templateUrl() {
    if (!isDefined(this.url)) {
      return;
    }

    const templateUrl = new URI(this.url);
    if (this.subdomains.length > 0 && this.url.indexOf("{s}") === -1) {
      templateUrl.hostname(`{s}.${templateUrl.hostname()}`);
    }

    const path = templateUrl.path();
    const sep = path[path.length - 1] === "/" ? "" : "/";
    templateUrl.path(`${path}${sep}{z}/{x}/{y}.${this.fileExtension}`);
    return decodeURI(templateUrl.toString());
  }
}

function cleanAndProxyUrl(catalogItem: any, url: string) {
  return proxyCatalogItemUrl(catalogItem, cleanUrl(url));
}

function cleanUrl(url: string) {
  // Strip off the search portion of the URL
  const uri = new URI(url);
  uri.search("");
  return decodeURI(url.toString());
}
