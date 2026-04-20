import i18next from "i18next";
import { action, computed, makeObservable, override } from "mobx";
import Resource from "terriajs-cesium/Source/Core/Resource";
import KmlDataSource from "terriajs-cesium/Source/DataSources/KmlDataSource";
import TerriaError, { networkRequestError } from "../../../Core/TerriaError";
import isDefined from "../../../Core/isDefined";
import CatalogMemberMixin from "../../../ModelMixins/CatalogMemberMixin";
import MappableMixin from "../../../ModelMixins/MappableMixin";
import UrlMixin from "../../../ModelMixins/UrlMixin";
import KmlCatalogItemTraits from "../../../Traits/TraitsClasses/KmlCatalogItemTraits";
import CommonStrata from "../../Definition/CommonStrata";
import CreateModel from "../../Definition/CreateModel";
import { ModelConstructorParameters } from "../../Definition/Model";
import HasLocalData from "../../HasLocalData";
import proxyCatalogItemUrl from "../proxyCatalogItemUrl";
import CesiumIonMixin from "../../../ModelMixins/CesiumIonMixin";

class KmlCatalogItem
  extends MappableMixin(
    UrlMixin(
      CesiumIonMixin(CatalogMemberMixin(CreateModel(KmlCatalogItemTraits)))
    )
  )
  implements HasLocalData
{
  static readonly type = "kml";

  constructor(...args: ModelConstructorParameters) {
    super(...args);
    makeObservable(this);
  }

  get type() {
    return KmlCatalogItem.type;
  }

  private _dataSource: KmlDataSource | undefined;

  @action
  setFileInput(file: File) {
    this.setTrait(
      CommonStrata.user,
      "url",
      URL.createObjectURL(file) + "#" + file.name
    );
  }

  @computed
  get hasLocalData(): boolean {
    return this.url?.startsWith("blob:") ?? false;
  }

  @override
  get cacheDuration(): string {
    if (isDefined(super.cacheDuration)) {
      return super.cacheDuration;
    }
    return "1d";
  }

  protected async forceLoadMapItems(): Promise<void> {
    try {
      let kmlLoadInput: undefined | string | Resource | Document | Blob =
        undefined;

      if (isDefined(this.kmlString)) {
        const parser = new DOMParser();
        kmlLoadInput = parser.parseFromString(this.kmlString, "text/xml");
      } else if (isDefined(this.ionResource)) {
        kmlLoadInput = this.ionResource;
      } else if (isDefined(this.url)) {
        kmlLoadInput = proxyCatalogItemUrl(this, this.url);
      }

      if (!kmlLoadInput) {
        throw networkRequestError({
          sender: this,
          title: i18next.t("models.kml.unableToLoadItemTitle"),
          message: i18next.t("models.kml.unableToLoadItemMessage")
        });
      }
      this._dataSource = await KmlDataSource.load(kmlLoadInput, {
        clampToGround: this.clampToGround,
        sourceUri: this.dataSourceUri
          ? proxyCatalogItemUrl(this, this.dataSourceUri, "1d")
          : undefined
      } as any);
    } catch (e) {
      throw networkRequestError(
        TerriaError.from(e, {
          sender: this,
          title: i18next.t("models.kml.errorLoadingTitle"),
          message: i18next.t("models.kml.errorLoadingMessage", {
            appName: this.terria.appName
          })
        })
      );
    }
  }

  @computed
  get mapItems() {
    if (this.isLoadingMapItems || this._dataSource === undefined) {
      return [];
    }
    this._dataSource.show = this.show;
    return [this._dataSource];
  }

  protected forceLoadMetadata(): Promise<void> {
    return this.loadIonResource();
  }
}

export default KmlCatalogItem;
