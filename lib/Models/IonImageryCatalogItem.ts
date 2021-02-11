import { computed } from "mobx";
import IonImageryProvider from "terriajs-cesium/Source/Scene/IonImageryProvider";
import isDefined from "../Core/isDefined";
import IonImageryCatalogItemTraits from "../Traits/IonImageryCatalogItemTraits";
import CreateModel from "./CreateModel";
import Mappable from "./Mappable";

export default class IonImageryCatalogItem
  extends CreateModel(IonImageryCatalogItemTraits)
  implements Mappable {
  static readonly type = "ion-imagery";

  readonly isMappable = true;

  loadMapItems() {
    return Promise.resolve();
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
