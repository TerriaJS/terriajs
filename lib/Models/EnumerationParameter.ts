import FunctionParameter, {
  Options as FunctionParameterOptions
} from "./FunctionParameter";

interface Options extends FunctionParameterOptions {
  possibleValues: string[];
}

export default class EnumerationParameter extends FunctionParameter {
  readonly type = "enumeration";
  readonly possibleValues: string[];

  constructor(options: Options) {
    super(options);
    this.possibleValues = options.possibleValues;
  }
}
