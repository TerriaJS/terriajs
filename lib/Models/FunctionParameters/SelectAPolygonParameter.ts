import { Feature, Polygon } from "@turf/helpers";
import { computed, isObservableArray } from "mobx";
import { JsonObject } from "../../Core/Json";
import FunctionParameter from "./FunctionParameter";
import { GeoJsonFunctionParameter } from "./GeoJsonParameter";
/**
 * A parameter that specifies an arbitrary polygon on the globe, which has been selected from a different layer.
 */
export default class SelectAPolygonParameter
  extends FunctionParameter<JsonObject[]>
  implements GeoJsonFunctionParameter
{
  readonly type = "polygon";

  static formatValueForUrl(value: Feature[]) {
    if (!(Array.isArray(value) || isObservableArray(value))) {
      return undefined;
    }

    const featureList = value.map(function (featureData: Feature) {
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

  static getGeoJsonFeature(value: any): Feature<Polygon>[] {
    return value.map(function (featureData: Feature) {
      return {
        type: "Feature",
        geometry: featureData.geometry,
        properties: {}
      };
    }) as any;
  }

  @computed get geoJsonFeature() {
    return SelectAPolygonParameter.getGeoJsonFeature(this.value);
  }
}
