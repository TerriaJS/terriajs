import i18next from "i18next";
import { action, computed, observable, toJS } from "mobx";
import JulianDate from "terriajs-cesium/Source/Core/JulianDate";
import CzmlDataSource from "terriajs-cesium/Source/DataSources/CzmlDataSource";
import DataSourceClock from "terriajs-cesium/Source/DataSources/DataSourceClock";
import isDefined from "../../../Core/isDefined";
import readJson from "../../../Core/readJson";
import TerriaError, { networkRequestError } from "../../../Core/TerriaError";
import AutoRefreshingMixin from "../../../ModelMixins/AutoRefreshingMixin";
import CatalogMemberMixin from "../../../ModelMixins/CatalogMemberMixin";
import MappableMixin from "../../../ModelMixins/MappableMixin";
import TimeVarying from "../../../ModelMixins/TimeVarying";
import UrlMixin from "../../../ModelMixins/UrlMixin";
import CzmlCatalogItemTraits from "../../../Traits/TraitsClasses/CzmlCatalogItemTraits";
import CreateModel from "../../Definition/CreateModel";
import LoadableStratum from "../../Definition/LoadableStratum";
import { BaseModel } from "../../Definition/Model";
import StratumOrder from "../../Definition/StratumOrder";
import HasLocalData from "../../HasLocalData";
import proxyCatalogItemUrl from "../proxyCatalogItemUrl";

/**
 * A loadable stratum for CzmlCatalogItemTraits that derives TimeVaryingTraits
 * from the CzmlDataSource
 */
class CzmlTimeVaryingStratum extends LoadableStratum(CzmlCatalogItemTraits) {
  static stratumName = "czmlLoadableStratum";

  constructor(readonly catalogItem: CzmlCatalogItem) {
    super();
  }

  duplicateLoadableStratum(model: BaseModel): this {
    return new CzmlTimeVaryingStratum(model as CzmlCatalogItem) as this;
  }

  @computed
  private get clock(): DataSourceClock | undefined {
    return this.catalogItem._dataSource?.clock;
  }

  @computed
  get currentTime(): string | undefined {
    const currentTime = this.clock?.currentTime;
    return currentTime ? JulianDate.toIso8601(currentTime) : undefined;
  }

  @computed
  get startTime(): string | undefined {
    const startTime = this.clock?.startTime;
    return startTime ? JulianDate.toIso8601(startTime) : undefined;
  }

  @computed
  get stopTime() {
    const stopTime = this.clock?.stopTime;
    return stopTime ? JulianDate.toIso8601(stopTime) : undefined;
  }

  @computed
  get multiplier(): number | undefined {
    return this.clock?.multiplier;
  }
}

StratumOrder.addLoadStratum(CzmlTimeVaryingStratum.stratumName);

export default class CzmlCatalogItem
  extends AutoRefreshingMixin(
    MappableMixin(
      UrlMixin(CatalogMemberMixin(CreateModel(CzmlCatalogItemTraits)))
    )
  )
  implements TimeVarying, HasLocalData
{
  static readonly type = "czml";
  get type() {
    return CzmlCatalogItem.type;
  }

  @observable _dataSource: CzmlDataSource | undefined;
  private _czmlFile?: File;

  setFileInput(file: File) {
    this._czmlFile = file;
  }

  @computed
  get hasLocalData(): boolean {
    return isDefined(this._czmlFile);
  }

  protected forceLoadMapItems(): Promise<void> {
    const attribution = this.attribution;
    let loadableData: any = undefined;
    if (isDefined(this.czmlData)) {
      loadableData = toJS(this.czmlData);
    } else if (isDefined(this.czmlString)) {
      loadableData = JSON.parse(this.czmlString);
    } else if (isDefined(this._czmlFile)) {
      loadableData = readJson(this._czmlFile);
    } else if (isDefined(this.url)) {
      loadableData = proxyCatalogItemUrl(this, this.url, this.cacheDuration);
    }

    if (loadableData === undefined) {
      throw new TerriaError({
        sender: this,
        title: i18next.t("models.czml.unableToLoadItemTitle"),
        message: i18next.t("models.czml.unableToLoadItemMessage")
      });
    }

    return CzmlDataSource.load(loadableData, {
      credit: attribution
    })
      .then(
        action((czmlDataSource) => {
          this._dataSource = czmlDataSource;
          this.strata.set(
            CzmlTimeVaryingStratum.stratumName,
            new CzmlTimeVaryingStratum(this)
          );
        })
      )
      .catch((e) => {
        if (e instanceof TerriaError) {
          throw e;
        } else {
          throw networkRequestError({
            sender: this,
            title: i18next.t("models.czml.errorLoadingTitle"),
            message: i18next.t("models.czml.errorLoadingMessage")
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

  @computed({ equals: JulianDate.equals })
  get currentTimeAsJulianDate() {
    return toJulianDate(this.currentTime);
  }

  @computed({ equals: JulianDate.equals })
  get startTimeAsJulianDate(): JulianDate | undefined {
    return toJulianDate(this.startTime);
  }

  @computed({ equals: JulianDate.equals })
  get stopTimeAsJulianDate(): JulianDate | undefined {
    return toJulianDate(this.stopTime);
  }

  /**
   * Reloads CzmlDataSource if the source is a URL
   * Required for AutoRefreshingMixin
   */
  refreshData() {
    if (this.url === undefined) return;
    const url = proxyCatalogItemUrl(this, this.url, this.cacheDuration);
    this._dataSource?.process(url);
  }
}

function toJulianDate(time: string | undefined | null): JulianDate | undefined {
  return time === undefined || time === null
    ? undefined
    : JulianDate.fromIso8601(time);
}
