import Cartographic from "terriajs-cesium/Source/Core/Cartographic";
import FunctionParameter, {
  Options as FunctionParameterOptions
} from "./FunctionParameter";
import PointParameter from "./PointParameter";
import RegionParameter from "./RegionParameter";
import PolygonParameter, { Polygon } from "./PolygonParameter";
import { computed } from "mobx";

interface Options extends FunctionParameterOptions {
  regionParameter: RegionParameter;
}

export default class GeoJsonParameter extends FunctionParameter {
  readonly type = "geojson";

  static readonly PointType = "point";
  static readonly PolygonType = "polygon";
  static readonly RegionType = "region";
  static readonly SelectAPolygonType = "selectAPolygon";

  subtype?: string;
  readonly regionParameter: RegionParameter;

  constructor(options: Options) {
    super(options);
    this.regionParameter = options.regionParameter;
  }

  /**
   * Return representation of value as URL argument.
   */
  getProcessedValue(value: unknown) {
    if (this.subtype === GeoJsonParameter.PointType) {
      return {
        inputType: "ComplexData",
        inputValue: PointParameter.formatValueForUrl(<Cartographic>value)
      };
    }
    if (this.subtype === GeoJsonParameter.PolygonType) {
      return {
        inputType: "ComplexData",
        inputValue: PolygonParameter.formatValueForUrl(<Polygon>value)
      };
    }
  }

  @computed get geoJsonFeature() {
    if (this.subtype === GeoJsonParameter.PointType) {
      return PointParameter.getGeoJsonFeature(<Cartographic>this.value);
    }
    if (this.subtype === GeoJsonParameter.PolygonType) {
      return PolygonParameter.getGeoJsonFeature(<Polygon>this.value);
    }
    // TODO rest
  }
}
