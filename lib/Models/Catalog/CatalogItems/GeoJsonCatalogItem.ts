import i18next from "i18next";
import { get as _get, set as _set } from "lodash";
import { computed, toJS } from "mobx";
import isDefined from "../../../Core/isDefined";
import JsonValue, { isJsonObject } from "../../../Core/Json";
import loadBlob, { isZip, parseZipJsonBlob } from "../../../Core/loadBlob";
import loadJson from "../../../Core/loadJson";
import readJson from "../../../Core/readJson";
import TerriaError from "../../../Core/TerriaError";
import GeoJsonMixin, {
  toFeatureCollection
} from "../../../ModelMixins/GeojsonMixin";
import GeoJsonCatalogItemTraits from "../../../Traits/TraitsClasses/GeoJsonCatalogItemTraits";
import CreateModel from "../../Definition/CreateModel";
import HasLocalData from "../../HasLocalData";
import Terria from "../../Terria";
import proxyCatalogItemUrl from "../proxyCatalogItemUrl";

class GeoJsonCatalogItem
  extends GeoJsonMixin(CreateModel(GeoJsonCatalogItemTraits))
  implements HasLocalData
{
  static readonly type = "geojson";
  get type() {
    return GeoJsonCatalogItem.type;
  }

  get typeName() {
    return i18next.t("models.geoJson.name");
  }

  protected _file?: File;

  setFileInput(file: File) {
    this._file = file;
  }

  @computed get hasLocalData(): boolean {
    return isDefined(this._file);
  }

  protected async forceLoadGeojsonData() {
    let jsonData: JsonValue | undefined = undefined;

    // GeoJsonCatalogItemTraits.geoJsonData
    if (isDefined(this.geoJsonData)) {
      jsonData = toJS(this.geoJsonData);
    }
    // GeoJsonCatalogItemTraits.geoJsonData
    else if (isDefined(this.geoJsonString)) {
      jsonData = JSON.parse(this.geoJsonString);
      // GeojsonCatalogItem._file
    }
    // Zipped file
    else if (this._file) {
      if (isDefined(this._file.name) && isZip(this._file.name)) {
        const asAb = await this._file.arrayBuffer();
        jsonData = await parseZipJsonBlob(new Blob([asAb]));
      } else {
        jsonData = await readJson(this._file);
      }
    }
    // GeojsonTraits.url
    else if (this.url) {
      // URL to zipped fle
      if (isZip(this.url)) {
        if (typeof FileReader === "undefined") {
          throw fileApiNotSupportedError(this.terria);
        }
        const body = this.requestData ? toJS(this.requestData) : undefined;
        const blob = await loadBlob(
          proxyCatalogItemUrl(this, this.url),
          undefined,
          body
        );
        jsonData = await parseZipJsonBlob(blob);
      } else {
        jsonData = await loadJson(
          proxyCatalogItemUrl(this, this.url),
          undefined,
          this.requestData ? toJS(this.requestData) : undefined,
          this.postRequestDataAsFormData
        );
        if (this.responseDataPath) {
          jsonData = _get(jsonData, this.responseDataPath);
        }
      }
    }

    if (jsonData === undefined) {
      throw TerriaError.from("Failed to load geojson");
    }

    if (Array.isArray(jsonData)) {
      // Array that isn't a feature collection
      const fc = toFeatureCollection(
        jsonData.map((item) => {
          let geojson: any = item;

          if (this.responseGeoJsonPath !== undefined) {
            geojson = _get(item, this.responseGeoJsonPath);
            // Clear geojson so that it doesn't appear again in its own properties
            _set(item as object, this.responseGeoJsonPath, undefined);
          }

          if (typeof geojson === "string") {
            geojson = JSON.parse(geojson);
          }

          // add extra properties back to geojson so they appear in feature info
          geojson.properties = item;
          return geojson;
        })
      );
      if (fc) return fc;
    } else if (
      isJsonObject(jsonData, false) &&
      typeof jsonData.type === "string"
    ) {
      // Actual geojson
      const fc = toFeatureCollection(jsonData);
      if (fc) return fc;
    }
    throw TerriaError.from(
      "Invalid geojson data - only FeatureCollection and Feature are supported"
    );
  }
}

export function fileApiNotSupportedError(terria: Terria) {
  return new TerriaError({
    title: i18next.t("models.userData.fileApiNotSupportedTitle"),
    message: i18next.t("models.userData.fileApiNotSupportedTitle", {
      appName: terria.appName,
      chrome:
        '<a href="http://www.google.com/chrome" target="_blank">' +
        i18next.t("browsers.chrome") +
        "</a>",
      firefox:
        '<a href="http://www.mozilla.org/firefox" target="_blank">' +
        i18next.t("browsers.firefox") +
        "</a>",
      edge:
        '<a href="http://www.microsoft.com/edge" target="_blank">' +
        i18next.t("browsers.edge") +
        "</a>"
    })
  });
}

export default GeoJsonCatalogItem;
