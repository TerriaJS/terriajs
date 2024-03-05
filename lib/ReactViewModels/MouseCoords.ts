import debounce from "lodash-es/debounce";
import { action, makeObservable, observable, runInAction } from "mobx";
import Cartesian2 from "terriajs-cesium/Source/Core/Cartesian2";
import Cartesian3 from "terriajs-cesium/Source/Core/Cartesian3";
import Cartographic from "terriajs-cesium/Source/Core/Cartographic";
import EllipsoidTerrainProvider from "terriajs-cesium/Source/Core/EllipsoidTerrainProvider";
import CesiumEvent from "terriajs-cesium/Source/Core/Event";
import Intersections2D from "terriajs-cesium/Source/Core/Intersections2D";
import CesiumMath from "terriajs-cesium/Source/Core/Math";
import Ray from "terriajs-cesium/Source/Core/Ray";
import TerrainProvider from "terriajs-cesium/Source/Core/TerrainProvider";
import isDefined from "../Core/isDefined";
import JSEarthGravityModel1996 from "../Map/Vector/EarthGravityModel1996";
import pickTriangle, { PickTriangleResult } from "../Map/Cesium/pickTriangle";
import prettifyCoordinates from "../Map/Vector/prettifyCoordinates";
import prettifyProjection from "../Map/Vector/prettifyProjection";
import Terria from "../Models/Terria";

// TypeScript 3.6.3 can't tell JSEarthGravityModel1996 is a class and reports
//   Cannot use namespace 'JSEarthGravityModel1996' as a type.ts(2709)
// This is a dodgy workaround.
class EarthGravityModel1996 extends JSEarthGravityModel1996 {}

const sampleTerrainMostDetailed =
  require("terriajs-cesium/Source/Core/sampleTerrainMostDetailed").default;

interface Cancelable {
  cancel: () => void;
}

const scratchRay = new Ray();
const scratchV0 = new Cartographic();
const scratchV1 = new Cartographic();
const scratchV2 = new Cartographic();
const scratchIntersection = new Cartographic();
const scratchBarycentric = new Cartesian3();
const scratchCartographic = new Cartographic();
const pickedTriangleScratch: PickTriangleResult = {
  tile: undefined,
  intersection: new Cartesian3(),
  v0: new Cartesian3(),
  v1: new Cartesian3(),
  v2: new Cartesian3()
};

export default class MouseCoords {
  readonly geoidModel: EarthGravityModel1996;
  readonly proj4Projection: string;
  readonly projectionUnits: string;
  readonly proj4longlat: string;
  readonly accurateSamplingDebounceTime: number;
  readonly debounceSampleAccurateHeight: ((
    terrainProvider: TerrainProvider,
    position: Cartographic
  ) => void) &
    Cancelable;
  tileRequestInFlight?: unknown;

  elevation?: string;
  utmZone?: string;
  latitude?: string;
  longitude?: string;
  north?: string;
  east?: string;
  cartographic?: Cartographic;

  @observable useProjection = false;

  updateEvent = new CesiumEvent();

  constructor() {
    makeObservable(this);
    this.geoidModel = new EarthGravityModel1996(
      require("file-loader!../../wwwroot/data/WW15MGH.DAC")
    );
    this.proj4Projection = "+proj=utm +ellps=GRS80 +units=m +no_defs";
    this.projectionUnits = "m";
    this.proj4longlat =
      "+proj=longlat +ellps=WGS84 +datum=WGS84 +units=degrees +no_defs";

    this.accurateSamplingDebounceTime = 250;
    this.tileRequestInFlight = undefined;

    this.debounceSampleAccurateHeight = debounce(
      this.sampleAccurateHeight,
      this.accurateSamplingDebounceTime
    );
  }

  @action.bound
  toggleUseProjection() {
    this.useProjection = !this.useProjection;
    this.updateEvent.raiseEvent();
  }

  @action
  updateCoordinatesFromCesium(terria: Terria, position: Cartesian2) {
    if (!terria.cesium) {
      return;
    }

    const scene = terria.cesium.scene;
    const camera = scene.camera;
    const pickRay = camera.getPickRay(position, scratchRay);
    const globe = scene.globe;
    const pickedTriangle = isDefined(pickRay)
      ? pickTriangle(pickRay, scene, true, pickedTriangleScratch)
      : undefined;
    if (isDefined(pickedTriangle)) {
      // Get a fast, accurate-ish height every time the mouse moves.
      const ellipsoid = globe.ellipsoid;

      const v0 = ellipsoid.cartesianToCartographic(
        pickedTriangle.v0,
        scratchV0
      );
      const v1 = ellipsoid.cartesianToCartographic(
        pickedTriangle.v1,
        scratchV1
      );
      const v2 = ellipsoid.cartesianToCartographic(
        pickedTriangle.v2,
        scratchV2
      );
      const intersection = ellipsoid.cartesianToCartographic(
        pickedTriangle.intersection,
        scratchIntersection
      );
      let errorBar;

      if (globe.terrainProvider instanceof EllipsoidTerrainProvider) {
        intersection.height = 0;
      } else {
        const barycentric = Intersections2D.computeBarycentricCoordinates(
          intersection.longitude,
          intersection.latitude,
          v0.longitude,
          v0.latitude,
          v1.longitude,
          v1.latitude,
          v2.longitude,
          v2.latitude,
          scratchBarycentric
        );

        if (
          barycentric.x >= -1e-15 &&
          barycentric.y >= -1e-15 &&
          barycentric.z >= -1e-15
        ) {
          const height =
            barycentric.x * v0.height +
            barycentric.y * v1.height +
            barycentric.z * v2.height;
          intersection.height = height;
        }

        const geometricError =
          globe.terrainProvider.getLevelMaximumGeometricError(
            pickedTriangle.tile.level
          );
        const approximateHeight = intersection.height;
        const minHeight = Math.max(
          pickedTriangle.tile.data.tileBoundingRegion.minimumHeight,
          approximateHeight - geometricError
        );
        const maxHeight = Math.min(
          pickedTriangle.tile.data.tileBoundingRegion.maximumHeight,
          approximateHeight + geometricError
        );
        const minHeightGeoid =
          minHeight - (this.geoidModel ? this.geoidModel.minimumHeight : 0.0);
        const maxHeightGeoid =
          maxHeight + (this.geoidModel ? this.geoidModel.maximumHeight : 0.0);
        errorBar = Math.max(
          Math.abs(approximateHeight - minHeightGeoid),
          Math.abs(maxHeightGeoid - approximateHeight)
        );
      }
      const terrainProvider = globe.terrainProvider;

      this.cartographicToFields(intersection, errorBar);
      if (!(terrainProvider instanceof EllipsoidTerrainProvider)) {
        this.debounceSampleAccurateHeight(terrainProvider, intersection);
      }
    } else {
      runInAction(() => {
        this.elevation = undefined;
        this.utmZone = undefined;
        this.latitude = undefined;
        this.longitude = undefined;
        this.north = undefined;
        this.east = undefined;
      });
      this.updateEvent.raiseEvent();
    }
  }

  @action
  updateCoordinatesFromLeaflet(terria: Terria, mouseMoveEvent: MouseEvent) {
    if (!terria.leaflet) {
      return;
    }

    const latLng = terria.leaflet.map.mouseEventToLatLng(mouseMoveEvent);
    const coordinates = Cartographic.fromDegrees(
      latLng.lng,
      latLng.lat,
      0,
      scratchCartographic
    );
    this.cartographicToFields(coordinates);
  }

  @action
  cartographicToFields(coordinates: Cartographic, errorBar?: number) {
    this.cartographic = Cartographic.clone(coordinates, scratchCartographic);

    const latitude = CesiumMath.toDegrees(coordinates.latitude);
    const longitude = CesiumMath.toDegrees(coordinates.longitude);

    if (this.useProjection) {
      const prettyProjection = prettifyProjection(
        longitude,
        latitude,
        this.proj4Projection,
        this.proj4longlat,
        this.projectionUnits
      );
      this.utmZone = prettyProjection.utmZone;
      this.north = prettyProjection.north;
      this.east = prettyProjection.east;
    }

    const prettyCoordinate = prettifyCoordinates(longitude, latitude, {
      height: coordinates.height,
      errorBar: errorBar
    });
    this.latitude = prettyCoordinate.latitude;
    this.longitude = prettyCoordinate.longitude;
    this.elevation = prettyCoordinate.elevation;
    this.updateEvent.raiseEvent();
  }

  sampleAccurateHeight(
    terrainProvider: TerrainProvider,
    position: Cartographic
  ) {
    if (this.tileRequestInFlight) {
      // A tile request is already in flight, so reschedule for later.
      this.debounceSampleAccurateHeight.cancel();
      this.debounceSampleAccurateHeight(terrainProvider, position);
      return;
    }

    const positionWithHeight = Cartographic.clone(position);

    const geoidHeightPromise = this.geoidModel
      ? this.geoidModel.getHeight(position.longitude, position.latitude)
      : undefined;
    const terrainPromise = sampleTerrainMostDetailed(terrainProvider, [
      positionWithHeight
    ]);
    this.tileRequestInFlight = Promise.all([geoidHeightPromise, terrainPromise])
      .then((result) => {
        const geoidHeight = result[0] || 0.0;
        this.tileRequestInFlight = undefined;
        if (Cartographic.equals(position, this.cartographic)) {
          position.height = positionWithHeight.height - geoidHeight;
          this.cartographicToFields(position);
        } else {
          // Mouse moved since we started this request, so the result isn't useful.  Try again next time.
        }
      })
      .catch(() => {
        this.tileRequestInFlight = undefined;
      });
  }
}
