import { computed, observable, makeObservable, runInAction } from "mobx";
import { IonImageryProvider } from "cesium";
import isDefined from "../../../Core/isDefined";
import CatalogMemberMixin from "../../../ModelMixins/CatalogMemberMixin";
import MappableMixin, { MapItem } from "../../../ModelMixins/MappableMixin";
import IonImageryCatalogItemTraits from "../../../Traits/TraitsClasses/IonImageryCatalogItemTraits";
import { ModelConstructorParameters } from "../../Definition/Model";
import CreateModel from "../../Definition/CreateModel";

export default class IonImageryCatalogItem extends MappableMixin(
  CatalogMemberMixin(CreateModel(IonImageryCatalogItemTraits))
) {
  static readonly type = "ion-imagery";
  @observable _private_imageryProvider: IonImageryProvider | undefined;

  constructor(...args: ModelConstructorParameters) {
    super(...args);
    makeObservable(this);
  }

  get type() {
    return IonImageryCatalogItem.type;
  }

  override _protected_forceLoadMapItems(): Promise<void> {
    if (!isDefined(this.ionAssetId)) return Promise.resolve();

    const attribution = this.attribution;

    return IonImageryProvider.fromAssetId(this.ionAssetId, {
      accessToken:
        this.ionAccessToken ||
        this.terria.configParameters.cesiumIonAccessToken,
      server: this.ionServer
    })
      .then((imageryProvider) => {
        if (attribution) {
          (<any>imageryProvider)._credit = attribution;
        }
        runInAction(() => {
          this._private_imageryProvider = imageryProvider;
        });
      })
      .catch((e) => {
        this._private_imageryProvider = undefined;
        throw e;
      });
  }

  @computed get mapItems(): MapItem[] {
    if (!isDefined(this._private_imageryProvider)) {
      return [];
    }
    return [
      {
        show: this.show,
        alpha: this.opacity,
        imageryProvider: this._private_imageryProvider,
        clippingRectangle: this.clipToRectangle
          ? this.cesiumRectangle
          : undefined
      }
    ];
  }
}
