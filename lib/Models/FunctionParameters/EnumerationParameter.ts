import FunctionParameter, {
  Options as FunctionParameterOptions
} from "./FunctionParameter";
import CatalogFunctionMixin from "../../ModelMixins/CatalogFunctionMixin";

interface Options extends FunctionParameterOptions {
  possibleValues: string[];
}

export default class EnumerationParameter extends FunctionParameter<string> {
  readonly type = "enumeration";
  readonly possibleValues: string[];

  constructor(catalogFunction: CatalogFunctionMixin, options: Options) {
    super(catalogFunction, options);
    this.possibleValues = options.possibleValues;
  }
}
