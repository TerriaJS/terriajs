import i18next from "i18next";
import { computed, makeObservable, override } from "mobx";
import getFilenameFromUri from "terriajs-cesium/Source/Core/getFilenameFromUri";
import isDefined from "../../../Core/isDefined";
import loadText from "../../../Core/loadText";
import readText from "../../../Core/readText";
import { networkRequestError } from "../../../Core/TerriaError";
import GeoJsonMixin, {
  FeatureCollectionWithCrs
} from "../../../ModelMixins/GeojsonMixin";
import GpxCatalogItemTraits from "../../../Traits/TraitsClasses/GpxCatalogItemTraits";
import CreateModel from "../../Definition/CreateModel";
import { ModelConstructorParameters } from "../../Definition/Model";
import proxyCatalogItemUrl from "../proxyCatalogItemUrl";
import ExportableFormat from "../../../ViewModels/Measure/ExportableFormat";
import DataUri from "../../../Core/DataUri";
import { MeasurableGeometry } from "../../../ViewModels/Measure/MeasurableGeometryManager";
import { DownloadLink } from "../../../ViewModels/Measure/MeasurableDownload";
import CesiumMath from "terriajs-cesium/Source/Core/Math";
import sampleTerrainMostDetailed from "terriajs-cesium/Source/Core/sampleTerrainMostDetailed";
import Cartographic from "terriajs-cesium/Source/Core/Cartographic";

const toGeoJSON = require("@mapbox/togeojson");

class GpxCatalogItem
  extends GeoJsonMixin(CreateModel(GpxCatalogItemTraits))
  implements ExportableFormat
{
  static readonly type = "gpx";

  constructor(...args: ModelConstructorParameters) {
    super(...args);
    makeObservable(this);
  }

  get type() {
    return GpxCatalogItem.type;
  }

  get typeName() {
    return i18next.t("models.gpx.name");
  }

  private _gpxFile?: File;

  setFileInput(file: File) {
    this._gpxFile = file;
  }

  @computed
  get hasLocalData(): boolean {
    return isDefined(this._gpxFile);
  }

  private generateGpxTracks(geom: MeasurableGeometry, name: string): string {
    return `<gpx xmlns="http://www.topografix.com/GPX/1/1" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd" version="1.1" creator="runtracker">
            <metadata/>
            <trk>
              <name>${name}</name>
              <desc>${geom.pathNotes || ""}</desc>
              <trkseg>
                ${geom.stopPoints
                  .map(
                    (elem) =>
                      `<trkpt lat="${CesiumMath.toDegrees(elem.latitude)}"
                        lon="${CesiumMath.toDegrees(elem.longitude)}"
                        ele="${elem.height.toFixed(2)}">
                      </trkpt>`
                  )
                  .join("")}
              </trkseg>
            </trk>
          </gpx>`;
  }

  private generateGpxWaypoints(geom: MeasurableGeometry, name: string): string {
    return `<gpx xmlns="http://www.topografix.com/GPX/1/1" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd" version="1.1" creator="runtracker">
            <metadata/>
            ${geom.stopPoints
              .map((elem, index) => {
                let waypoint = "";
                if (index === 0) {
                  waypoint += `<wpt name="Info File" lat="${CesiumMath.toDegrees(
                    geom.stopPoints[0].latitude
                  )}" lon="${CesiumMath.toDegrees(
                    geom.stopPoints[0].longitude
                  )}">
                                   <name>${name}</name>
                                   <desc>${geom.pathNotes || ""}</desc>
                                 </wpt>`;
                }
                waypoint += `<wpt name="Tappa ${index}"
                                lat="${CesiumMath.toDegrees(elem.latitude)}"
                                lon="${CesiumMath.toDegrees(elem.longitude)}"
                                ele="${elem.height.toFixed(2)}">
                                <desc>${
                                  geom.pointDescriptions?.[index] || ""
                                }</desc>
                              </wpt>`;
                return waypoint;
              })
              .join("")}
          </gpx>`;
  }

  async generateDownloadLinks(
    geom: MeasurableGeometry,
    name: string,
    isMultiPath: boolean
  ): Promise<DownloadLink[]> {
    const downloads: DownloadLink[] = [];
    if (!isMultiPath) {
      downloads.push(
        {
          key: "gpxPolygon",
          href: DataUri.make("xml", this.generateGpxTracks(geom, name)),
          download: `${name}_polygon.gpx`,
          label: `${i18next.t("downloadData.polygon")} GPX`
        },
        {
          key: "gpxTracks",
          href: DataUri.make("xml", this.generateGpxTracks(geom, name)),
          download: `${name}_lines.gpx`,
          label: `${i18next.t("downloadData.lines")} GPX`
        },
        {
          key: "gpxWaypoints",
          href: DataUri.make("xml", this.generateGpxWaypoints(geom, name)),
          download: `${name}_points.gpx`,
          label: `${i18next.t("downloadData.points")} GPX`
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
        return (
          !download.download?.includes("_points") &&
          !download.download?.includes("_lines")
        );
      } else {
        return (
          !download.download?.includes("_points") &&
          !download.download?.includes("_polygon")
        );
      }
    });
  }

  private loadGpxText(text: string) {
    const dom = new DOMParser().parseFromString(text, "text/xml");
    return toGeoJSON.gpx(dom);
  }

  protected async forceLoadGeojsonData(): Promise<FeatureCollectionWithCrs> {
    let data: string | undefined;
    if (isDefined(this.gpxString)) {
      data = this.gpxString;
    } else if (isDefined(this._gpxFile)) {
      data = await readText(this._gpxFile);
    } else if (isDefined(this.url)) {
      data = await loadText(proxyCatalogItemUrl(this, this.url));
    }

    if (!data) {
      throw networkRequestError({
        sender: this,
        title: i18next.t("models.gpx.errorLoadingTitle"),
        message: i18next.t("models.gpx.errorLoadingMessage", {
          appName: this.terria.appName
        })
      });
    }

    return this.loadGpxText(data);
  }

  public async sampleFromGpxData(): Promise<void> {
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
          descriptions.push(
            feature.properties?.name ||
              feature.properties?.desc ||
              feature.properties?.description ||
              ""
          );
          break;
        }
        case "LineString": {
          const coordsArray = feature.geometry.coordinates;
          coordsArray.forEach((coords: any, index: number) => {
            const lon = coords[0];
            const lat = coords[1];
            const alt = coords.length > 2 ? coords[2] : 0;
            positions.push(Cartographic.fromDegrees(lon, lat, alt));

            if (index === 0) {
              descriptions.push(
                feature.properties?.name || feature.properties?.desc || ""
              );
            } else {
              descriptions.push("");
            }
          });
          break;
        }
        case "MultiLineString": {
          const multiCoords = feature.geometry.coordinates;
          multiCoords.forEach((lineCoords: any) => {
            lineCoords.forEach((coords: any, index: number) => {
              const lon = coords[0];
              const lat = coords[1];
              const alt = coords.length > 2 ? coords[2] : 0;
              positions.push(Cartographic.fromDegrees(lon, lat, alt));

              if (index === 0) {
                descriptions.push(
                  feature.properties?.name || feature.properties?.desc || ""
                );
              } else {
                descriptions.push("");
              }
            });
          });
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

    const pathNotes = this.extractGpxNotes(fc);

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

  private extractGpxNotes(fc: FeatureCollectionWithCrs): string {
    if ((fc as any).desc || (fc as any).description) {
      return (fc as any).desc || (fc as any).description;
    }

    for (const feature of fc.features) {
      if (feature.properties?.desc || feature.properties?.description) {
        return feature.properties.desc || feature.properties.description;
      }
    }

    return "";
  }

  protected forceLoadMetadata(): Promise<void> {
    return Promise.resolve();
  }

  @override
  get name() {
    if (this.url && super.name === this.url) {
      return getFilenameFromUri(this.url);
    }
    return super.name;
  }
}

export default GpxCatalogItem;
