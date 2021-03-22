import { computed } from "mobx";
import Credit from "terriajs-cesium/Source/Core/Credit";
import BingMapsImageryProvider from "terriajs-cesium/Source/Scene/BingMapsImageryProvider";
import MappableMixin from "../ModelMixins/MappableMixin";
import CatalogMemberMixin from "../ModelMixins/CatalogMemberMixin";
import BingMapsCatalogItemTraits from "../Traits/BingMapsCatalogItemTraits";
import CreateModel from "./CreateModel";

export default class BingMapsCatalogItem extends MappableMixin(
  CatalogMemberMixin(CreateModel(BingMapsCatalogItemTraits))
) {
  static readonly type = "bing-maps";

  get type() {
    return BingMapsCatalogItem.type;
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

  forceLoadMapItems() {
    return Promise.resolve();
  }

  _createImageryProvider() {
    const result = new BingMapsImageryProvider({
      url: "//dev.virtualearth.net",
      mapStyle: <any>this.mapStyle,
      key: this.key!
    });

    if (this.attribution) {
      (<any>result)._credit = this.attribution;
    } else {
      // open in a new window
      (<any>result)._credit = new Credit(
        '<a href="http://www.bing.com" target="_blank">Bing</a>'
      );
    }
    result.defaultGamma = 1.0;

    return result;
  }
}
