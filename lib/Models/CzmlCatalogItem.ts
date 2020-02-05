import i18next from "i18next";
import { computed, toJS } from "mobx";
import CzmlDataSource from "terriajs-cesium/Source/DataSources/CzmlDataSource";
import isDefined from "../Core/isDefined";
import { JsonObject } from "../Core/Json";
import readJson from "../Core/readJson";
import TerriaError from "../Core/TerriaError";
import AsyncMappableMixin from "../ModelMixins/AsyncMappableMixin";
import CatalogMemberMixin from "../ModelMixins/CatalogMemberMixin";
import UrlMixin from "../ModelMixins/UrlMixin";
import CzmlCatalogItemTraits from "../Traits/CzmlCatalogItemTraits";
import CreateModel from "./CreateModel";
import Mappable from "./Mappable";

export default class CzmlCatalogItem
  extends AsyncMappableMixin(
    UrlMixin(CatalogMemberMixin(CreateModel(CzmlCatalogItemTraits)))
  )
  implements Mappable {
  static readonly type = "czml";
  get type() {
    return CzmlCatalogItem.type;
  }

  readonly canZoomTo = true;

  private _dataSource: CzmlDataSource | undefined;
  private _czmlFile?: File;

  setFileInput(file: File) {
    this._czmlFile = file;
  }

  protected forceLoadMapItems(): Promise<void> {
    return new Promise<string | readonly JsonObject[]>(resolve => {
      if (isDefined(this.czmlData)) {
        resolve(toJS(this.czmlData));
      } else if (isDefined(this.czmlString)) {
        resolve(JSON.parse(this.czmlString));
      } else if (isDefined(this._czmlFile)) {
        resolve(readJson(this._czmlFile));
      } else if (isDefined(this.url)) {
        resolve(this.url);
      } else {
        throw new TerriaError({
          sender: this,
          title: i18next.t("models.czml.unableToLoadItemTitle"),
          message: i18next.t("models.czml.unableToLoadItemMessage")
        });
      }
    })
      .then(czmlLoadInput => {
        return CzmlDataSource.load(czmlLoadInput);
      })
      .then(czml => {
        this._dataSource = czml;
      })
      .catch(e => {
        if (e instanceof TerriaError) {
          throw e;
        } else {
          throw new TerriaError({
            sender: this,
            title: i18next.t("models.czml.errorLoadingTitle"),
            message: i18next.t("models.czml.errorLoadingMessage", {
              appName: this.terria.appName,
              email:
                '<a href="mailto:' +
                this.terria.supportEmail +
                '">' +
                this.terria.supportEmail +
                "</a>.",
              stackTrace: e.stack || e.toString()
            })
          });
        }
      });
  }

  protected forceLoadMetadata(): Promise<void> {
    return Promise.resolve();
  }

  @computed
  get mapItems() {
    if (this.isLoadingMapItems || this._dataSource === undefined) {
      return [];
    }
    this._dataSource.show = this.show;
    return [this._dataSource];
  }
}
