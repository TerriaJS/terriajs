import i18next from "i18next";
import { computed } from "mobx";
import createGuid from "terriajs-cesium/Source/Core/createGuid";
import getFilenameFromUri from "terriajs-cesium/Source/Core/getFilenameFromUri";
import isDefined from "../../../Core/isDefined";
import loadText from "../../../Core/loadText";
import readText from "../../../Core/readText";
import TerriaError from "../../../Core/TerriaError";
import MappableMixin from "../../../ModelMixins/MappableMixin";
import CatalogMemberMixin from "../../../ModelMixins/CatalogMemberMixin";
import UrlMixin from "../../../ModelMixins/UrlMixin";
import GpxCatalogItemTraits from "../../../Traits/TraitsClasses/GpxCatalogItemTraits";
import CommonStrata from "../../Definition/CommonStrata";
import CreateModel from "../../Definition/CreateModel";
import GeoJsonCatalogItem from "./GeoJsonCatalogItem";
import proxyCatalogItemUrl from "../proxyCatalogItemUrl";

const toGeoJSON = require("@mapbox/togeojson");

class GpxCatalogItem extends MappableMixin(
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

  protected async forceLoadMapItems(): Promise<void> {
    const data = await new Promise<string>(resolve => {
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
    });
    const geoJsonData = this.loadGpxText(data);
    this._geoJsonItem.setTrait(
      CommonStrata.definition,
      "geoJsonData",
      geoJsonData
    );
    this._geoJsonItem.setTrait(
      CommonStrata.definition,
      "attribution",
      this.attribution
    );
    return (await this._geoJsonItem.loadMapItems()).throwIfError();
  }

  protected forceLoadMetadata(): Promise<void> {
    return Promise.resolve();
  }

  get mapItems() {
    if (isDefined(this._geoJsonItem)) {
      return this._geoJsonItem.mapItems.map(mapItem => {
        mapItem.show = this.show;
        return mapItem;
      });
    }
    return [];
  }

  @computed get name() {
    if (this.url && super.name === this.url) {
      return getFilenameFromUri(this.url);
    }
    return super.name;
  }
}

export default GpxCatalogItem;
