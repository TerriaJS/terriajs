import isDefined from "../Core/isDefined";
import FunctionParameter from "./FunctionParameter";

/**
 * A parameter that specifies an arbitrary polygon on the globe, which has been selected from a different layer.
 */
export default class SelectAPolygonParameter extends FunctionParameter {
  readonly type = "polygon";

  static formatValueForUrl(value: any) {
    if (!isDefined(value) || value === "") {
      return undefined;
    }

    const featureList = value.map(function(featureData: any) {
      return {
        type: "Feature",
        crs: featureData.crs,
        geometry: featureData.geometry
      };
    });

    return JSON.stringify({
      type: "FeatureCollection",
      features: featureList
    });
  }

  static getGeoJsonFeature(value: any) {
    return value.map(function(featureData: any) {
      return {
        type: "Feature",
        crs: featureData.crs,
        geometry: featureData.geometry
      };
    });
  }
}
