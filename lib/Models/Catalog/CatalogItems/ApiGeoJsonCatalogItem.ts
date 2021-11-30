import i18next from "i18next";
import { get as _get } from "lodash";
import { computed, toJS } from "mobx";
import isDefined from "../../../Core/isDefined";
import JsonValue, { isJsonObject } from "../../../Core/Json";
import loadBlob, { parseZipJsonBlob, isZip } from "../../../Core/loadBlob";
import loadJson from "../../../Core/loadJson";
import readJson from "../../../Core/readJson";
import TerriaError from "../../../Core/TerriaError";
import GeoJsonMixin, {
  toFeatureCollection
} from "../../../ModelMixins/GeojsonMixin";
import ApiGeoJsonCatalogItemTraits from "../../../Traits/TraitsClasses/ApiGeoJsonCatalogItemTraits";
import GeoJsonCatalogItemTraits from "../../../Traits/TraitsClasses/GeoJsonCatalogItemTraits";
import CreateModel from "../../Definition/CreateModel";
import Terria from "../../Terria";
import proxyCatalogItemUrl from "../proxyCatalogItemUrl";

/**
 * For API endpoints that return json containing geojson.
 * If your api returns GeoJson without a non-GeoJson wrapper, you should probably use {@see GeoJsonCatalogItem}
 */
class ApiGeoJsonCatalogItem extends GeoJsonMixin(
  CreateModel(ApiGeoJsonCatalogItemTraits)
) {
  static readonly type = "api-geojson";
  get type() {
    return ApiGeoJsonCatalogItem.type;
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

    if (this.url === undefined) {
      throw TerriaError.from(
        `ApiGeoJsonCatalogItem ${this.name} is missing a url.`
      );
    }
    if (this.responseGeoJsonPath === undefined) {
      throw TerriaError.from(
        `ApiGeoJsonCatalogItem ${this.name} is missing a a responseGeoJsonPath. Maybe you meant to use catalog item type "geojson" instead?.`
      );
    }

    jsonData = await loadJson(
      proxyCatalogItemUrl(this, this.url),
      undefined,
      this.requestData ? toJS(this.requestData) : undefined,
      this.postRequestDataAsFormData
    );
    if (this.responseDataPath) {
      jsonData = _get(jsonData, this.responseDataPath);
    }

    let fc;
    if (Array.isArray(jsonData)) {
      fc = toFeatureCollection(
        jsonData.map(item => {
          let geojson = _get(item, this.responseGeoJsonPath!);
          if (typeof geojson === "string") {
            geojson = JSON.parse(geojson);
          }
          // add extra properties back to geojson so they appear in feature info
          geojson.properties = item;
          return geojson;
        })
      );
    } else {
      const geojson = _get(jsonData, this.responseGeoJsonPath!);
      // add extra properties back to geojson so they appear in feature info
      geojson.properties = jsonData;

      // Transform jsonData to feature collection
      if (isJsonObject(jsonData) && typeof jsonData.type === "string") {
        fc = toFeatureCollection(geojson);
      }
    }

    if (fc) return fc;
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
        i18next.t("models.userData.chrome") +
        "</a>",
      firefox:
        '<a href="http://www.mozilla.org/firefox" target="_blank">' +
        i18next.t("models.userData.firefox") +
        "</a>",
      edge:
        '<a href="http://www.microsoft.com/edge" target="_blank">' +
        i18next.t("models.userData.edge") +
        "</a>"
    })
  });
}

export default ApiGeoJsonCatalogItem;
