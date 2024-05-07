import { Feature } from "@turf/helpers";
import { computed, observable, makeObservable } from "mobx";
import Cartographic from "terriajs-cesium/Source/Core/Cartographic";
import { JsonObject } from "../../Core/Json";
import CatalogFunctionMixin from "../../ModelMixins/CatalogFunctionMixin";
import FunctionParameter, {
  Options as FunctionParameterOptions
} from "./FunctionParameter";
import LineParameter from "./LineParameter";
import PointParameter, { CartographicPoint } from "./PointParameter";
import PolygonParameter, { PolygonCoordinates } from "./PolygonParameter";
import RegionParameter from "./RegionParameter";
import SelectAPolygonParameter from "./SelectAPolygonParameter";

export interface GeoJsonFunctionParameter {
  geoJsonFeature: Feature | Feature[] | undefined;
}

export function isGeoJsonFunctionParameter(
  fp: any
): fp is GeoJsonFunctionParameter {
  return [
    PointParameter.type,
    LineParameter.type,
    PolygonParameter.type,
    GeoJsonParameter.type
  ].includes(fp.type);
}

interface Options extends FunctionParameterOptions {
  regionParameter: RegionParameter;
}

export default class GeoJsonParameter
  extends FunctionParameter<CartographicPoint | PolygonCoordinates | JsonObject>
  implements GeoJsonFunctionParameter
{
  static readonly type = "geojson";
  readonly type = "geojson";

  static readonly PointType = "point";
  static readonly PolygonType = "polygon";
  static readonly RegionType = "region";
  static readonly SelectAPolygonType = "selectAPolygon";

  @observable
  public subtype?: string;

  readonly regionParameter: RegionParameter;

  constructor(
    catalogFunction: CatalogFunctionMixin.Instance,
    options: Options
  ) {
    super(catalogFunction, options);
    makeObservable(this);
    this.regionParameter = options.regionParameter;
  }

  /**
   * Return representation of value as URL argument.
   */
  getProcessedValue(
    value: Cartographic | PolygonCoordinates | Feature[] | JsonObject
  ) {
    if (this.subtype === GeoJsonParameter.PointType) {
      return {
        inputType: "ComplexData",
        inputValue: PointParameter.formatValueForUrl(value as Cartographic)
      };
    }
    if (this.subtype === GeoJsonParameter.PolygonType) {
      return {
        inputType: "ComplexData",
        inputValue: PolygonParameter.formatValueForUrl(
          value as PolygonCoordinates
        )
      };
    }
    if (this.subtype === GeoJsonParameter.SelectAPolygonType) {
      return {
        inputType: "ComplexData",
        inputValue: SelectAPolygonParameter.formatValueForUrl(
          value as Feature[]
        )
      };
    }
  }

  @computed get geoJsonFeature(): Feature | Feature[] | undefined {
    if (this.subtype === GeoJsonParameter.PointType) {
      return PointParameter.getGeoJsonFeature(this.value as Cartographic);
    }
    if (this.subtype === GeoJsonParameter.PolygonType) {
      return PolygonParameter.getGeoJsonFeature(
        this.value as PolygonCoordinates
      );
    }
    if (this.subtype === GeoJsonParameter.SelectAPolygonType) {
      return SelectAPolygonParameter.getGeoJsonFeature(this.value);
    }

    return;
    // TODO rest
  }
}
