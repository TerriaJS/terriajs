import { Feature, LineString } from "@turf/helpers";
import { computed } from "mobx";
import isDefined from "../../Core/isDefined";
import FunctionParameter from "./FunctionParameter";
import { GeoJsonFunctionParameter } from "./GeoJsonParameter";

type Coordinates = number[];
export type Line = Coordinates[];

export default class LineParameter
  extends FunctionParameter<Line>
  implements GeoJsonFunctionParameter
{
  static readonly type = "line";
  readonly type = "line";

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
