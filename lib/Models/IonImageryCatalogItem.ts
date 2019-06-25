import { computed } from "mobx";
import IonImageryProvider from "terriajs-cesium/Source/Scene/IonImageryProvider";
import IonImageryCatalogItemTraits from "../Traits/IonImageryCatalogItemTraits";
import CreateModel from "./CreateModel";
import Mappable from "./Mappable";
import isDefined from "../Core/isDefined";

export default class IonImageryCatalogItem
  extends CreateModel(IonImageryCatalogItemTraits)
  implements Mappable {
  static readonly type = "ion-imagery";

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
      return new IonImageryProvider({
        assetId: this.ionAssetId,
        accessToken: this.ionAccessToken,
        server: this.ionServer
      });
    }
  }
}
