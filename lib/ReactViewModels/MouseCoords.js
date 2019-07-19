import Cartographic from "terriajs-cesium/Source/Core/Cartographic";
import CesiumMath from "terriajs-cesium/Source/Core/Math";
import debounce from "lodash.debounce";
import defined from "terriajs-cesium/Source/Core/defined";
import EarthGravityModel1996 from "../Map/EarthGravityModel1996";
import EllipsoidTerrainProvider from "terriajs-cesium/Source/Core/EllipsoidTerrainProvider";
import Intersections2D from "terriajs-cesium/Source/Core/Intersections2D";
import knockout from "terriajs-cesium/Source/ThirdParty/knockout";
import prettifyCoordinates from "../Map/prettifyCoordinates";
import prettifyProjection from "../Map/prettifyProjection";
import sampleTerrainMostDetailed from "terriajs-cesium/Source/Core/sampleTerrainMostDetailed";
import when from "terriajs-cesium/Source/ThirdParty/when";

export default class MouseCoords {
  constructor() {
    this.geoidModel = new EarthGravityModel1996(
      require("file-loader!../../wwwroot/data/WW15MGH.DAC")
    );
    this.proj4Projection = "+proj=utm +ellps=GRS80 +units=m +no_defs";
    this.projectionUnits = "m";
    this.proj4longlat =
      "+proj=longlat +ellps=WGS84 +datum=WGS84 +units=degrees +no_defs";

    this.lastHeightSamplePosition = new Cartographic();
    this.accurateSamplingDebounceTime = 250;
    this.tileRequestInFlight = undefined;

    this.elevation = undefined;
    this.utmZone = undefined;
    this.latitude = undefined;
    this.longitude = undefined;
    this.north = undefined;
    this.east = undefined;
    this.useProjection = false;
    this.debounceSampleAccurateHeight = debounce(
      this.sampleAccurateHeight,
      this.accurateSamplingDebounceTime
    );

    knockout.track(this, [
      "elevation",
      "utmZone",
      "latitude",
      "longitude",
      "north",
      "east",
      "useProjection"
    ]);
  }

  toggleUseProjection() {
    this.useProjection = !this.useProjection;
  }

  updateCoordinatesFromCesium(terria, position) {
    const scene = terria.cesium.scene;
    const camera = scene.camera;
    const pickRay = camera.getPickRay(position);
    const globe = scene.globe;
    const pickedTriangle = globe.pickTriangle(pickRay, scene);
    if (defined(pickedTriangle)) {
      // Get a fast, accurate-ish height every time the mouse moves.
      const ellipsoid = globe.ellipsoid;

      const v0 = ellipsoid.cartesianToCartographic(pickedTriangle.v0);
      const v1 = ellipsoid.cartesianToCartographic(pickedTriangle.v1);
      const v2 = ellipsoid.cartesianToCartographic(pickedTriangle.v2);
      const intersection = ellipsoid.cartesianToCartographic(
        pickedTriangle.intersection
      );
      let errorBar;

      if (globe.terrainProvider instanceof EllipsoidTerrainProvider) {
        intersection.height = undefined;
      } else {
        const barycentric = Intersections2D.computeBarycentricCoordinates(
          intersection.longitude,
          intersection.latitude,
          v0.longitude,
          v0.latitude,
          v1.longitude,
          v1.latitude,
          v2.longitude,
          v2.latitude
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

        const geometricError = globe.terrainProvider.getLevelMaximumGeometricError(
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
      Cartographic.clone(intersection, this.lastHeightSamplePosition);
      const terrainProvider = globe.terrainProvider;

      this.cartographicToFields(intersection, errorBar);
      if (!(terrainProvider instanceof EllipsoidTerrainProvider)) {
        this.debounceSampleAccurateHeight(terrainProvider, intersection);
      }
    } else {
      this.elevation = undefined;
      this.utmZone = undefined;
      this.latitude = undefined;
      this.longitude = undefined;
      this.north = undefined;
      this.east = undefined;
    }
  }

  updateCoordinatesFromLeaflet(terria, mouseMoveEvent) {
    const latLng = terria.leaflet.map.mouseEventToLatLng(mouseMoveEvent);
    const coordinates = Cartographic.fromDegrees(latLng.lng, latLng.lat);
    coordinates.height = undefined;
    this.cartographicToFields(coordinates);
  }

  cartographicToFields(coordinates, errorBar) {
    const latitude = CesiumMath.toDegrees(coordinates.latitude);
    const longitude = CesiumMath.toDegrees(coordinates.longitude);

    if (this.useProjection) {
      var prettyProjection = prettifyProjection(
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

    var prettyCoordinate = prettifyCoordinates(longitude, latitude, {
      height: coordinates.height,
      errorBar: errorBar
    });
    this.latitude = prettyCoordinate.latitude;
    this.longitude = prettyCoordinate.longitude;
    this.elevation = prettyCoordinate.elevation;
  }

  sampleAccurateHeight(terrainProvider, position) {
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
    this.tileRequestInFlight = when.all(
      [geoidHeightPromise, terrainPromise],
      result => {
        const geoidHeight = result[0] || 0.0;
        this.tileRequestInFlight = undefined;
        if (Cartographic.equals(position, this.lastHeightSamplePosition)) {
          position.height = positionWithHeight.height - geoidHeight;
          this.cartographicToFields(position);
        } else {
          // Mouse moved since we started this request, so the result isn't useful.  Try again next time.
        }
      },
      () => {
        this.tileRequestInFlight = undefined;
      }
    );
  }
}
