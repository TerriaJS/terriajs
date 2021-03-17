import { computed } from "mobx";
import IonImageryProvider from "terriajs-cesium/Source/Scene/IonImageryProvider";
import isDefined from "../Core/isDefined";
import MappableMixin from "../ModelMixins/MappableMixin";
import IonImageryCatalogItemTraits from "../Traits/IonImageryCatalogItemTraits";
import CreateModel from "./CreateModel";

export default class IonImageryCatalogItem extends MappableMixin(
  CreateModel(IonImageryCatalogItemTraits)
) {
  static readonly type = "ion-imagery";

  get type() {
    return IonImageryCatalogItem.type;
  }

  @computed get mapItems() {
    if (!isDefined(this.imageryProvider)) {
      return [];
    }
    return [
      {
        show: this.show,
        alpha: this.opacity,
        imageryProvider: this.imageryProvider
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
