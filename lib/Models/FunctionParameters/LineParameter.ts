import { Feature, LineString } from "geojson";
import { computed, makeObservable } from "mobx";
import isDefined from "../../Core/isDefined";
import CatalogFunctionMixin from "../../ModelMixins/CatalogFunctionMixin";
import FunctionParameter, { Options } from "./FunctionParameter";
import { GeoJsonFunctionParameter } from "./GeoJsonParameter";

type Coordinates = number[];
export type Line = Coordinates[];

export default class LineParameter extends FunctionParameter<Line>
  implements GeoJsonFunctionParameter {
  static readonly type = "line";
  readonly type = "line";

  constructor(
    protected readonly catalogFunction: CatalogFunctionMixin,
    options: Options
  ) {
    super(catalogFunction, options);

    makeObservable(this);
  }

  static formatValueForUrl(value: Line) {
    return JSON.stringify({
      type: "FeatureCollection",
      features: [LineParameter.getGeoJsonFeature(value)]
    });
  }

  /**
   * Process value so that it can be used in an URL.
   */
  static getGeoJsonFeature(value: Line): Feature<LineString> {
    return {
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: value
      },
      properties: {}
    };
  }

  @computed get geoJsonFeature(): Feature<LineString> | undefined {
    if (isDefined(this.value)) {
      return LineParameter.getGeoJsonFeature(this.value);
    }
  }
}
