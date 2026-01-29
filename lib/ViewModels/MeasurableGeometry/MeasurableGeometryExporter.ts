import i18next from "i18next";
import CesiumMath from "terriajs-cesium/Source/Core/Math";
import Ellipsoid from "terriajs-cesium/Source/Core/Ellipsoid";
import Cartographic from "terriajs-cesium/Source/Core/Cartographic";
import Entity from "terriajs-cesium/Source/DataSources/Entity";
import EntityCollection from "terriajs-cesium/Source/DataSources/EntityCollection";
import PolylineGraphics from "terriajs-cesium/Source/DataSources/PolylineGraphics";
import PointGraphics from "terriajs-cesium/Source/DataSources/PointGraphics";
import {
  EllipsoidGeodesic,
  exportKml,
  exportKmlResultKml
} from "terriajs-cesium";
import DataUri from "../../Core/DataUri";
import { MeasurableGeometry } from "./MeasurableGeometryManager";
import { DownloadLink } from "./MeasurableGeometryDownload";

export default class MeasurableGeometryExporter {
  static async generateAllDownloadLinks(
    geom: MeasurableGeometry,
    name: string,
    isMultiPath: boolean,
    ellipsoid: Ellipsoid,
    geomList?: MeasurableGeometry[]
  ): Promise<DownloadLink[]> {
    const downloads: DownloadLink[] = [];

    if (isMultiPath && geomList) {
      downloads.push(
        ...(await this.generateMultiPathKmlLinks(geomList, name, ellipsoid)),
        ...(await this.generateMultiPathGeoJsonLinks(geomList, name, ellipsoid))
      );
    } else {
      downloads.push(
        ...(await this.generateKmlLinks(geom, name, ellipsoid)),
        ...(await this.generateCsvLinks(geom, name)),
        ...(await this.generateGpxLinks(geom, name)),
        ...(await this.generateGeoJsonLinks(geom, name, ellipsoid))
      );
    }

    return downloads.filter((download) => {
      if (download.href === false) return false;

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

  private static async generateMultiPathKmlLinks(
    geomList: MeasurableGeometry[],
    name: string,
    ellipsoid?: Ellipsoid
  ): Promise<DownloadLink[]> {
    const polygonKml = await this.generateMultiPathKmlPolygon(geomList, name);
    const linesKml = await this.generateMultiPathKmlLines(
      geomList,
      name,
      ellipsoid
    );

    return [
      {
        key: "kmlMultiPathPolygon",
        href: polygonKml
          ? DataUri.make(
              "application/vnd.google-earth.kml+xml;charset=utf-8",
              polygonKml
            )
          : false,
        download: `${name}_polygon_multipath.kml`,
        label: `Multi ${i18next.t("downloadData.polygon")} KML`
      },
      {
        key: "kmlMultiPathLines",
        href: linesKml
          ? DataUri.make(
              "application/vnd.google-earth.kml+xml;charset=utf-8",
              linesKml
            )
          : false,
        download: `${name}_lines_multipath.kml`,
        label: `Multi ${i18next.t("downloadData.lines")} KML`
      }
    ];
  }

  private static async generateKmlLinks(
    geom: MeasurableGeometry,
    name: string,
    ellipsoid?: Ellipsoid
  ): Promise<DownloadLink[]> {
    const polygonKml = await this.generateKmlPolygon(geom, name);
    const linesKml = await this.generateKmlLines(geom, name, ellipsoid);
    const pointsKml = await this.generateKmlPoints(geom, name, ellipsoid);

    return [
      {
        key: "kmlPolygon",
        href: polygonKml
          ? DataUri.make(
              "application/vnd.google-earth.kml+xml;charset=utf-8",
              polygonKml
            )
          : false,
        download: `${name}_polygon.kml`,
        label: `${i18next.t("downloadData.polygon")} KML`
      },
      {
        key: "kmlLines",
        href: linesKml
          ? DataUri.make(
              "application/vnd.google-earth.kml+xml;charset=utf-8",
              linesKml
            )
          : false,
        download: `${name}_lines.kml`,
        label: `${i18next.t("downloadData.lines")} KML`
      },
      {
        key: "kmlPoints",
        href: pointsKml
          ? DataUri.make(
              "application/vnd.google-earth.kml+xml;charset=utf-8",
              pointsKml
            )
          : false,
        download: `${name}_points.kml`,
        label: `${i18next.t("downloadData.points")} KML`
      }
    ];
  }

  private static async generateMultiPathKmlPolygon(
    geomList: MeasurableGeometry[],
    name: string
  ): Promise<string | undefined> {
    if (!geomList?.length) return undefined;

    let polygonsContent = "";
    geomList.forEach((geom, idx) => {
      const coords = geom.stopPoints.map((pt) => {
        const lon = CesiumMath.toDegrees(pt.longitude);
        const lat = CesiumMath.toDegrees(pt.latitude);
        return `${lon},${lat}`;
      });

      if (coords[0] !== coords[coords.length - 1]) {
        coords.push(coords[0]);
      }

      const coordsString = coords.join(" ");

      polygonsContent += `<Placemark id="${idx}">
          <description>${geom.pathNotes ?? ""}</description>
          <Style>
            <LineStyle>
              <color>ff0000ff</color>
            </LineStyle>
            <PolyStyle>
              <fill>0</fill>
            </PolyStyle>
          </Style>
          <Polygon>
            <altitudeMode>clampToGround</altitudeMode>
            <outerBoundaryIs>
              <LinearRing>
                <altitudeMode>clampToGround</altitudeMode>
                <coordinates>${coordsString}</coordinates>
              </LinearRing>
            </outerBoundaryIs>
          </Polygon>
        </Placemark>`;
    });

    return `<?xml version="1.0" encoding="utf-8"?>
      <kml xmlns="http://www.opengis.net/kml/2.2">
        <Document id="root_doc">
          <Folder>
          <name>${name || ""}</name>
            ${polygonsContent}
          </Folder>
        </Document>
      </kml>`;
  }

  private static async generateMultiPathKmlLines(
    geomList: MeasurableGeometry[],
    name: string,
    ellipsoid?: Ellipsoid
  ): Promise<string | undefined> {
    if (!geomList?.length || !ellipsoid) return undefined;

    const output = {
      entities: new EntityCollection(),
      kmz: false,
      ellipsoid: ellipsoid
    };

    geomList.forEach((geom, idx) => {
      output.entities.add(
        new Entity({
          id: idx.toString(),
          polyline: new PolylineGraphics({
            positions: geom.stopPoints.map((elem) =>
              Cartographic.toCartesian(elem, ellipsoid)
            )
          }),
          description: geom.pathNotes
        })
      );
    });

    const res = (await exportKml(output)) as exportKmlResultKml;
    res.kml = res.kml
      .replace(
        /<Document\s+xmlns="">/,
        `<Document xmlns=""><Folder><name>${name || ""}</name>`
      )
      .replace(/<\/Document>/, "</Folder></Document>");
    return this.normalizeKmlOutput(res.kml);
  }

  private static async generateKmlPolygon(
    geom: MeasurableGeometry,
    name: string
  ): Promise<string | undefined> {
    if (!geom?.stopPoints) return undefined;

    const coords = geom.stopPoints.map((point) => {
      const lon = CesiumMath.toDegrees(point.longitude);
      const lat = CesiumMath.toDegrees(point.latitude);
      return `${lon},${lat}`;
    });

    if (coords[0] !== coords[coords.length - 1]) {
      coords.push(coords[0]);
    }

    const coordsString = coords.join(" ");

    return `<?xml version="1.0" encoding="utf-8"?>
        <kml xmlns="http://www.opengis.net/kml/2.2">
          <Document id="root_doc">
            <Folder>
            <Placemark id="0">
                <name>${name}</name>
                <description>${geom.pathNotes}</description>
                <Style>
                  <LineStyle>
                    <color>ff0000ff</color>
                  </LineStyle>
                  <PolyStyle>
                    <fill>0</fill>
                  </PolyStyle>
                </Style>
                <Polygon>
                  <altitudeMode>clampToGround</altitudeMode>
                  <outerBoundaryIs>
                    <LinearRing>
                      <altitudeMode>clampToGround</altitudeMode>
                      <coordinates>${coordsString}</coordinates>
                    </LinearRing>
                  </outerBoundaryIs>
                </Polygon>
              </Placemark>
            </Folder>
          </Document>
        </kml>`;
  }

  private static async generateKmlLines(
    geom: MeasurableGeometry,
    name: string,
    ellipsoid?: Ellipsoid
  ): Promise<string | undefined> {
    if (!geom?.stopPoints || !ellipsoid) return undefined;

    const output = {
      entities: new EntityCollection(),
      kmz: false,
      ellipsoid: ellipsoid
    };

    output.entities.add(
      new Entity({
        id: "0",
        polyline: new PolylineGraphics({
          positions: geom.stopPoints.map((elem) =>
            Cartographic.toCartesian(elem, ellipsoid)
          )
        }),
        name: name,
        description: geom.pathNotes
      })
    );

    const res = (await exportKml(output)) as exportKmlResultKml;
    return this.normalizeKmlOutput(res.kml);
  }

  private static async generateKmlPoints(
    geom: MeasurableGeometry,
    name: string,
    ellipsoid?: Ellipsoid
  ): Promise<string | undefined> {
    if (!geom?.stopPoints || !ellipsoid) return undefined;

    const output = {
      entities: new EntityCollection(),
      kmz: false,
      ellipsoid: ellipsoid
    };

    geom.stopPoints.forEach((elem, index) => {
      output.entities.add(
        new Entity({
          id: index.toString(),
          point: new PointGraphics({}),
          position: Cartographic.toCartesian(elem, ellipsoid),
          description: geom.pointDescriptions?.[index]
        })
      );
    });

    const res = (await exportKml(output)) as exportKmlResultKml;
    res.kml = res.kml
      .replace(
        /<Document\s+xmlns="">/,
        `<Document xmlns=""><Folder><name>${name || ""}</name><description>${
          geom.pathNotes || ""
        }</description>`
      )
      .replace(/<\/Document>/, "</Folder></Document>");
    return this.normalizeKmlOutput(res.kml);
  }

  private static normalizeKmlOutput(kml: string): string {
    if (!kml) return kml;
    let normalized = kml.trimStart();
    if (!normalized.startsWith("<?xml")) {
      normalized = `<?xml version="1.0" encoding="utf-8"?>\n${normalized}`;
    }

    const ensureClamp = (tag: "LineString" | "Point") => {
      const regex = new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, "g");
      normalized = normalized.replace(regex, (full, inner) => {
        const withoutAltitudeMode = inner.replace(
          /<altitudeMode>[\s\S]*?<\/altitudeMode>/gi,
          ""
        );
        return `<${tag}>\n  <altitudeMode>clampToGround</altitudeMode>\n${withoutAltitudeMode}</${tag}>`;
      });
    };

    ensureClamp("LineString");
    ensureClamp("Point");

    return normalized;
  }

  private static generateCsvLinks(
    geom: MeasurableGeometry,
    name: string
  ): DownloadLink[] {
    return [
      {
        key: "csv",
        href: DataUri.make("csv", this.generateCsvData(geom)),
        download: `${name}_points.csv`,
        label: "CSV"
      }
    ];
  }

  private static generateCsvData(geom: MeasurableGeometry): string {
    const isPointsOnly = geom.onlyPoints === true;
    const headers = isPointsOnly
      ? ["longitude", "latitude", "height", "description"].join(",")
      : [
          "longitude",
          "latitude",
          "height",
          "alt_diff",
          "geodetic_distance",
          "air_distance",
          "ground_distance",
          "slope"
        ].join(",");

    if (!geom.stopPoints || geom.stopPoints.length === 0) {
      return headers;
    }

    const rows = [headers];

    const stopGeodeticDistances = geom.stopGeodeticDistances ?? [];
    const stopAirDistances = geom.stopAirDistances ?? [];
    const stopGroundDistances = geom.stopGroundDistances ?? [];

    rows.push(
      ...geom.stopPoints.map((elem, index) => {
        const baseColumns: (string | number)[] = [
          CesiumMath.toDegrees(elem.longitude).toFixed(6),
          CesiumMath.toDegrees(elem.latitude).toFixed(6),
          elem.height.toFixed(2)
        ];

        if (isPointsOnly) {
          return [...baseColumns, geom.pointDescriptions?.[index] || ""].join(
            ","
          );
        }

        const prev = index > 0 ? geom.stopPoints[index - 1] : undefined;

        const altDiff =
          index > 0 && prev ? (elem.height - prev.height).toFixed(2) : "";

        const geodeticDistance =
          index > 0 ? stopGeodeticDistances[index].toFixed(2) : "";
        const airDistance = index > 0 ? stopAirDistances[index].toFixed(2) : "";
        const groundDistance =
          index > 0 ? stopGroundDistances[index].toFixed(2) : "";

        let slope = "";
        const airDistNum = stopAirDistances[index];
        if (index > 0 && prev && typeof airDistNum === "number" && airDistNum) {
          slope = Math.abs(
            (100 * (elem.height - prev.height)) / airDistNum
          ).toFixed(1);
        }

        return [
          ...baseColumns,
          altDiff,
          geodeticDistance,
          airDistance,
          groundDistance,
          slope
        ].join(",");
      })
    );

    return rows.join("\n");
  }

  private static generateGpxLinks(
    geom: MeasurableGeometry,
    name: string
  ): DownloadLink[] {
    return [
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
    ];
  }

  private static generateGpxTracks(
    geom: MeasurableGeometry,
    name: string
  ): string {
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

  private static generateGpxWaypoints(
    geom: MeasurableGeometry,
    name: string
  ): string {
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

  private static generateMultiPathGeoJsonLinks(
    geomList: MeasurableGeometry[],
    name: string,
    ellipsoid: Ellipsoid
  ): DownloadLink[] {
    return [
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
          this.generateMultiPathJsonLineStrings(geomList, name, ellipsoid)
        ),
        download: `${name}_lines_multipath.geojson`,
        label: `Multi ${i18next.t("downloadData.lines")} GEOJSON`
      }
    ];
  }

  private static generateGeoJsonLinks(
    geom: MeasurableGeometry,
    name: string,
    ellipsoid: Ellipsoid
  ): DownloadLink[] {
    return [
      {
        key: "jsonPolygon",
        href: DataUri.make("json", this.generateJsonPolygon(geom, name)),
        download: `${name}_polygon.geojson`,
        label: `${i18next.t("downloadData.polygon")} GEOJSON`
      },
      {
        key: "jsonLines",
        href: DataUri.make(
          "json",
          this.generateJsonLineStrings(geom, name, ellipsoid)
        ),
        download: `${name}_lines.geojson`,
        label: `${i18next.t("downloadData.lines")} GEOJSON`
      },
      {
        key: "jsonPoints",
        href: DataUri.make(
          "json",
          this.generateJsonPoints(geom, name, ellipsoid)
        ),
        download: `${name}_points.geojson`,
        label: `${i18next.t("downloadData.points")} GEOJSON`
      }
    ];
  }

  private static generateMultiPathJsonPolygon(
    geomList: MeasurableGeometry[],
    name: string
  ): string {
    return JSON.stringify({
      type: "FeatureCollection",
      name: name || "",
      features: geomList.map((geom) => {
        const coordinates = geom.stopPoints.map((elem) => [
          CesiumMath.toDegrees(elem.longitude),
          CesiumMath.toDegrees(elem.latitude),
          elem.height
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
            ...(geom.featureProperties ?? {}),
            ...this.getPolygonSummaryProperties(geom)
          }
        };
      })
    });
  }

  private static generateMultiPathJsonLineStrings(
    geomList: MeasurableGeometry[],
    name: string,
    ellipsoid: Ellipsoid
  ): string {
    return JSON.stringify({
      type: "FeatureCollection",
      name: name || "",
      features: geomList.map((geom) => {
        return {
          type: "Feature",
          geometry: {
            type: "MultiLineString",
            coordinates: [
              geom.stopPoints.map((elem) => [
                CesiumMath.toDegrees(elem.longitude),
                CesiumMath.toDegrees(elem.latitude),
                elem.height
              ])
            ]
          },
          properties: {
            ...(geom.featureProperties ?? {}),
            path_notes: geom.pathNotes || "",
            ...this.getPointLineSummaryProperties(geom, true, ellipsoid)
          }
        };
      })
    });
  }

  private static generateJsonPolygon(
    geom: MeasurableGeometry,
    name: string
  ): string {
    const coordinates = geom.stopPoints.map((elem) => [
      CesiumMath.toDegrees(elem.longitude),
      CesiumMath.toDegrees(elem.latitude),
      elem.height
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
        ...(geom.featureProperties ?? {}),
        ...this.getPolygonSummaryProperties(geom)
      }
    });
  }

  private static generateJsonLineStrings(
    geom: MeasurableGeometry,
    name: string,
    ellipsoid: Ellipsoid
  ): string {
    return JSON.stringify({
      name: name || "",
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: geom.stopPoints.map((elem) => [
          CesiumMath.toDegrees(elem.longitude),
          CesiumMath.toDegrees(elem.latitude),
          elem.height
        ])
      },
      properties: {
        ...(geom.featureProperties ?? {}),
        path_notes: geom.pathNotes || "",
        ...this.getPointLineSummaryProperties(geom, true, ellipsoid)
      }
    });
  }

  private static generateJsonPoints(
    geom: MeasurableGeometry,
    name: string,
    ellipsoid: Ellipsoid
  ): string {
    return JSON.stringify({
      name: name || "",
      path_notes: geom.pathNotes || "",
      ...this.getPointLineSummaryProperties(geom, false, ellipsoid),
      type: "FeatureCollection",
      features: geom.stopPoints.map((elem, index) => {
        const pointProps = { ...(geom.pointProperties?.[index] ?? {}) } as any;
        if (
          geom.pointDescriptions?.[index] !== undefined &&
          pointProps.description === undefined
        ) {
          pointProps.description = geom.pointDescriptions?.[index] || "";
        }
        return {
          type: "Feature",
          properties: {
            ...pointProps,
            altitude: elem.height
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

  private static getPointLineSummaryProperties(
    geom: MeasurableGeometry,
    includeDistances: boolean = true,
    ellipsoid: Ellipsoid
  ) {
    const heights = geom.stopPoints
      .map((p) => p.height)
      .filter((h) => isFinite(h));
    const altMin = heights.length > 0 ? Math.min(...heights) : 0;
    const altMax = heights.length > 0 ? Math.max(...heights) : 0;
    const start = geom.stopPoints[0];
    const end = geom.stopPoints.at(-1);
    const altDiff =
      start && end && isFinite(start.height) && isFinite(end.height)
        ? end.height - start.height
        : 0;

    const bearing =
      ellipsoid && start && end
        ? (CesiumMath.toDegrees(
            new EllipsoidGeodesic(start, end, ellipsoid).startHeading
          ) +
            360) %
          360
        : undefined;

    const summary: Record<string, string | undefined> = {
      alt_min: altMin.toFixed(2),
      alt_max: altMax.toFixed(2)
    };

    if (includeDistances) {
      summary.bearing = bearing?.toFixed(2);
      summary.alt_diff = altDiff.toFixed(2);
      summary.geodetic_distance = geom.geodeticDistance?.toFixed(2);
      summary.air_distance = geom.airDistance?.toFixed(2);
      summary.ground_distance = geom.groundDistance?.toFixed(2);
    }

    return summary;
  }

  private static getPolygonSummaryProperties(geom: MeasurableGeometry) {
    const geodeticAreaM2 = geom.geodeticArea ?? 0;
    const airAreaM2 = geom.airArea ?? 0;

    return {
      path_notes: geom.pathNotes || "",
      geodetic_area: geodeticAreaM2.toFixed(2),
      air_area: airAreaM2.toFixed(2),
      geodetic_perimeter: geom.geodeticDistance?.toFixed(2),
      air_perimeter: geom.airDistance?.toFixed(2),
      ground_perimeter: geom.groundDistance?.toFixed(2)
    };
  }
}
