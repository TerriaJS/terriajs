import FunctionParameter from "./FunctionParameter";
import { observable, computed } from "mobx";
import isDefined from "../Core/isDefined";

type Coordinates = number[];
type LinearRing = Coordinates[];
export type Polygon = LinearRing[];

export default class PolygonParameter extends FunctionParameter {
  readonly type = "polygon";

  @observable value?: Polygon;

  static formatValueForUrl(value: Polygon) {
    return JSON.stringify({
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: {
            type: "Polygon",
            coordinates: value
          }
        }
      ]
    });
  }

  static getGeoJsonFeature(value: Polygon) {
    return {
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: value
      }
    };
  }

  @computed get geoJsonFeature() {
    if (isDefined(this.value)) {
      return PolygonParameter.getGeoJsonFeature(this.value);
    }
  }
}
