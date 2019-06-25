import Mappable from "./Mappable";
import CreateModel from "./CreateModel";
import BingMapsCatalogItemTraits from "../Traits/BingMapsCatalogItemTraits";
import BingMapsImageryProvider from "terriajs-cesium/Source/Scene/BingMapsImageryProvider";
import Credit from "terriajs-cesium/Source/Core/Credit";
import { computed } from "mobx";
import CatalogMemberMixin from "../ModelMixins/CatalogMemberMixin";

export default class BingMapsCatalogItem
  extends CatalogMemberMixin(CreateModel(BingMapsCatalogItemTraits))
  implements Mappable {
  static readonly type = "bing-maps";

  get type() {
    return BingMapsCatalogItem.type;
  }

  @computed get supportsReordering() {
    return !this.keepOnTop;
  }

  @computed get mapItems() {
    const imageryProvider = this._createImageryProvider();
    return [
      {
        imageryProvider,
        show: this.show,
        alpha: this.opacity
      }
    ];
  }

  protected forceLoadMetadata(): Promise<void> {
    return Promise.resolve();
  }

  loadMapItems() {
    return Promise.resolve();
  }

  _createImageryProvider() {
    const result = new BingMapsImageryProvider({
      url: "//dev.virtualearth.net",
      mapStyle: <any>this.mapStyle,
      key: this.key
    });

    // open in a new window
    (<any>result)._credit = new Credit(
      '<a href="http://www.bing.com" target="_blank">Bing</a>'
    );
    result.defaultGamma = 1.0;
    return result;
  }
}
