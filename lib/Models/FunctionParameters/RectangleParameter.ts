import defaultValue from "terriajs-cesium/Source/Core/defaultValue";
import FunctionParameter, {
  Options as FunctionParameterOptions
} from "./FunctionParameter";
import CatalogFunctionMixin from "../../ModelMixins/CatalogFunctionMixin";
import Reproject from "../../Map/Vector/Reproject";

interface Options extends FunctionParameterOptions {
  crs?: string;
}

export type RectangleCoordinates = {
  west: number;
  south: number;
  east: number;
  north: number;
};

export default class RectangleParameter extends FunctionParameter<RectangleCoordinates> {
  static readonly type = "rectangle";
  readonly type = "rectangle";

  readonly crs: string;

  constructor(
    catalogFunction: CatalogFunctionMixin.Instance,
    options: Options
  ) {
    super(catalogFunction, options);
    this.crs = defaultValue(options.crs, Reproject.TERRIA_CRS);
  }
}
