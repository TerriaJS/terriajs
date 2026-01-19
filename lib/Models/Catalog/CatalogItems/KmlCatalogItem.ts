import i18next from "i18next";
import { computed, makeObservable, override } from "mobx";
import Cartesian3 from "terriajs-cesium/Source/Core/Cartesian3";
import Cartographic from "terriajs-cesium/Source/Core/Cartographic";
import Ellipsoid from "terriajs-cesium/Source/Core/Ellipsoid";
import JulianDate from "terriajs-cesium/Source/Core/JulianDate";
import PolygonHierarchy from "terriajs-cesium/Source/Core/PolygonHierarchy";
import Resource from "terriajs-cesium/Source/Core/Resource";
import ConstantProperty from "terriajs-cesium/Source/DataSources/ConstantProperty";
import KmlDataSource from "terriajs-cesium/Source/DataSources/KmlDataSource";
import Property from "terriajs-cesium/Source/DataSources/Property";
import HeightReference from "terriajs-cesium/Source/Scene/HeightReference";
import ArcType from "terriajs-cesium/Source/Core/ArcType";
import sampleTerrainMostDetailed from "terriajs-cesium/Source/Core/sampleTerrainMostDetailed";
import isDefined from "../../../Core/isDefined";
import readXml from "../../../Core/readXml";
import TerriaError, { networkRequestError } from "../../../Core/TerriaError";
import CatalogMemberMixin from "../../../ModelMixins/CatalogMemberMixin";
import MappableMixin from "../../../ModelMixins/MappableMixin";
import UrlMixin from "../../../ModelMixins/UrlMixin";
import KmlCatalogItemTraits from "../../../Traits/TraitsClasses/KmlCatalogItemTraits";
import CreateModel from "../../Definition/CreateModel";
import HasLocalData from "../../HasLocalData";
import { ModelConstructorParameters } from "../../Definition/Model";
import proxyCatalogItemUrl from "../proxyCatalogItemUrl";
import CesiumIonMixin from "../../../ModelMixins/CesiumIonMixin";
import MeasurableGeometryMixin from "../../../ModelMixins/MeasurableGeometryMixin";
import Entity from "terriajs-cesium/Source/DataSources/Entity";
import ExportableMixin, {
  ExportData
} from "../../../ModelMixins/ExportableMixin";
import ExportableFormat from "../../../ViewModels/MeasurableGeometry/MeasurableGeometryExportableFormat";
import DataUri from "../../../Core/DataUri";
import { MeasurableGeometry } from "../../../ViewModels/MeasurableGeometry/MeasurableGeometryManager";
import { DownloadLink } from "../../../ViewModels/MeasurableGeometry/MeasurableGeometryDownload";
import EntityCollection from "terriajs-cesium/Source/DataSources/EntityCollection";
import PolylineGraphics from "terriajs-cesium/Source/DataSources/PolylineGraphics";
import { exportKmlResultKml } from "terriajs-cesium";
import exportKml from "terriajs-cesium/Source/DataSources/exportKml";
import CesiumMath from "terriajs-cesium/Source/Core/Math";
import PointGraphics from "terriajs-cesium/Source/DataSources/PointGraphics";

const kmzRegex = /\.kmz$/i;

class KmlCatalogItem
  extends MeasurableGeometryMixin(
    MappableMixin(
      ExportableMixin(
        UrlMixin(
          CesiumIonMixin(CatalogMemberMixin(CreateModel(KmlCatalogItemTraits)))
        )
      )
    )
  )
  implements HasLocalData, ExportableFormat
{
  static readonly type = "kml";

  constructor(...args: ModelConstructorParameters) {
    super(...args);
    makeObservable(this);
  }

  get type() {
    return KmlCatalogItem.type;
  }

  private _dataSource: KmlDataSource | undefined;

  private _kmlFile?: File;

  setFileInput(file: File) {
    this._kmlFile = file;
  }

  @computed
  get hasLocalData(): boolean {
    return isDefined(this._kmlFile);
  }

  @override
  get cacheDuration(): string {
    if (isDefined(super.cacheDuration)) {
      return super.cacheDuration;
    }
    return "1d";
  }

  protected forceLoadMapItems(): Promise<void> {
    return new Promise<string | Resource | Document | Blob | undefined>(
      (resolve) => {
        if (isDefined(this.kmlString)) {
          const parser = new DOMParser();
          resolve(parser.parseFromString(this.kmlString, "text/xml"));
        } else if (isDefined(this._kmlFile)) {
          if (this._kmlFile.name && this._kmlFile.name.match(kmzRegex)) {
            resolve(this._kmlFile);
          } else {
            resolve(readXml(this._kmlFile));
          }
        } else if (isDefined(this.ionResource)) {
          resolve(this.ionResource);
        } else if (isDefined(this.url)) {
          resolve(proxyCatalogItemUrl(this, this.url));
        } else {
          throw networkRequestError({
            sender: this,
            title: i18next.t("models.kml.unableToLoadItemTitle"),
            message: i18next.t("models.kml.unableToLoadItemMessage")
          });
        }
      }
    )
      .then((kmlLoadInput) => {
        return KmlDataSource.load(kmlLoadInput!);
      })
      .then((dataSource) => {
        this._dataSource = dataSource;
        this.doneLoading(dataSource); // Unsure if this is necessary
      })
      .catch((e) => {
        throw networkRequestError(
          TerriaError.from(e, {
            sender: this,
            title: i18next.t("models.kml.errorLoadingTitle"),
            message: i18next.t("models.kml.errorLoadingMessage", {
              appName: this.terria.appName
            })
          })
        );
      });
  }

  private async generateMultiPathKmlPolygon(
    geomList: MeasurableGeometry[]
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
          <name>${this.name || ""}</name>
            ${polygonsContent}
          </Folder>
        </Document>
      </kml>`;
  }

  private async generateMultiPathKmlLines(
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
    return res.kml;
  }

  private async generateKmlPolygon(
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

    const kml = `<?xml version="1.0" encoding="utf-8"?>
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

    return kml;
  }

  private async generateKmlLines(
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
    return res.kml;
  }

  private async generateKmlPoints(
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
    return res.kml;
  }

  async generateDownloadLinks(
    geom: MeasurableGeometry,
    name: string,
    isMultiPath: boolean,
    geomList?: MeasurableGeometry[],
    ellipsoid?: Ellipsoid
  ): Promise<DownloadLink[]> {
    const downloads: DownloadLink[] = [];

    if (isMultiPath && geomList) {
      const multiPathPolygon = await this.generateMultiPathKmlPolygon(geomList);
      const multiPathLines = await this.generateMultiPathKmlLines(
        geomList,
        name,
        ellipsoid
      );

      downloads.push(
        {
          key: "kmlMultiPathPolygon",
          href: multiPathPolygon
            ? DataUri.make(
                "application/vnd.google-earth.kml+xml;charset=utf-8",
                multiPathPolygon
              )
            : false,
          download: `${name}_polygon_multipath.kml`,
          label: `Multi ${i18next.t("downloadData.polygon")} KML`
        },
        {
          key: "kmlMultiPathLines",
          href: multiPathLines
            ? DataUri.make(
                "application/vnd.google-earth.kml+xml;charset=utf-8",
                multiPathLines
              )
            : false,
          download: `${name}_lines_multipath.kml`,
          label: `Multi ${i18next.t("downloadData.lines")} KML`
        }
      );
    } else {
      const kmlPolygon = await this.generateKmlPolygon(geom, name);
      const kmlLines = await this.generateKmlLines(geom, name, ellipsoid);
      const kmlPoints = await this.generateKmlPoints(geom, name, ellipsoid);

      downloads.push(
        {
          key: "kmlPolygon",
          href: kmlPolygon
            ? DataUri.make(
                "application/vnd.google-earth.kml+xml;charset=utf-8",
                kmlPolygon
              )
            : false,
          download: `${name}_polygon.kml`,
          label: `${i18next.t("downloadData.polygon")} KML`
        },
        {
          key: "kmlLines",
          href: kmlLines
            ? DataUri.make(
                "application/vnd.google-earth.kml+xml;charset=utf-8",
                kmlLines
              )
            : false,
          download: `${name}_lines.kml`,
          label: `${i18next.t("downloadData.lines")} KML`
        },
        {
          key: "kmlPoints",
          href: kmlPoints
            ? DataUri.make(
                "application/vnd.google-earth.kml+xml;charset=utf-8",
                kmlPoints
              )
            : false,
          download: `${name}_points.kml`,
          label: `${i18next.t("downloadData.points")} KML`
        }
      );
    }

    return downloads
      .filter((download) => download.href !== false)
      .filter((download) => {
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

  @computed
  get _canExportData() {
    return isDefined(this._dataSource);
  }

  private async _exportDataFallback() {
    if (isDefined(this._kmlFile)) {
      let name = this._kmlFile.name || this.name || this.uniqueId || "data.kml";
      if (
        !name.toLowerCase().endsWith(".kml") &&
        !name.toLowerCase().endsWith(".kmz")
      ) {
        name = `${name}.kml`;
      }
      return {
        name,
        file: this._kmlFile
      };
    }

    throw new TerriaError({
      sender: this,
      message: "No data available to download."
    });
  }

  protected async _exportData(): Promise<ExportData | undefined> {
    try {
      let action;
      if (this.canUseAsPath) {
        action = Promise.resolve(this.computePath());
      } else {
        action = this.sampleFromKmlData.bind(this)();
      }
      await action;
    } catch (e) {
      return this._exportDataFallback();
    }
  }

  @computed
  get mapItems() {
    if (this.isLoadingMapItems || this._dataSource === undefined) {
      return [];
    }
    this._dataSource.show = this.show;
    return [this._dataSource];
  }

  protected forceLoadMetadata(): Promise<void> {
    return this.loadIonResource();
  }

  private doneLoading(kmlDataSource: KmlDataSource) {
    // Clamp features to terrain.
    if (isDefined(this.terria.cesium)) {
      const positionsToSample: Cartographic[] = [];
      const correspondingCartesians: Cartesian3[] = [];

      const entities = kmlDataSource.entities.values;
      for (let i = 0; i < entities.length; ++i) {
        const entity = entities[i];

        const polygon = entity.polygon;
        if (isDefined(polygon)) {
          polygon.perPositionHeight = true as unknown as Property;
          const polygonHierarchy = getPropertyValue<PolygonHierarchy>(
            polygon.hierarchy
          );
          if (polygonHierarchy) {
            samplePolygonHierarchyPositions(
              polygonHierarchy,
              positionsToSample,
              correspondingCartesians
            );
          }
        }

        // Clamp to ground
        if (isDefined(entity.polyline)) {
          entity.polyline.width = new ConstantProperty(
            this.terria.configParameters.polylineWidth ?? 2
          );
          entity.polyline.clampToGround = new ConstantProperty(true);
          entity.polyline.arcType = new ConstantProperty(ArcType.GEODESIC);
        } else if (isDefined(entity.billboard)) {
          entity.billboard.heightReference = new ConstantProperty(
            HeightReference.CLAMP_TO_GROUND
          );
        }
      }
      const terrainProvider = this.terria.cesium.scene.globe.terrainProvider;
      sampleTerrainMostDetailed(terrainProvider, positionsToSample).then(
        function () {
          for (let i = 0; i < positionsToSample.length; ++i) {
            const position = positionsToSample[i];
            if (!isDefined(position.height)) {
              continue;
            }

            Ellipsoid.WGS84.cartographicToCartesian(
              position,
              correspondingCartesians[i]
            );
          }

          // Force the polygons to be rebuilt.
          for (let i = 0; i < entities.length; ++i) {
            const polygon = entities[i].polygon;
            if (!isDefined(polygon)) {
              continue;
            }

            const existingHierarchy = getPropertyValue<PolygonHierarchy>(
              polygon.hierarchy
            );
            if (existingHierarchy) {
              polygon.hierarchy = new ConstantProperty(
                new PolygonHierarchy(
                  existingHierarchy.positions,
                  existingHierarchy.holes
                )
              );
            }
          }
        }
      );
    }
  }

  @computed
  get canUseAsPath() {
    const entities = this._dataSource?.entities?.values ?? [];
    const polygons = entities.filter((e) => e?.polygon);
    const polylines = entities.filter((e) => e?.polyline);

    if (polygons.length === 1) {
      return this.isPolygonValid(polygons);
    } else if (polylines.length === 1) {
      return this.arePolylinesValid(polylines);
    } else if (polylines.length > 1) {
      return polylines.every((polyline) => this.arePolylinesValid([polyline]));
    } else if (polygons.length > 1) {
      return polygons.every((polygon) => this.isPolygonValid([polygon]));
    } else {
      return false;
    }
  }

  // Checks if the provided polygons are valid by ensuring only one point is connected exactly twice.
  private isPolygonValid(polygons: Entity[]): boolean {
    const pointOccurrences: { point: Cartesian3; count: number }[] = [];
    polygons.forEach((polygon) => {
      const points = this.getPositions(polygon);
      points.forEach((point) =>
        this.updatePointOccurrences(pointOccurrences, point)
      );
    });

    const validPoints = pointOccurrences.filter(
      ({ count }) => count === 2
    ).length;
    return validPoints >= 1;
  }

  // Checks if the provided polylines are valid by ensuring exactly two points are connected only once.
  private arePolylinesValid(polylines: Entity[]): boolean {
    const pointOccurrences: { point: Cartesian3; count: number }[] = [];

    polylines.forEach((polyline) => {
      const points = this.getPositions(polyline);
      this.updatePointOccurrences(pointOccurrences, points[0]);
      this.updatePointOccurrences(pointOccurrences, points[points.length - 1]);
    });

    const validPoints = pointOccurrences.filter(
      ({ count }) => count === 1
    ).length;

    if (validPoints === 2) return true;

    if (validPoints === 0) {
      return pointOccurrences.every(({ count }) => count === 2);
    }

    return false;
  }

  // Updates the occurrences of a given point in the pointOccurrences array.
  private updatePointOccurrences(
    pointOccurrences: { point: Cartesian3; count: number }[],
    point: Cartesian3
  ) {
    const occurrence = pointOccurrences.find((item) =>
      Cartesian3.equals(item.point, point)
    );
    if (occurrence) {
      occurrence.count++;
    } else {
      pointOccurrences.push({ point, count: 1 });
    }
  }

  computePath() {
    const entities = this._dataSource?.entities?.values ?? [];
    const items = entities.filter((e) => e && (e.polygon || e.polyline));
    if (items.length === 0) return;

    items.forEach((element, i) => {
      const description = element.description?.getValue(JulianDate.now());
      let pathNotes = "";
      if (description) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(description, "text/html");
        pathNotes = doc.body.textContent || "";
      }
      const allCoordinates = this.getPositions(element);
      if (allCoordinates.length === 0) return;

      console.log("dataSource:", this._dataSource);
      console.log("entities:", entities);
      console.log("items", items);

      const allCartographics = allCoordinates.map((elem) =>
        Cartographic.fromCartesian(elem)
      );
      const positions = allCartographics;

      const closeLoop =
        !!element.polygon ||
        (allCoordinates.length > 1 &&
          Cartesian3.equals(
            allCoordinates[0],
            allCoordinates[allCoordinates.length - 1]
          ));

      this.asPath(positions, pathNotes, i, closeLoop);
    });
  }

  // Retrieves the positions of an entity, either from a polyline or polygon.
  private getPositions(entity: Entity): Cartesian3[] {
    return (
      entity.polyline?.positions?.getValue(JulianDate.now()) ??
      entity.polygon?.hierarchy?.getValue(JulianDate.now())?.positions ??
      []
    );
  }

  // Orders the given entities based on their positions, ensuring they form a continuous path.
  private orderEntities(entities: Entity[]): Entity[] {
    const ordered: Entity[] = [entities.shift()!];

    while (entities.length > 0) {
      const lastPoint = this.getPositions(ordered[ordered.length - 1]).slice(
        -1
      )[0];
      const index = entities.findIndex((e) =>
        Cartesian3.equals(this.getPositions(e)[0], lastPoint)
      );
      ordered.push(
        index !== -1 ? entities.splice(index, 1)[0] : entities.splice(0, 1)[0]
      );
    }
    return ordered;
  }

  // Filters out duplicate Cartographic coordinates, ensuring only unique coordinates remain.
  private getUniqueCartographics(coordinates: Cartographic[]): Cartographic[] {
    const seen = new Set<string>();
    return coordinates.filter((coord) => {
      const key = `${coord.latitude},${coord.longitude},${coord.height}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  public async sampleFromKmlData(): Promise<void> {
    const entities = this._dataSource?.entities?.values ?? [];
    if (entities.length === 0) return;
    let pathNotes = "";
    let pointDescriptions: string[] = [];
    const folder = entities[0];
    const descriptionValue = folder.description?.getValue(JulianDate.now());

    if (descriptionValue) {
      const parser = new DOMParser();
      const doc = parser.parseFromString(descriptionValue, "text/html");
      pathNotes = doc.body.textContent || "";
    }

    pointDescriptions = (folder as any)._children.map((entity: any) => {
      const descriptionValue = entity.description?.getValue(JulianDate.now());
      if (descriptionValue) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(descriptionValue, "text/html");
        return doc.body.textContent || "";
      }
      return "";
    });

    const cartesianPositions: Cartesian3[] = entities.flatMap(
      (entity) => entity.position?.getValue(JulianDate.now())?.clone() ?? []
    );
    const cartographicPositions = cartesianPositions.map((pos) =>
      Cartographic.fromCartesian(pos)
    );

    if (cartographicPositions.length === 0) return;

    if (!this.terria?.cesium?.scene) return;
    const terrainProvider = this.terria.cesium.scene.terrainProvider;

    const resolvedPositions = cartographicPositions.every(
      (pos) => pos.height < 1
    )
      ? await sampleTerrainMostDetailed(terrainProvider, cartographicPositions)
      : cartographicPositions;

    this.terria.measurableGeometryManager[
      this.terria.measurableGeometryIndex
    ].sampleFromCartographics(
      resolvedPositions,
      false,
      true,
      pointDescriptions,
      pathNotes
    );
  }
}

export default KmlCatalogItem;

function getPropertyValue<T>(property: Property | undefined): T | undefined {
  if (property === undefined) {
    return undefined;
  }
  return property.getValue(JulianDate.now());
}

function samplePolygonHierarchyPositions(
  polygonHierarchy: PolygonHierarchy,
  positionsToSample: Cartographic[],
  correspondingCartesians: Cartesian3[]
) {
  const positions = polygonHierarchy.positions;

  for (let i = 0; i < positions.length; ++i) {
    const position = positions[i];
    correspondingCartesians.push(position);
    positionsToSample.push(Ellipsoid.WGS84.cartesianToCartographic(position));
  }

  const holes = polygonHierarchy.holes;
  for (let i = 0; i < holes.length; ++i) {
    samplePolygonHierarchyPositions(
      holes[i],
      positionsToSample,
      correspondingCartesians
    );
  }
}
