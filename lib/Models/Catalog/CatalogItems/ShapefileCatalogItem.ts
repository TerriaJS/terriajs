import * as geoJsonMerge from "@mapbox/geojson-merge";
import i18next from "i18next";
import * as shp from "shpjs";
import JsonValue, { isJsonObject, JsonArray } from "../../../Core/Json";
import CatalogMemberMixin from "../../../ModelMixins/CatalogMemberMixin";
import GeoJsonMixin from "../../../ModelMixins/GeojsonMixin";
import ShapefileCatalogItemTraits from "../../../Traits/TraitsClasses/ShapefileCatalogItemTraits";
import CreateModel from "../../Definition/CreateModel";
import makeRealPromise from "../../../Core/makeRealPromise";
import TerriaError from "../../../Core/TerriaError";
import proxyCatalogItemUrl from "../proxyCatalogItemUrl";
import loadBlob from "../../../Core/loadBlob";

export function isJsonArrayOrDeepArrayOfObjects(
  value: JsonValue | undefined
): value is JsonArray {
  return (
    Array.isArray(value) &&
    value.every(
      child => isJsonObject(child) || isJsonArrayOrDeepArrayOfObjects(child)
    )
  );
}

class ShapefileCatalogItem extends GeoJsonMixin(
  CatalogMemberMixin(CreateModel(ShapefileCatalogItemTraits))
) {
  static readonly type = "shp";
  get type() {
    return ShapefileCatalogItem.type;
  }

  get typeName() {
    return i18next.t("models.shapefile.name");
  }

  protected async loadFromFile(file: File): Promise<any> {
    return parseShapefile(file);
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
      return loadZipFileFromUrl(proxyCatalogItemUrl(this, url));
    }
  }

  protected async customDataLoader(
    resolve: (value: any) => void,
    reject: (reason: any) => void
  ): Promise<any> {}
}

function loadZipFileFromUrl(url: string): Promise<JsonValue> {
  return makeRealPromise<Blob>(loadBlob(url)).then((blob: Blob) => {
    return parseShapefile(blob);
  });
}

async function parseShapefile(blob: Blob) {
  let json: any;
  const asAb = await blob.arrayBuffer();
  json = await shp.parseZip(asAb);
  if (isJsonArrayOrDeepArrayOfObjects(json)) {
    // There were multiple shapefiles in this zip file. Merge them.
    json = geoJsonMerge.merge(json);
  }
  return json;
}

export default ShapefileCatalogItem;
