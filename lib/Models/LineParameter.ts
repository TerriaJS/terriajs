import FunctionParameter from "./FunctionParameter";

type Coordinates = number[];
export type Line = Coordinates[];

export default class LineParameter extends FunctionParameter {
  readonly type = "line";

  /**
   * Process value so that it can be used in an URL.
   */
  static formatValueForUrl(value: Line) {
    return JSON.stringify({
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: {
            type: "LineString",
            coordinates: value
          }
        }
      ]
    });
  }
}
