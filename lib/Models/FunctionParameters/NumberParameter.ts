import FunctionParameter, {
  Options as FunctionParameterOptions
} from "./FunctionParameter";

interface Options extends FunctionParameterOptions {
  minimum?: number;
  maximum?: number;
}

export default class NumberParameter
  extends FunctionParameter<string>
  implements Options
{
  static readonly type = "number";
  readonly type = "number";
  minimum?: number;
  maximum?: number;
}
