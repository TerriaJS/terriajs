import FunctionParameter, {
  Options as FunctionParameterOptions
} from "./FunctionParameter";
import RegionTypeParameter from "./RegionTypeParameter";

interface Options extends FunctionParameterOptions {
  regionProvider: RegionTypeParameter;
}

export default class RegionParameter extends FunctionParameter {
  readonly type = "region";
  readonly regionProvider: RegionTypeParameter;

  constructor(options: Options) {
    super(options);
    this.regionProvider = options.regionProvider;
  }
}
