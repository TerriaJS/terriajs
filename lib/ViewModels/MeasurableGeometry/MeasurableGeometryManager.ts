import Terria from "../../Models/Terria";
import { action, makeObservable } from "mobx";
import Cartographic from "terriajs-cesium/Source/Core/Cartographic";
import Cartesian3 from "terriajs-cesium/Source/Core/Cartesian3";
import EllipsoidGeodesic from "terriajs-cesium/Source/Core/EllipsoidGeodesic";
import sampleTerrainMostDetailed from "terriajs-cesium/Source/Core/sampleTerrainMostDetailed";
import CustomDataSource from "terriajs-cesium/Source/DataSources/CustomDataSource";
import EarthGravityModel1996 from "../../Map/Vector/EarthGravityModel1996";
import { JsonObject } from "../../Core/Json";

export interface MeasurableGeometry {
  isClosed: boolean;
  hasArea: boolean;
  stopPoints: Cartographic[];
  stopGeodeticDistances: number[];
  stopAirDistances?: number[];
  stopGroundDistances?: number[];
  geodeticDistance?: number;
  airDistance?: number;
  groundDistance?: number;
  sampledPoints?: Cartographic[];
  sampledDistances?: number[];
  geodeticArea?: number;
  airArea?: number;
  onlyPoints?: boolean;
  pointDescriptions?: string[];
  showDistanceLabels?: boolean;
  pathNotes?: string;
  isFileUploaded?: boolean;
  isPointAdding?: boolean;
  indexPath?: number;
  featureProperties?: JsonObject;
  pointProperties?: JsonObject[];
}

export default class MeasurableGeometryManager {
  readonly terria: Terria;

  readonly geoidModel: EarthGravityModel1996;

  constructor(terria: Terria) {
    makeObservable(this);
    this.terria = terria;
    this.geoidModel = new EarthGravityModel1996(
      require("file-loader!../../../wwwroot/data/WW15MGH.DAC")
    );
  }

  resample() {
    this.sampleFromCartographics(
      this.terria.measurableGeomList[this.terria.measurableGeometryIndex]
        ?.stopPoints ?? [],
      this.terria.measurableGeomList[this.terria.measurableGeometryIndex]
        ?.isClosed,
      this.terria.measurableGeomList[this.terria.measurableGeometryIndex]
        ?.onlyPoints,
      this.terria.measurableGeomList[this.terria.measurableGeometryIndex]
        ?.pointDescriptions,
      this.terria.measurableGeomList[this.terria.measurableGeometryIndex]
        ?.pathNotes,
      this.terria.measurableGeomList[this.terria.measurableGeometryIndex]
        ?.isFileUploaded,
      this.terria.measurableGeomList[this.terria.measurableGeometryIndex]
        ?.indexPath,
      this.terria.measurableGeomList[this.terria.measurableGeometryIndex]
        ?.featureProperties,
      this.terria.measurableGeomList[this.terria.measurableGeometryIndex]
        ?.pointProperties
    );
  }

  sampleFromCustomDataSource(
    pointEntities: CustomDataSource,
    closeLoop: boolean = false,
    onlyPoints: boolean = false,
    pointDescriptions?: string[],
    pathNotes?: string,
    isFileUploaded?: boolean
  ) {
    const ellipsoid = this.terria.cesium?.scene.globe.ellipsoid;
    if (!ellipsoid) {
      return;
    }

    // extract valid points from CustomDataSource
    const cartesianEntities = pointEntities.entities.values.filter(
      (elem) => elem?.position !== undefined && elem?.position !== null
    );
    // if the path is a closed loop add the first point also as last point
    if (closeLoop && pointEntities.entities.values.length > 0) {
      cartesianEntities.push(pointEntities.entities.values[0]);
    }
    // convert from cartesian to cartographic because "sampleTerrainMostDetailed" work with cartographic
    const cartoPositions = cartesianEntities
      .map((elem) => {
        return (
          elem.position!.getValue(this.terria.timelineClock.currentTime) ??
          Cartesian3.ZERO
        );
      })
      .filter((elem) => {
        return !elem.equals(Cartesian3.ZERO);
      })
      .map((elem) => {
        return Cartographic.fromCartesian(elem, ellipsoid);
      });

    this.sampleFromCartographics(
      cartoPositions,
      closeLoop,
      onlyPoints,
      pointDescriptions,
      pathNotes,
      isFileUploaded
    );
  }

  // sample the entire path (polyline) every "samplingStep" meters
  @action
  sampleFromCartographics(
    cartoPositions: Cartographic[],
    closeLoop: boolean = false,
    onlyPoints: boolean = false,
    pointDescriptions: string[] = [],
    pathNotes?: string,
    isFileUploaded?: boolean,
    indexPath?: number,
    featureProperties?: JsonObject,
    pointProperties?: JsonObject[]
  ) {
    const terrainProvider = this.terria.cesium?.scene.terrainProvider;
    const ellipsoid = this.terria.cesium?.scene.globe.ellipsoid;

    if (!terrainProvider || !ellipsoid) {
      return;
    }

    // index of the original stops in the new array of sampling points
    const originalStopsIndex: number[] = [0];
    // geodetic distance between two stops
    const stopGeodeticDistances: number[] = [0];

    // compute sampling points every "samplingStep" meters
    const interpolatedCartographics = [cartoPositions[0]];
    for (let i = 0; i < cartoPositions.length - 1; ++i) {
      const geodesic = new EllipsoidGeodesic(
        cartoPositions[i],
        cartoPositions[i + 1],
        ellipsoid
      );
      const segmentDistance = geodesic.surfaceDistance;
      stopGeodeticDistances.push(segmentDistance);
      let y = 0;
      while ((y += this.terria.measurableGeomSamplingStep) < segmentDistance) {
        interpolatedCartographics.push(
          geodesic.interpolateUsingSurfaceDistance(y)
        );
      }
      // original points have to be used
      originalStopsIndex.push(interpolatedCartographics.length);
      interpolatedCartographics.push(cartoPositions[i + 1]);
    }

    // sample points on terrain
    const terrainPromises = [
      sampleTerrainMostDetailed(terrainProvider, interpolatedCartographics)
    ];
    if (this.terria.configParameters.useElevationMeanSeaLevel) {
      terrainPromises.push(
        this.geoidModel.getHeights(interpolatedCartographics)
      );
    }
    Promise.all(terrainPromises).then((sampledCartographics) => {
      if (sampledCartographics.length === 2) {
        const geoidHeights = sampledCartographics[1];
        sampledCartographics[0].forEach(
          (elem, i) => (elem.height -= geoidHeights[i].height)
        );
      }

      const sampledCartesians = ellipsoid.cartographicArrayToCartesianArray(
        sampledCartographics[0]
      );

      // compute distances
      const stepDistances: number[] = [];
      for (let i = 0; i < sampledCartesians.length; ++i) {
        const dist: number =
          i > 0
            ? Cartesian3.distance(
                sampledCartesians[i - 1],
                sampledCartesians[i]
              )
            : 0;
        stepDistances.push(dist);
      }

      const stopAirDistances: number[] = [0];
      const distances3d: number[] = [0];
      for (let i = 0; i < originalStopsIndex.length - 1; ++i) {
        cartoPositions[i].height =
          sampledCartographics[0][originalStopsIndex[i]].height;

        stopAirDistances.push(
          Cartesian3.distance(
            sampledCartesians[originalStopsIndex[i + 1]],
            sampledCartesians[originalStopsIndex[i]]
          )
        );
        distances3d.push(
          stepDistances
            .filter(
              (_, index) =>
                index > originalStopsIndex[i] &&
                index <= originalStopsIndex[i + 1]
            )
            .reduce((sum: number, current: number) => sum + current, 0)
        );
      }

      // update state of Terria
      const updatePathParams: Parameters<typeof this.updatePath> = onlyPoints
        ? [
            cartoPositions,
            [],
            [],
            [],
            sampledCartographics[0],
            [],
            closeLoop,
            true,
            pointDescriptions,
            pathNotes,
            isFileUploaded,
            indexPath,
            featureProperties,
            pointProperties
          ]
        : [
            cartoPositions,
            stopGeodeticDistances,
            stopAirDistances,
            distances3d,
            sampledCartographics[0],
            stepDistances,
            closeLoop,
            false,
            [],
            pathNotes,
            isFileUploaded,
            indexPath,
            featureProperties,
            pointProperties
          ];

      this.updatePath(...updatePathParams);
    });
  }

  @action
  updatePath(
    stopPoints: Cartographic[],
    stopGeodeticDistances: number[],
    stopAirDistances: number[],
    stopGroundDistances: number[],
    sampledPoints: Cartographic[],
    sampledDistances: number[],
    isClosed: boolean,
    onlyPoints: boolean = false,
    pointDescriptions: string[] = [],
    pathNotes?: string,
    isFileUploaded?: boolean,
    indexPath?: number,
    featureProperties?: JsonObject,
    pointProperties?: JsonObject[]
  ) {
    let geodeticArea = 0;
    let airArea = 0;

    if (isClosed && stopPoints.length >= 3 && !onlyPoints) {
      geodeticArea = this.calculateGeodeticArea(stopPoints);
      airArea = this.calculateAirArea(stopPoints);
    }

    const newGeometry = {
      isClosed: isClosed,
      hasArea: false,
      stopPoints: stopPoints,
      stopGeodeticDistances: stopGeodeticDistances,
      stopAirDistances: stopAirDistances,
      stopGroundDistances: stopGroundDistances,
      geodeticDistance: stopGeodeticDistances.reduce(
        (sum: number, current: number) => sum + current,
        0
      ),
      airDistance: stopAirDistances.reduce((sum, current) => sum + current, 0),
      groundDistance: stopGroundDistances.reduce(
        (sum: number, current: number) => sum + current,
        0
      ),
      sampledPoints: sampledPoints,
      sampledDistances: sampledDistances,
      airArea: airArea,
      geodeticArea: geodeticArea,
      onlyPoints: onlyPoints,
      pointDescriptions: pointDescriptions,
      pathNotes: pathNotes,
      isFileUploaded: isFileUploaded,
      indexPath: indexPath,
      featureProperties: featureProperties,
      pointProperties: pointProperties
    };

    if (indexPath !== undefined) {
      while (this.terria.measurableGeomList.length < indexPath) {
        this.terria.measurableGeomList.push(newGeometry);
      }
      this.terria.measurableGeomList[indexPath] = newGeometry;
    } else if (
      this.terria.measurableGeomList[this.terria.measurableGeometryIndex]
    ) {
      this.terria.measurableGeomList[this.terria.measurableGeometryIndex] =
        newGeometry;
    } else {
      this.terria.measurableGeomList.push(newGeometry);
    }
  }

  public calculateGeodeticArea(stopPoints: Cartographic[]): number {
    if (stopPoints.length < 3) return 0;

    const ellipsoid = this.terria.cesium?.scene.globe.ellipsoid;
    if (!ellipsoid) return 0;

    let totalArea = 0;

    for (let i = 1; i < stopPoints.length - 1; i++) {
      const p1 = stopPoints[0];
      const p2 = stopPoints[i];
      const p3 = stopPoints[i + 1];

      const geo12 = new EllipsoidGeodesic(p1, p2, ellipsoid);
      const geo23 = new EllipsoidGeodesic(p2, p3, ellipsoid);
      const geo31 = new EllipsoidGeodesic(p3, p1, ellipsoid);

      const a = geo12.surfaceDistance;
      const b = geo23.surfaceDistance;
      const c = geo31.surfaceDistance;

      const s = (a + b + c) / 2.0;
      const triangleArea = Math.sqrt(s * (s - a) * (s - b) * (s - c));

      if (!isNaN(triangleArea)) {
        totalArea += triangleArea;
      }
    }

    return totalArea;
  }

  private calculateAirArea(stopPoints: Cartographic[]): number {
    if (stopPoints.length < 3) return 0;

    const ellipsoid = this.terria.cesium?.scene.globe.ellipsoid;
    if (!ellipsoid) return 0;

    const cartesianPoints = stopPoints.map((point) =>
      Cartographic.toCartesian(point, ellipsoid)
    );

    let totalArea = 0;

    for (let i = 1; i < cartesianPoints.length - 1; i++) {
      const p1 = cartesianPoints[0];
      const p2 = cartesianPoints[i];
      const p3 = cartesianPoints[i + 1];

      const a = Cartesian3.distance(p1, p2);
      const b = Cartesian3.distance(p2, p3);
      const c = Cartesian3.distance(p3, p1);

      const s = (a + b + c) / 2.0;
      const triangleArea = Math.sqrt(s * (s - a) * (s - b) * (s - c));

      if (!isNaN(triangleArea)) {
        totalArea += triangleArea;
      }
    }

    return totalArea;
  }
}
