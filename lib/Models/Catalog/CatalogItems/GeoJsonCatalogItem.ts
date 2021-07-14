import i18next from "i18next";
import { toJS } from "mobx";
import isDefined from "../../../Core/isDefined";
import JsonValue from "../../../Core/Json";
import loadBlob from "../../../Core/loadBlob";
import loadJson from "../../../Core/loadJson";
import makeRealPromise from "../../../Core/makeRealPromise";
import readJson from "../../../Core/readJson";
import TerriaError from "../../../Core/TerriaError";
import CatalogMemberMixin from "../../../ModelMixins/CatalogMemberMixin";
import GeoJsonMixin from "../../../ModelMixins/GeojsonMixin";
import GeoJsonCatalogItemTraits from "../../../Traits/TraitsClasses/GeoJsonCatalogItemTraits";
import CreateModel from "../../Definition/CreateModel";
import proxyCatalogItemUrl from "../proxyCatalogItemUrl";

const zip = require("terriajs-cesium/Source/ThirdParty/zip").default;

const geoJsonRegex = /.geojson\b/i;

class GeoJsonCatalogItem extends GeoJsonMixin(
  CatalogMemberMixin(CreateModel(GeoJsonCatalogItemTraits))
) {
  static readonly type = "geojson";
  get type() {
    return GeoJsonCatalogItem.type;
  }

  get typeName() {
    return i18next.t("models.geoJson.name");
  }

  protected async customDataLoader(
    resolve: (value: any) => void,
    reject: (reason: any) => void
  ): Promise<any> {
    if (isDefined(this.geoJsonData)) {
      resolve(toJS(this.geoJsonData));
    } else if (isDefined(this.geoJsonString)) {
      resolve(<JsonValue>JSON.parse(this.geoJsonString));
    }
  }

  protected async loadFromFile(file: File): Promise<any> {
    if (isDefined(file.name) && this.zipFileRegex.test(file.name)) {
      const asAb = await file.arrayBuffer();
      const blob = new Blob([asAb]);
      return parseBlob(blob);
    } else {
      return readJson(file);
    }
  }

  protected loadZipFileFromUrl(url: string): Promise<JsonValue> {
    const body = this.requestData ? toJS(this.requestData) : undefined;
    return makeRealPromise<Blob>(loadBlob(url, undefined, body)).then(
      (blob: Blob) => {
        return parseBlob(blob);
      }
    );
  }

  protected async loadFromUrl(url: string): Promise<any> {
    if (this.zipFileRegex.test(url)) {
      if (typeof FileReader === "undefined") {
        throw new TerriaError({
          title: i18next.t("models.userData.fileApiNotSupportedTitle"),
          message: i18next.t("models.userData.fileApiNotSupportedTitle", {
            appName: this.terria.appName,
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
      return this.loadZipFileFromUrl(proxyCatalogItemUrl(this, url));
    } else {
      return loadJson(
        proxyCatalogItemUrl(this, url),
        undefined,
        this.requestData ? toJS(this.requestData) : undefined,
        this.postRequestDataAsFormData
      );
    }
  }
}

function parseBlob(blob: Blob): Promise<JsonValue> {
  return new Promise((resolve, reject) => {
    zip.createReader(
      new zip.BlobReader(blob),
      function(reader: any) {
        // Look for a file with a .geojson extension.
        reader.getEntries(function(entries: any) {
          let resolved = false;
          for (let i = 0; i < entries.length; i++) {
            const entry = entries[i];
            if (geoJsonRegex.test(entry.filename)) {
              entry.getData(new zip.Data64URIWriter(), function(uri: string) {
                resolve(loadJson(uri));
              });
              resolved = true;
            }
          }
          if (!resolved) {
            reject();
          }
        });
      },
      (e: Error) => reject(e)
    );
  });
}

export default GeoJsonCatalogItem;
