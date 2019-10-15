import { observable, computed } from "mobx";
import Cartographic from "terriajs-cesium/Source/Core/Cartographic";
import CesiumMath from "terriajs-cesium/Source/Core/Math";
import FunctionParameter from "./FunctionParameter";
import isDefined from "../Core/isDefined";

export default class PointParameter extends FunctionParameter {
  readonly type = "point";

  @observable value?: Cartographic;

  /**
   * Get feature as geojson for display on map.
   */
  static getGeoJsonFeature(value: Cartographic) {
    var coordinates = [
      CesiumMath.toDegrees(value.longitude),
      CesiumMath.toDegrees(value.latitude),
      value.height
    ];

    return {
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: coordinates
      }
    };
  }

  /**
   * Process value so that it can be used in an URL.
   */
  static formatValueForUrl(value: Cartographic) {
    return JSON.stringify({
      type: "FeatureCollection",
      features: [PointParameter.getGeoJsonFeature(value)]
    });
  }

  @computed get geoJsonFeature() {
    if (isDefined(this.value)) {
      return PointParameter.getGeoJsonFeature(this.value);
    }
  }
}
