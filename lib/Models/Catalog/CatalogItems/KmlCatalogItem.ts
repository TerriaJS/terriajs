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

const kmzRegex = /\.kmz$/i;

class KmlCatalogItem
  extends MeasurableGeometryMixin(
    MappableMixin(
      UrlMixin(
        CesiumIonMixin(CatalogMemberMixin(CreateModel(KmlCatalogItemTraits)))
      )
    )
  )
  implements HasLocalData
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

    if (polygons.length > 0) {
      return this.isPolygonValid(polygons) || this.arePolylinesValid(polygons);
    } else if (polylines.length > 0) {
      return (
        this.isPolygonValid(polylines) || this.arePolylinesValid(polylines)
      );
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
    return validPoints === 1;
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

    return validPoints === 2;
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
    const polygons = entities.filter((e) => e && e.polygon);
    const polylines = entities.filter((e) => e && e.polyline);
    const items = [...polygons, ...polylines];
    if (items.length === 0) return;

    const firstItem = items[0];
    const description = firstItem.description?.getValue(JulianDate.now());

    let name = "";
    let pathNotes = "";

    if (description) {
      const parser = new DOMParser();
      const doc = parser.parseFromString(description, "text/html");
      name = firstItem.name || "";
      pathNotes = doc.body.textContent || "";
    }

    const allCoordinates =
      items.length === 1
        ? this.getPositions(firstItem)
        : this.orderEntities(items).flatMap(this.getPositions);

    const allCartographics = allCoordinates.map((elem) =>
      Cartographic.fromCartesian(elem)
    );

    /*const positions =
      polylines.length > 0
        ? this.getUniqueCartographics(allCartographics)
        : allCartographics;*/
    const positions = allCartographics;
    this.asPath(positions, name, pathNotes);
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
    let name = "";
    let pathNotes = "";
    let pointDescriptions: string[] = [];
    const folder = entities[0];
    const descriptionValue = folder.description?.getValue(JulianDate.now());

    if (descriptionValue) {
      const parser = new DOMParser();
      const doc = parser.parseFromString(descriptionValue, "text/html");
      name = folder.name || "";
      pathNotes = doc.body.textContent || "";
    }

    pointDescriptions = (folder as any)._children.map(
      (entity: any, index: number) => {
        const descriptionValue = entity.description?.getValue(JulianDate.now());
        if (descriptionValue) {
          const parser = new DOMParser();
          const doc = parser.parseFromString(descriptionValue, "text/html");
          return doc.body.textContent || "";
        }
        return "";
      }
    );

    let cartesianPositions: Cartesian3[] = entities.flatMap(
      (entity) => entity.position?.getValue(JulianDate.now())?.clone() ?? []
    );
    const cartographicPositions = cartesianPositions.map((pos) =>
      Cartographic.fromCartesian(pos)
    );

    if (!this.terria?.cesium?.scene) return;
    const terrainProvider = this.terria.cesium.scene.terrainProvider;

    const resolvedPositions = cartographicPositions.every(
      (pos) => pos.height < 1
    )
      ? await sampleTerrainMostDetailed(terrainProvider, cartographicPositions)
      : cartographicPositions;

    this.terria.measurableGeometryManager.sampleFromCartographics(
      resolvedPositions,
      false,
      true,
      pointDescriptions,
      name,
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
