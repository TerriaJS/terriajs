import Terria from "../Models/Terria";
import { reaction, IReactionDisposer, action, observable } from "mobx";
import Cartographic from "terriajs-cesium/Source/Core/Cartographic";
import Cartesian3 from "terriajs-cesium/Source/Core/Cartesian3";
import EllipsoidGeodesic from "terriajs-cesium/Source/Core/EllipsoidGeodesic";
import sampleTerrainMostDetailed from "terriajs-cesium/Source/Core/sampleTerrainMostDetailed";
import CustomDataSource from "terriajs-cesium/Source/DataSources/CustomDataSource";
import EarthGravityModel1996 from "../Map/Vector/EarthGravityModel1996";

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
}

export default class MeasurableGeometryManager {
  readonly terria: Terria;

  readonly geoidModel: EarthGravityModel1996;

  private disposeSamplingPathStep?: IReactionDisposer;

  @observable geom: MeasurableGeometry | undefined;

  @observable samplingStep: number = 500;

  constructor(terria: Terria) {
    this.terria = terria;

    this.geoidModel = new EarthGravityModel1996(
      require("file-loader!../../wwwroot/data/WW15MGH.DAC")
    );

    this.disposeSamplingPathStep = reaction(
      () => this.samplingStep,
      () => {
        this.sampleFromCartographics(this.geom?.stopPoints ?? []);
      }
    );
  }

  dispose() {
    if (this.disposeSamplingPathStep) {
      this.disposeSamplingPathStep();
    }
  }

  sampleFromCustomDataSource(
    pointEntities: CustomDataSource,
    closeLoop: boolean = false
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
    const cartoPositions = cartesianEntities.map((elem) => {
      return elem.position!.getValue(this.terria.timelineClock.currentTime) ?? Cartesian3.ZERO
    }).filter((elem) => { return !elem.equals(Cartesian3.ZERO); }).map((elem) => {
      return Cartographic.fromCartesian(elem, ellipsoid);
    });

    this.sampleFromCartographics(cartoPositions, closeLoop);
  }

  // sample the entire path (polyline) every "samplingStep" meters
  sampleFromCartographics(
    cartoPositions: Cartographic[],
    closeLoop: boolean = false
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
      while ((y += this.samplingStep) < segmentDistance) {
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
      this.updatePath(
        cartoPositions,
        stopGeodeticDistances,
        stopAirDistances,
        distances3d,
        sampledCartographics[0],
        stepDistances,
        closeLoop
      );
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
    isClosed: boolean
  ) {
    this.geom = {
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
        (sum, current) => sum + current,
        0
      ),
      sampledPoints: sampledPoints,
      sampledDistances: sampledDistances
    };
  }
}