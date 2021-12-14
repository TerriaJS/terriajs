import i18next from "i18next";
import { computed, toJS } from "mobx";
import {
  downloadInterruptedByUserError,
  fetchBlob,
  fetchJson,
  isOverMaxSizeResponse,
  LoadOptions,
  LoadOptionsWithMaxSize
} from "../../../Core/fetchWithProgress";
import isDefined from "../../../Core/isDefined";
import JsonValue, { isJsonObject, JsonObject } from "../../../Core/Json";
import { isZip, parseZipJsonBlob } from "../../../Core/loadBlob";
import readJson from "../../../Core/readJson";
import TerriaError from "../../../Core/TerriaError";
import GeoJsonMixin, {
  FeatureCollectionWithCrs,
  toFeatureCollection
} from "../../../ModelMixins/GeojsonMixin";
import GeoJsonCatalogItemTraits from "../../../Traits/TraitsClasses/GeoJsonCatalogItemTraits";
import CreateModel from "../../Definition/CreateModel";
import Terria from "../../Terria";
import proxyCatalogItemUrl from "../proxyCatalogItemUrl";

class GeoJsonCatalogItem extends GeoJsonMixin(
  CreateModel(GeoJsonCatalogItemTraits)
) {
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

  protected async forceLoadGeojsonData(): Promise<FeatureCollectionWithCrs> {
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
      const url = proxyCatalogItemUrl(this, this.url);

      if (isZip(url) && typeof FileReader === "undefined") {
        throw fileApiNotSupportedError(this.terria);
      }

      const fetchOptions: LoadOptionsWithMaxSize | LoadOptions = {
        bodyObject: this.requestData
          ? (toJS(this.requestData) as JsonObject)
          : undefined,
        asForm: this.postRequestDataAsFormData,
        fileSizeToPrompt: 50 * 1024 * 1024, // 50 MB,
        maxFileSize: 250 * 1024 * 1024, // 250 MB,
        model: this
      };

      const response = (
        await (isZip(url)
          ? fetchBlob(url, fetchOptions)
          : fetchJson(url, fetchOptions))
      ).throwIfUndefined("Failed to download GeoJSON");

      if (isOverMaxSizeResponse<Blob | JsonValue>(response)) {
        this.resetLoadMapItems();
        throw downloadInterruptedByUserError(response);
      } else {
        if (response.response instanceof Blob) {
          jsonData = await parseZipJsonBlob(response.response);
        } else {
          jsonData = response.response;
        }
      }
    }

    // Transform jsonData to feature collection
    if (isJsonObject(jsonData) && typeof jsonData.type === "string") {
      const fc = toFeatureCollection(jsonData);
      if (fc) return fc;
      throw TerriaError.from(
        "Invalid geojson data - only FeatureCollection and Feature are supported"
      );
    }

    throw TerriaError.from("Failed to load geojson");
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

export default GeoJsonCatalogItem;
