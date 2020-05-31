import FunctionParameter, {
  Options as FunctionParameterOptions
} from "./FunctionParameter";
import CatalogFunctionMixin from "../../ModelMixins/CatalogFunctionMixin";
import { observable, computed } from "mobx";
import isDefined from "../../Core/isDefined";

interface Options extends FunctionParameterOptions {
  errorMessage?: boolean;
  value?: string;
}

export default class InfoParameter extends FunctionParameter<string> {
  readonly type = "info";

  @observable _value: string | undefined;
  _errorMessage = false;

  constructor(catalogFunction: CatalogFunctionMixin, options: Options) {
    super(catalogFunction, options);

    if (isDefined(options.value)) {
      this._value = options.value;
    }

    if (isDefined(options.errorMessage)) {
      this._errorMessage = options.errorMessage;
    }
  }

  @computed
  get isValid() {
    return !this._errorMessage;
  }

  @computed
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
