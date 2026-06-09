import { Feature, Polygon } from "geojson";
import { computed, makeObservable } from "mobx";
import isDefined from "../../Core/isDefined";
import FunctionParameter, {
  FunctionConstructorParameters
} from "./FunctionParameter";
import { GeoJsonFunctionParameter } from "./GeoJsonParameter";

type Coordinates = number[];
type LinearRing = Coordinates[];
export type PolygonCoordinates = LinearRing[];

export default class PolygonParameter
  extends FunctionParameter<PolygonCoordinates>
  implements GeoJsonFunctionParameter
{
  static readonly type = "polygon";
  readonly type = "polygon";

  constructor(...args: FunctionConstructorParameters) {
    super(...args);
    makeObservable(this);
  }

  static formatValueForUrl(value: PolygonCoordinates) {
    return JSON.stringify({
      type: "FeatureCollection",
      features: [PolygonParameter.getGeoJsonFeature(value)]
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
