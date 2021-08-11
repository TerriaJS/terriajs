import { computed } from "mobx";
import Credit from "terriajs-cesium/Source/Core/Credit";
import BingMapsImageryProvider from "terriajs-cesium/Source/Scene/BingMapsImageryProvider";
import CatalogMemberMixin from "../../../ModelMixins/CatalogMemberMixin";
import MappableMixin, { MapItem } from "../../../ModelMixins/MappableMixin";
import BingMapsCatalogItemTraits from "../../../Traits/TraitsClasses/BingMapsCatalogItemTraits";
import CreateModel from "../../Definition/CreateModel";

export default class BingMapsCatalogItem extends MappableMixin(
  CatalogMemberMixin(CreateModel(BingMapsCatalogItemTraits))
) {
  static readonly type = "bing-maps";

  get type() {
    return BingMapsCatalogItem.type;
  }

  protected forceLoadMapItems(): Promise<void> {
    return Promise.resolve();
  }

  @computed get mapItems(): MapItem[] {
    const imageryProvider = this._createImageryProvider();
    return [
      {
        imageryProvider,
        show: this.show,
        alpha: this.opacity,
        clippingRectangle: this.clipToRectangle
          ? this.cesiumRectangle
          : undefined
      }
    ];
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
