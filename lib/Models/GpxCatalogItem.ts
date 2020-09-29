import i18next from "i18next";
import { computed, runInAction } from "mobx";
import createGuid from "terriajs-cesium/Source/Core/createGuid";
import isDefined from "../Core/isDefined";
import loadText from "../Core/loadText";
import readText from "../Core/readText";
import TerriaError from "../Core/TerriaError";
import AsyncMappableMixin from "../ModelMixins/AsyncMappableMixin";
import CatalogMemberMixin from "../ModelMixins/CatalogMemberMixin";
import UrlMixin from "../ModelMixins/UrlMixin";
import GpxCatalogItemTraits from "../Traits/GpxCatalogItemTraits";
import CommonStrata from "./CommonStrata";
import CreateModel from "./CreateModel";
import GeoJsonCatalogItem from "./GeoJsonCatalogItem";
import proxyCatalogItemUrl from "./proxyCatalogItemUrl";
import getFilenameFromUri from "terriajs-cesium/Source/Core/getFilenameFromUri";
import LoadableStratum from "./LoadableStratum";
import { BaseModel } from "./Model";
import StratumOrder from "./StratumOrder";
const toGeoJSON = require("@mapbox/togeojson");

class GpxStratum extends LoadableStratum(GpxCatalogItemTraits) {
  static readonly stratumName = "gpxLoadable";

  constructor(private readonly _item: GpxCatalogItem) {
    super();
  }

  duplicateLoadableStratum(newModel: BaseModel): this {
    return new GpxStratum(newModel as GpxCatalogItem) as this;
  }

  static async load(item: GpxCatalogItem) {
    return new GpxStratum(item);
  }
}

StratumOrder.addDefinitionStratum(GpxStratum.stratumName);

class GpxCatalogItem extends AsyncMappableMixin(
  UrlMixin(CatalogMemberMixin(CreateModel(GpxCatalogItemTraits)))
) {
  static readonly type = "gpx";

  get type() {
    return GpxCatalogItem.type;
  }

  get typeName() {
    return i18next.t("models.gpx.name");
  }

  private _geoJsonItem = new GeoJsonCatalogItem(createGuid(), this.terria);

  private _gpxFile?: File;

  get canZoomTo(): boolean {
    return true;
  }

  get showsInfo(): boolean {
    return true;
  }

  setFileInput(file: File) {
    this._gpxFile = file;
  }

  @computed
  get hasLocalData(): boolean {
    return isDefined(this._gpxFile);
  }

  private loadGpxText(text: string) {
    var dom = new DOMParser().parseFromString(text, "text/xml");
    return toGeoJSON.gpx(dom);
  }

  protected forceLoadMapItems(): Promise<void> {
    GpxStratum.load(this).then(stratum => {
      runInAction(() => {
        this.strata.set(GpxStratum.stratumName, stratum);
      });
    });
    return new Promise<string>(resolve => {
      if (isDefined(this.gpxString)) {
        resolve(this.gpxString);
      } else if (isDefined(this._gpxFile)) {
        resolve(readText(this._gpxFile));
      } else if (isDefined(this.url)) {
        resolve(loadText(proxyCatalogItemUrl(this, this.url)));
      } else {
        throw new TerriaError({
          sender: this,
          title: i18next.t("models.gpx.errorLoadingTitle"),
          message: i18next.t("models.gpx.errorLoadingMessage")
        });
      }
    })
      .then(data => {
        return this.loadGpxText(data);
      })
      .then(geoJsonData => {
        this._geoJsonItem.setTrait(
          CommonStrata.definition,
          "geoJsonData",
          geoJsonData
        );
        return this._geoJsonItem.loadMapItems();
      });
  }

  protected forceLoadMetadata(): Promise<void> {
    return Promise.resolve();
  }

  get mapItems(): import("./Mappable").MapItem[] {
    if (isDefined(this._geoJsonItem)) {
      return this._geoJsonItem.mapItems.map(mapItem => {
        mapItem.show = this.show;
        return mapItem;
      });
    }
    return [];
  }
}

export default GpxCatalogItem;
