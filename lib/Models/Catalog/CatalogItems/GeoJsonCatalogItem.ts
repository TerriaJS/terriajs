import i18next from "i18next";
import { get as _get, set as _set } from "lodash";
import { computed, toJS, makeObservable } from "mobx";
import isDefined from "../../../Core/isDefined";
import JsonValue, { isJsonObject } from "../../../Core/Json";
import loadBlob, { isZip, parseZipJsonBlob } from "../../../Core/loadBlob";
import loadJson from "../../../Core/loadJson";
import readJson from "../../../Core/readJson";
import TerriaError from "../../../Core/TerriaError";
import GeoJsonMixin, {
  FeatureCollectionWithCrs,
  reprojectToGeographic,
  toFeatureCollection
} from "../../../ModelMixins/GeojsonMixin";
import GeoJsonCatalogItemTraits from "../../../Traits/TraitsClasses/GeoJsonCatalogItemTraits";
import CreateModel from "../../Definition/CreateModel";
import HasLocalData from "../../HasLocalData";
import Terria from "../../Terria";
import Model, { ModelConstructorParameters } from "../../Definition/Model";
import proxyCatalogItemUrl from "../proxyCatalogItemUrl";
import ApiRequestTraits from "../../../Traits/TraitsClasses/ApiRequestTraits";
import filterOutUndefined from "../../../Core/filterOutUndefined";
import { featureCollection, FeatureCollection } from "@turf/helpers";
import CesiumIonMixin from "../../../ModelMixins/CesiumIonMixin";
import Cartographic from "terriajs-cesium/Source/Core/Cartographic";
import sampleTerrainMostDetailed from "terriajs-cesium/Source/Core/sampleTerrainMostDetailed";
import ExportableFormat from "../../../ViewModels/Measure/ExportableFormat";
import DataUri from "../../../Core/DataUri";
import { DownloadLink } from "../../../ViewModels/Measure/MeasurableDownload";
import { MeasurableGeometry } from "../../../ViewModels/Measure/MeasurableGeometryManager";
import CesiumMath from "terriajs-cesium/Source/Core/Math";

class GeoJsonCatalogItem
  extends CesiumIonMixin(GeoJsonMixin(CreateModel(GeoJsonCatalogItemTraits)))
  implements HasLocalData, ExportableFormat
{
  static readonly type = "geojson";

  constructor(...args: ModelConstructorParameters) {
    super(...args);
    makeObservable(this);
  }

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

  private generateMultiPathJsonPolygon(
    geomList: MeasurableGeometry[],
    name: string
  ): string {
    return JSON.stringify({
      type: "FeatureCollection",
      name: name || "",
      features: geomList.map((geom) => {
        const coordinates = geom.stopPoints.map((elem) => [
          CesiumMath.toDegrees(elem.longitude),
          CesiumMath.toDegrees(elem.latitude)
        ]);

        if (
          coordinates.length &&
          (coordinates[0][0] !== coordinates[coordinates.length - 1][0] ||
            coordinates[0][1] !== coordinates[coordinates.length - 1][1])
        ) {
          coordinates.push(coordinates[0]);
        }

        return {
          type: "Feature",
          geometry: {
            type: "MultiPolygon",
            coordinates: [[coordinates]]
          },
          properties: {
            path_notes: geom.pathNotes || ""
          }
        };
      })
    });
  }

  private generateMultiPathJsonLineStrings(
    geomList: MeasurableGeometry[],
    name: string
  ): string {
    return JSON.stringify({
      type: "FeatureCollection",
      name: name || "",
      features: geomList.map((geom) => ({
        type: "Feature",
        geometry: {
          type: "MultiLineString",
          coordinates: [
            geom.stopPoints.map((elem) => [
              CesiumMath.toDegrees(elem.longitude),
              CesiumMath.toDegrees(elem.latitude),
              Math.round(elem.height)
            ])
          ]
        },
        properties: {
          path_notes: geom.pathNotes
        }
      }))
    });
  }

  private generateJsonPolygon(geom: MeasurableGeometry, name: string): string {
    const coordinates = geom.stopPoints.map((elem) => [
      CesiumMath.toDegrees(elem.longitude),
      CesiumMath.toDegrees(elem.latitude)
    ]);

    if (
      coordinates.length &&
      (coordinates[0][0] !== coordinates[coordinates.length - 1][0] ||
        coordinates[0][1] !== coordinates[coordinates.length - 1][1])
    ) {
      coordinates.push(coordinates[0]);
    }

    return JSON.stringify({
      name: name || "",
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [coordinates]
      },
      properties: {
        path_notes: geom.pathNotes || ""
      }
    });
  }

  private generateJsonLineStrings(
    geom: MeasurableGeometry,
    name: string
  ): string {
    return JSON.stringify({
      name: name || "",
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: geom.stopPoints.map((elem) => [
          CesiumMath.toDegrees(elem.longitude),
          CesiumMath.toDegrees(elem.latitude),
          Math.round(elem.height)
        ])
      },
      properties: {
        path_notes: geom.pathNotes || ""
      }
    });
  }

  private generateJsonPoints(geom: MeasurableGeometry, name: string): string {
    return JSON.stringify({
      name: name || "",
      path_notes: geom.pathNotes || "",
      type: "FeatureCollection",
      features: geom.stopPoints.map((elem, index) => {
        return {
          type: "Feature",
          properties: {
            description: geom.pointDescriptions?.[index] || ""
          },
          geometry: {
            coordinates: [
              CesiumMath.toDegrees(elem.longitude),
              CesiumMath.toDegrees(elem.latitude),
              elem.height
            ],
            type: "Point"
          }
        };
      })
    });
  }

  async generateDownloadLinks(
    geom: MeasurableGeometry,
    name: string,
    isMultiPath: boolean,
    geomList?: MeasurableGeometry[]
  ): Promise<DownloadLink[]> {
    const downloads: DownloadLink[] = [];

    if (isMultiPath && geomList) {
      downloads.push(
        {
          key: "jsonMultiPathPolygon",
          href: DataUri.make(
            "json",
            this.generateMultiPathJsonPolygon(geomList, name)
          ),
          download: `${name}_polygon_multipath.geojson`,
          label: `Multi ${i18next.t("downloadData.polygon")} GEOJSON`
        },
        {
          key: "jsonMultiPathLines",
          href: DataUri.make(
            "json",
            this.generateMultiPathJsonLineStrings(geomList, name)
          ),
          download: `${name}_lines_multipath.geojson`,
          label: `Multi ${i18next.t("downloadData.lines")} GEOJSON`
        }
      );
    } else {
      downloads.push(
        {
          key: "jsonPolygon",
          href: DataUri.make("json", this.generateJsonPolygon(geom, name)),
          download: `${name}_polygon.geojson`,
          label: `${i18next.t("downloadData.polygon")} GEOJSON`
        },
        {
          key: "jsonLines",
          href: DataUri.make("json", this.generateJsonLineStrings(geom, name)),
          download: `${name}_lines.geojson`,
          label: `${i18next.t("downloadData.lines")} GEOJSON`
        },
        {
          key: "jsonPoints",
          href: DataUri.make("json", this.generateJsonPoints(geom, name)),
          download: `${name}_points.geojson`,
          label: `${i18next.t("downloadData.points")} GEOJSON`
        }
      );
    }

    return downloads.filter((download) => {
      if (geom.onlyPoints) {
        return (
          !download.download?.includes("_lines") &&
          !download.download?.includes("_polygon")
        );
      } else if (geom.isClosed) {
        return true;
      } else {
        return !download.download?.includes("_polygon");
      }
    });
  }

  /**
   * Tries to build a FeatureCollection from partial geojson data
   */
  private featureCollectionFromPartialData(
    jsonData: JsonValue
  ): FeatureCollectionWithCrs | undefined {
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
    return undefined;
  }

  protected override async forceLoadMetadata() {
    const ionResourcePromise = this.loadIonResource();
    await super.forceLoadMetadata();
    await ionResourcePromise;
  }

  public async forceLoadGeojsonData() {
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
    } else if (isDefined(this.ionResource)) {
      jsonData = await loadJson(this.ionResource);
    }
    // We have multiple sources.
    else if (this.urls.length > 0) {
      // Map each source to a FeatureCollection and then merge them to build a
      // single FeatureCollection
      const promises = this.urls.map(async (source) => {
        const json = await this.fetchSource(source);
        const fc = this.featureCollectionFromPartialData(json);
        // We need to reproject the FeatureCollection here as we will loose
        // specific CRS information when merging the multiple FCs.
        const geojson = await (fc
          ? reprojectToGeographic(
              fc,
              this.terria.configParameters.proj4ServiceBaseUrl
            )
          : undefined);
        return geojson;
      });
      const featureCollections = filterOutUndefined(
        await Promise.all(promises)
      );

      // Forced type casting required as TS not happy with assigning
      // FeatureCollection to JsonValue
      jsonData = mergeFeatureCollections(
        featureCollections
      ) as any as JsonValue;
    }
    // GeojsonTraits.url
    else if (this.url) {
      jsonData = await this.fetchSource(this);
    }

    if (jsonData === undefined) {
      throw TerriaError.from("Failed to load geojson");
    }

    const fc = this.featureCollectionFromPartialData(jsonData);
    if (fc) {
      return fc;
    }

    throw TerriaError.from(
      "Invalid geojson data - only FeatureCollection and Feature are supported"
    );
  }

  private async fetchSource(
    source: Model<ApiRequestTraits>
  ): Promise<JsonValue | undefined> {
    const url = source.url;
    if (!url) {
      return;
    }

    let jsonData;
    // URL to zipped fle
    if (isZip(url)) {
      if (typeof FileReader === "undefined") {
        throw fileApiNotSupportedError(this.terria);
      }
      const body = source.requestData ? toJS(source.requestData) : undefined;
      const blob = await loadBlob(
        proxyCatalogItemUrl(this, url),
        undefined,
        body
      );
      jsonData = await parseZipJsonBlob(blob);
    } else {
      jsonData = await loadJson(
        proxyCatalogItemUrl(this, url),
        undefined,
        source.requestData ? toJS(source.requestData) : undefined,
        source.postRequestDataAsFormData
      );
      if (source.responseDataPath) {
        jsonData = _get(jsonData, source.responseDataPath);
      }
    }
    return jsonData;
  }

  public async sampleFromGeojsonData(): Promise<void> {
    const fc = await this.forceLoadGeojsonData();
    if (!fc) return;

    const positions: Cartographic[] = [];
    const descriptions: string[] = [];

    fc.features.forEach((feature) => {
      if (!feature.geometry) return;
      switch (feature.geometry.type) {
        case "Point": {
          const coords = feature.geometry.coordinates;
          const lon = coords[0];
          const lat = coords[1];
          const alt = coords.length > 2 ? coords[2] : 0;
          positions.push(
            Cartographic.fromDegrees(
              lon as number,
              lat as number,
              alt as number
            )
          );
          descriptions.push(feature.properties?.description || "");
          break;
        }
        case "LineString": {
          const coordsArray = feature.geometry.coordinates;
          coordsArray.forEach((coords: any) => {
            const lon = coords[0];
            const lat = coords[1];
            const alt = coords.length > 2 ? coords[2] : 0;
            positions.push(Cartographic.fromDegrees(lon, lat, alt));
          });
          descriptions.push(feature.properties?.description || "");
          break;
        }
        default:
          break;
      }
    });
    if (positions.length === 0) return;

    if (!this.terria?.cesium?.scene) return;
    const terrainProvider = this.terria.cesium.scene.terrainProvider;

    const resolvedPositions = positions.every((pos) => pos.height < 1)
      ? await sampleTerrainMostDetailed(terrainProvider, positions)
      : positions;

    const pathNotes = (fc as any).path_notes || "";

    this.terria.measurableGeometryManager[
      this.terria.measurableGeometryIndex
    ].sampleFromCartographics(
      resolvedPositions,
      false,
      true,
      descriptions,
      pathNotes
    );
  }
}

/**
 * Reduce an array of FeatureCollection into a single FeatureCollection.
 *
 * Note that this only accumulates the features and ignores any properties set
 * on the individual FeatureCollection.
 */
function mergeFeatureCollections(
  featureCollections: Array<FeatureCollection>
): FeatureCollection {
  return featureCollection(featureCollections.map((fc) => fc.features).flat());
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
