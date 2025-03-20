import { computed, observable, runInAction } from "mobx";
import UrlTemplateImageryProvider from "terriajs-cesium/Source/Scene/UrlTemplateImageryProvider";
import loadJson from "../../../Core/loadJson";
import isDefined from "../../../Core/isDefined";
import CatalogMemberMixin from "../../../ModelMixins/CatalogMemberMixin";
import MappableMixin, { MapItem } from "../../../ModelMixins/MappableMixin";
import CreateModel from "../../Definition/CreateModel";
import proxyCatalogItemUrl from "../proxyCatalogItemUrl";
import GoogleTileMapsCatalogItemTraits from "../../../Traits/TraitsClasses/GoogleTileMapsCatalogItemTraits";

/** See https://cesium.com/learn/cesiumjs/ref-doc/UrlTemplateImageryProvider.html#url for available keywords:
 * - {z}: The level of the tile in the tiling scheme. Level zero is the root of the quadtree pyramid.
 * - {x}: The tile X coordinate in the tiling scheme, where 0 is the Westernmost tile.
 * - {y}: The tile Y coordinate in the tiling scheme, where 0 is the Northernmost tile.
 * - {s}: One of the available subdomains, used to overcome browser limits on the number of simultaneous requests per host.
 */
export default class GoogleTileMapsCatalogItem extends MappableMixin(
  CatalogMemberMixin(CreateModel(GoogleTileMapsCatalogItemTraits))
) {
  static readonly type = "google-tile-maps";

  @observable
  private sessionToken = "";

  get type() {
    return GoogleTileMapsCatalogItem.type;
  }

  async createSession() {
    const result = await loadJson(
      `https://tile.googleapis.com/v1/createSession?key=${this.key}`,
      {
        "Content-Type": "application/json"
      },
      {
        "mapType": this.mapType,
        "language": this.language ?? "",
        "region": this.region ?? ""
      });
    if (result) {
      runInAction(() => {
        this.sessionToken = result.session;
      });
    }
  }

  protected async forceLoadMapItems(): Promise<void> {
    await this.createSession();

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

  @computed get imageryProvider() {
    const url = `https://tile.googleapis.com/v1/2dtiles/{z}/{x}/{y}?session=${this.sessionToken}&key=${this.key}`;

    return new UrlTemplateImageryProvider({
      url: proxyCatalogItemUrl(this, url),
      credit: this.attribution,
      maximumLevel: this.maximumLevel,
      minimumLevel: this.minimumLevel,
      tileHeight: this.tileHeight,
      tileWidth: this.tileWidth,
      enablePickFeatures: this.allowFeaturePicking
    });
  }
}
