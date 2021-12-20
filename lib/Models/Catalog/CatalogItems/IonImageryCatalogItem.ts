import { computed } from "mobx";
import IonImageryProvider from "terriajs-cesium/Source/Scene/IonImageryProvider";
import isDefined from "../../../Core/isDefined";
import CatalogMemberMixin from "../../../ModelMixins/CatalogMemberMixin";
import MappableMixin, { MapItem } from "../../../ModelMixins/MappableMixin";
import IonImageryCatalogItemTraits from "../../../Traits/TraitsClasses/IonImageryCatalogItemTraits";
import CreateModel from "../../Definition/CreateModel";

export default class IonImageryCatalogItem extends MappableMixin(
  CatalogMemberMixin(CreateModel(IonImageryCatalogItemTraits))
) {
  static readonly type = "ion-imagery";

  get type() {
    return IonImageryCatalogItem.type;
  }

  protected forceLoadMapItems(): Promise<void> {
    return Promise.resolve();
  }

  @computed get mapItems(): MapItem[] {
    if (!isDefined(this.imageryProvider)) {
      return [];
    }
    return [
      {
        show: this.show,
        alpha: this.opacity,
        imageryProvider: this.imageryProvider,
        clippingRectangle: this.clipToRectangle
          ? this.cesiumRectangle
          : undefined
      }
    ];
  }

  @computed get imageryProvider() {
    if (isDefined(this.ionAssetId)) {
      const provider = new IonImageryProvider({
        assetId: this.ionAssetId,
        accessToken:
          this.ionAccessToken ||
          this.terria.configParameters.cesiumIonAccessToken,
        server: this.ionServer
      });
      if (this.attribution) {
        (<any>provider)._credit = this.attribution;
      }
      return provider;
    }
  }
}
