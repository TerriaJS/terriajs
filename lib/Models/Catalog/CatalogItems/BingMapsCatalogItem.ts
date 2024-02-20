import { computed, observable, makeObservable, runInAction } from "mobx";
import Credit from "terriajs-cesium/Source/Core/Credit";
import BingMapsImageryProvider from "terriajs-cesium/Source/Scene/BingMapsImageryProvider";
import CatalogMemberMixin from "../../../ModelMixins/CatalogMemberMixin";
import MappableMixin, { MapItem } from "../../../ModelMixins/MappableMixin";
import BingMapsCatalogItemTraits from "../../../Traits/TraitsClasses/BingMapsCatalogItemTraits";
import { ModelConstructorParameters } from "../../Definition/Model";
import CreateModel from "../../Definition/CreateModel";

export default class BingMapsCatalogItem extends MappableMixin(
  CatalogMemberMixin(CreateModel(BingMapsCatalogItemTraits))
) {
  static readonly type = "bing-maps";

  @observable _imageryProvider: BingMapsImageryProvider | undefined;

  constructor(...args: ModelConstructorParameters) {
    super(...args);
    makeObservable(this);
  }

  get type() {
    return BingMapsCatalogItem.type;
  }

  protected async forceLoadMapItems(): Promise<void> {
    const provider = await BingMapsImageryProvider.fromUrl(
      "//dev.virtualearth.net",
      {
        mapStyle: this.mapStyle as any,
        key: this.key!,
        culture: this.culture
      }
    );
    runInAction(() => {
      this._imageryProvider = provider;
    });
  }

  @computed get mapItems(): MapItem[] {
    const imageryProvider = this._createImageryProvider();
    if (imageryProvider === undefined) return [];
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
    const result = this._imageryProvider;
    if (result === undefined) return result;

    if (this.attribution) {
      (result as any)._credit = this.attribution;
    } else {
      // open in a new window
      (result as any)._credit = new Credit(
        '<a href="http://www.bing.com" target="_blank">Bing</a>'
      );
    }

    return result;
  }
}
