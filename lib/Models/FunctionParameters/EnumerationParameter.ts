import { makeObservable, observable, override, reaction } from "mobx";
import isDefined from "../../Core/isDefined";
import CatalogFunctionMixin from "../../ModelMixins/CatalogFunctionMixin";
import CommonStrata from "../Definition/CommonStrata";
import { EnumDimensionOption } from "../SelectableDimensions/SelectableDimensions";
import FunctionParameter, {
  Options as FunctionParameterOptions
} from "./FunctionParameter";

interface Options extends FunctionParameterOptions {
  options: EnumDimensionOption[];
}

export default class EnumerationParameter extends FunctionParameter<
  string | string[]
> {
  static readonly type = "enumeration";
  readonly type = "enumeration";

  @observable
  readonly options: EnumDimensionOption[];

  constructor(
    catalogFunction: CatalogFunctionMixin.Instance,
    options: Options
  ) {
    super(catalogFunction, options);
    makeObservable(this);
    this.options = options.options;

    // Set value to something useful if undefined (and a value isRequired)
    reaction(
      () => this.value,
      () => {
        if (
          !isDefined(this.value) &&
          this.isRequired &&
          this.options?.[0]?.id
        ) {
          this.setValue(CommonStrata.user, this.options[0].id);
        }
      },
      { fireImmediately: true }
    );
  }

  @override
  get isValid(): boolean {
    const isMultiValued = this.maxOccurs !== undefined && this.maxOccurs > 1;
    const isEmpty =
      this.value === undefined ||
      (isMultiValued
        ? Array.isArray(this.value) && this.value.length === 0
        : false);

    if (isEmpty) {
      return !this.isRequired;
    }

    const values = Array.isArray(this.value) ? this.value : [this.value];
    if (this.maxOccurs !== undefined && values.length > this.maxOccurs) {
      // more values selected than allowed by maxOccurs
      return false;
    }

    const validValues = this.options.map((opt) => opt.id);
    const allValuesValid = values.every((value) => validValues.includes(value));
    return allValuesValid;
  }
}
