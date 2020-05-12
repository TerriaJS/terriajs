import FunctionParameter, {
  Options as FunctionParameterOptions
} from "./FunctionParameter";
import { observable, computed } from "mobx";
import CatalogFunctionMixin from "../ModelMixins/CatalogFunctionMixin";
import CommonStrata from "./CommonStrata";
import isDefined from "../Core/isDefined";

interface Options extends FunctionParameterOptions {
  /** The name for the "true" value of the boolean parameter. */
  trueName?: string;
  /** The description for the "true" value of the boolean parameter. */
  trueDescription?: string;
  /** The name for the "false" value of the boolean parameter. */
  falseName?: string;
  /** The description for the "false" value of the boolean parameter. */
  falseDescription?: string;
}

export default class BooleanParameter extends FunctionParameter<boolean>
  implements Options {
  readonly type = "boolean";
  readonly trueName?: string;
  readonly trueDescription?: string;
  readonly falseName?: string;
  readonly falseDescription?: string;

  /**
   * Gets a value indicating whether this parameter has names for its "true" and "false" states.
   */
  @computed
  get hasNamedStates() {
    return (
      typeof this.trueName === "string" && typeof this.falseName === "string"
    );
  }

  constructor(catalogFunction: CatalogFunctionMixin, options: Options) {
    super(catalogFunction, options);
    this.trueName = options.trueName;
    this.trueDescription = options.trueDescription;
    this.falseName = options.falseName;
    this.falseDescription = options.falseDescription;

    if (!isDefined(options.value)) {
      this.setValue(CommonStrata.defaults, false)
    }
  }
}
