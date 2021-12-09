import i18next from "i18next";
import { computed, runInAction, toJS } from "mobx";
import isDefined from "../../../Core/isDefined";
import JsonValue, { isJsonObject, JsonObject } from "../../../Core/Json";
import { isZip, parseZipJsonBlob } from "../../../Core/loadBlob";
import {
  fetchBlob,
  fetchJson,
  isOverMaxSizeResponse,
  OverMaxSizeResponse
} from "../../../Core/loadWithProgress";
import readJson from "../../../Core/readJson";
import TerriaError, { TerriaErrorSeverity } from "../../../Core/TerriaError";
import { getName } from "../../../ModelMixins/CatalogMemberMixin";
import GeoJsonMixin, {
  FeatureCollectionWithCrs,
  toFeatureCollection
} from "../../../ModelMixins/GeojsonMixin";
import GeoJsonCatalogItemTraits from "../../../Traits/TraitsClasses/GeoJsonCatalogItemTraits";
import CommonStrata from "../../Definition/CommonStrata";
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

  protected async forceLoadGeojsonData(
    ignoreMaxFileSize?: true
  ): Promise<FeatureCollectionWithCrs> {
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
      if (isZip(url)) {
        if (typeof FileReader === "undefined") {
          throw fileApiNotSupportedError(this.terria);
        }
        const response = (
          await fetchBlob(
            url,
            {
              bodyObject: this.requestData
                ? (toJS(this.requestData) as JsonObject)
                : undefined,
              asForm: this.postRequestDataAsFormData
            },
            ignoreMaxFileSize ? undefined : 50 * 1024 * 1024
          )
        ).throwIfUndefined("Failed to download zipped GeoJSON");
        if (isOverMaxSizeResponse(response)) {
          return await this.largeDownloadWarning(response);
        } else {
          jsonData = await parseZipJsonBlob(response.response);
        }
      } else {
        const response = (
          await fetchJson(
            url,
            {
              bodyObject: this.requestData
                ? (toJS(this.requestData) as JsonObject)
                : undefined,
              asForm: this.postRequestDataAsFormData
            },
            ignoreMaxFileSize ? undefined : 50 * 1024 * 1024
          )
        ).throwIfUndefined("Failed to download GeoJSON");
        if (isOverMaxSizeResponse(response)) {
          return await this.largeDownloadWarning(response);
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

  private async largeDownloadWarning(response: OverMaxSizeResponse) {
    runInAction(() =>
      this.setTrait(CommonStrata.underride, "disablePreview", true)
    );

    const fileSizeMessage =
      response.overMaxFileSize.type === "total"
        ? `The size of the file is ${Math.round(
            response.overMaxFileSize.bytes / (1024 * 1024)
          )}MB`
        : `The size of the file is over ${Math.round(
            response.overMaxFileSize.bytes / (1024 * 1024)
          )}MB`;

    const result = await new Promise<boolean>(resolve => {
      this.terria.notificationState.addNotificationToQueue({
        title: "Warning: large file download",
        message: `You are about to download a large file for item: \`${getName(
          this
        )}\`\n${fileSizeMessage}`,
        confirmAction: () => resolve(true),
        denyAction: () => resolve(false),
        denyText: "Cancel",
        confirmText: "Download"
      });
    });

    if (result) {
      return this.forceLoadGeojsonData(true);
    } else {
      this.resetLoadMapItems();
      throw new TerriaError({
        title: "File download interrupted by user",
        message: fileSizeMessage,
        overrideRaiseToUser: false,
        importance: 3,
        severity: TerriaErrorSeverity.Error
      });
    }
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
