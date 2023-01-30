import { makeObservable, observable, override } from "mobx";
import isDefined from "../../Core/isDefined";
import CatalogFunctionMixin from "../../ModelMixins/CatalogFunctionMixin";
import FunctionParameter, {
  Options as FunctionParameterOptions
} from "./FunctionParameter";

interface Options extends FunctionParameterOptions {
  errorMessage?: boolean;
  value?: string;
}

/**
 * Function Parameter for showing information - this makes no changes to `parameters`, all values are stored locally.
 */
export default class InfoParameter extends FunctionParameter<string> {
  static readonly type = "info";
  readonly type = "info";

  @observable _value: string | undefined;
  _errorMessage = false;

  constructor(
    catalogFunction: CatalogFunctionMixin.Instance,
    options: Options
  ) {
    super(catalogFunction, options);

    makeObservable(this);

    if (isDefined(options.value)) {
      this._value = options.value;
    }

    if (isDefined(options.errorMessage)) {
      this._errorMessage = options.errorMessage;
    }
  }

  @override
  get isValid() {
    return !this._errorMessage;
  }

  @override
  get value(): string | undefined {
    return this._value;
  }

  setValue(strataId: string, v: string) {
    this._value = v;
  }

  clearValue(strataId: string) {
    this._value = undefined;
  }
}
