import FunctionParameter, { Options } from "./FunctionParameter";
import { observable, computed, makeObservable } from "mobx";
import isDefined from "../../Core/isDefined";
import { Feature, Polygon } from "geojson";
import { GeoJsonFunctionParameter } from "./GeoJsonParameter";
import CatalogFunctionMixin from "../../ModelMixins/CatalogFunctionMixin";

type Coordinates = number[];
type LinearRing = Coordinates[];
export type PolygonCoordinates = LinearRing[];

export default class PolygonParameter
  extends FunctionParameter<PolygonCoordinates>
  implements GeoJsonFunctionParameter {
  static readonly type = "polygon";
  readonly type = "polygon";

  constructor(
    protected readonly catalogFunction: CatalogFunctionMixin,
    options: Options
  ) {
    super(catalogFunction, options);

    makeObservable(this);
  }

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
