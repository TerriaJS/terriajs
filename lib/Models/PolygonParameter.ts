import FunctionParameter from "./FunctionParameter";
import { observable, computed } from "mobx";
import isDefined from "../Core/isDefined";
import { Feature, Polygon } from "geojson";

type Coordinates = number[];
type LinearRing = Coordinates[];
export type PolygonCoordinates = LinearRing[];

export default class PolygonParameter extends FunctionParameter<
  PolygonCoordinates
> {
  readonly type = "polygon";

  static formatValueForUrl(value: PolygonCoordinates) {
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

  static getGeoJsonFeature(value: PolygonCoordinates): Feature<Polygon> {
    return {
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: value
      },
      properties: {}
    };
  }

  @computed get geoJsonFeature() {
    if (isDefined(this.value)) {
      return PolygonParameter.getGeoJsonFeature(this.value);
    }
  }
}
