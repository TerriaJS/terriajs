import { computed, makeObservable, observable, runInAction } from "mobx";
import IonImageryProvider from "terriajs-cesium/Source/Scene/IonImageryProvider";
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

  @observable _imageryProvider: IonImageryProvider | undefined;

  constructor(...args: ModelConstructorParameters) {
    super(...args);
    makeObservable(this);
  }

  get type() {
    return IonImageryCatalogItem.type;
  }

  protected forceLoadMapItems(): Promise<void> {
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
          (imageryProvider as any)._credit = attribution;
        }
        runInAction(() => {
          this._imageryProvider = imageryProvider;
        });
      })
      .catch((e) => {
        this._imageryProvider = undefined;
        throw e;
      });
  }

  @computed get mapItems(): MapItem[] {
    if (!isDefined(this._imageryProvider)) {
      return [];
    }
    return [
      {
        show: this.show,
        alpha: this.opacity,
        imageryProvider: this._imageryProvider,
        clippingRectangle: this.clipToRectangle
          ? this.cesiumRectangle
          : undefined
      }
    ];
  }
}
