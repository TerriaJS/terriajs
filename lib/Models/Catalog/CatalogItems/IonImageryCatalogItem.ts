import { computed, makeObservable } from "mobx";
import IonImageryProvider from "terriajs-cesium/Source/Scene/IonImageryProvider";
import isDefined from "../../../Core/isDefined";
import MappableMixin, { MapItem } from "../../../ModelMixins/MappableMixin";
import ModelTraits from "../../../Traits/ModelTraits";
import IonImageryCatalogItemTraits from "../../../Traits/TraitsClasses/IonImageryCatalogItemTraits";
import CreateModel from "../../Definition/CreateModel";
import { BaseModel } from "../../Definition/Model";
import Terria from "../../Terria";

export default class IonImageryCatalogItem extends MappableMixin(
  CreateModel(IonImageryCatalogItemTraits)
) {
  static readonly type = "ion-imagery";

  constructor(
    id: string | undefined,
    terria: Terria,
    sourceReference?: BaseModel | undefined,
    strata?: Map<string, ModelTraits> | undefined
  ) {
    super(id, terria, sourceReference, strata);
    makeObservable(this);
  }

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
