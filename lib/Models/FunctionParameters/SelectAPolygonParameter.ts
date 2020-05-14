import isDefined from "../../Core/isDefined";
import FunctionParameter from "./FunctionParameter";
import { FeatureCollection, Feature } from "geojson";
import { JsonObject } from "../../Core/Json";
/**
 * A parameter that specifies an arbitrary polygon on the globe, which has been selected from a different layer.
 */
export default class SelectAPolygonParameter extends FunctionParameter<
  JsonObject[]
> {
  readonly type = "polygon";

  static formatValueForUrl(value: Feature[]) {
    if (!isDefined(value) || !Array.isArray(value)) {
      return undefined;
    }

    const featureList = value.map(function(featureData: Feature) {
      return {
        type: "Feature",
        geometry: featureData.geometry
      };
    });

    return JSON.stringify({
      type: "FeatureCollection",
      features: featureList
    });
  }

  static getGeoJsonFeature(value: any): JsonObject {
    return value.map(function(featureData: Feature) {
      return {
        type: "Feature",
        geometry: featureData.geometry,
        properties: {}
      };
    }) as any;
  }
}
