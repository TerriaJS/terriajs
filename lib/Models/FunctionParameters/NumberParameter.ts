import { computed, makeObservable, override } from "mobx";
import FunctionParameter, {
  Options as FunctionParameterOptions
} from "./FunctionParameter";
import CatalogFunctionMixin from "../../ModelMixins/CatalogFunctionMixin";

interface Options extends FunctionParameterOptions {
  minimum?: number;
  maximum?: number;
  defaultValue?: number;
}

export default class NumberParameter
  extends FunctionParameter<number>
  implements Options
{
  static readonly type = "number";
  readonly type = "number";
  minimum?: number;
  maximum?: number;
  defaultValue?: number;

  @computed
  get rangeDescription() {
    if (this.minimum !== undefined && this.maximum !== undefined) {
      return `: must be between ${this.minimum} to ${this.maximum}`;
    } else if (this.minimum !== undefined) {
      return `: at least ${this.minimum}`;
    } else if (this.maximum !== undefined) {
      return `: at most ${this.maximum}`;
    } else {
      return "";
    }
  }

  @override get value(): number | undefined {
    return super.value ?? this.defaultValue;
  }

  @override
  get isValid(): boolean {
    return super.value === undefined
      ? this.isValidRange
      : this.isValidRange && super.isValid;
  }

  get isValidRange(): boolean {
    let value =
      this.value !== undefined ? this.value : (this.defaultValue as number);

    if (typeof value === "string") {
      value = parseFloat(value);
    }

    if (this.minimum !== undefined && value < this.minimum) {
      return false;
    }

    if (this.maximum !== undefined && value > this.maximum) {
      return false;
    }

    return true;
  }

  constructor(
    catalogFunction: CatalogFunctionMixin.Instance,
    options: Options
  ) {
    super(catalogFunction, options);
    makeObservable(this);
    this.minimum = options.minimum;
    this.maximum = options.maximum;
    this.defaultValue = options.defaultValue;
  }
}
