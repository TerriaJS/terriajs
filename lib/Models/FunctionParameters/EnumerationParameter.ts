import { computed, observable, reaction } from "mobx";
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

export default class EnumerationParameter extends FunctionParameter<string> {
  static readonly type = "enumeration";
  readonly type = "enumeration";

  @observable
  readonly options: EnumDimensionOption[];

  constructor(catalogFunction: CatalogFunctionMixin, options: Options) {
    super(catalogFunction, options);
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

  @computed
  get isValid(): boolean {
    if (!isDefined(this.value)) {
      return !this.isRequired;
    }

    return isDefined(this.options.find((option) => option.id === this.value));
  }
}
