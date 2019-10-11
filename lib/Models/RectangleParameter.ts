import { observable } from "mobx";
import defaultValue from "terriajs-cesium/Source/Core/defaultValue";
import Rectangle from "terriajs-cesium/Source/Core/Rectangle";
import FunctionParameter, {
  Options as FunctionParameterOptions
} from "./FunctionParameter";
const Reproject = require("../Map/Reproject");

interface Options extends FunctionParameterOptions {
  crs?: string;
}

export default class RectangleParameter extends FunctionParameter {
  readonly type = "rectangle";

  @observable value?: Rectangle;

  readonly crs: string;

  constructor(options: Options) {
    super(options);
    this.crs = defaultValue(options.crs, Reproject.TERRIA_CRS);
  }
}
