import FunctionParameter, {
  Options as FunctionParameterOptions
} from "./FunctionParameter";
import RegionTypeParameter from "./RegionTypeParameter";
import CatalogFunctionMixin from "../../ModelMixins/CatalogFunctionMixin";

interface Options extends FunctionParameterOptions {
  regionProvider: RegionTypeParameter;
}

export default class RegionParameter extends FunctionParameter {
  static readonly type = "region";
  readonly type = "region";
  readonly regionProvider: RegionTypeParameter;

  constructor(catalogFunction: CatalogFunctionMixin, options: Options) {
    super(catalogFunction, options);
    this.regionProvider = options.regionProvider;
  }
}
