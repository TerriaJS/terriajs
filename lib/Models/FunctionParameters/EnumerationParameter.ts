import FunctionParameter, {
  Options as FunctionParameterOptions
} from "./FunctionParameter";
import CatalogFunctionMixin from "../../ModelMixins/CatalogFunctionMixin";
import { autorun, observable } from "mobx";
import CommonStrata from "../CommonStrata";
import isDefined from "../../Core/isDefined";
import runLater from "../../Core/runLater";

interface Options extends FunctionParameterOptions {
  possibleValues: string[];
}

export default class EnumerationParameter extends FunctionParameter<string> {
  readonly type = "enumeration";

  readonly possibleValues: string[];

  constructor(catalogFunction: CatalogFunctionMixin, options: Options) {
    super(catalogFunction, options);
    this.possibleValues = options.possibleValues;

    autorun(() => {
      // Clear value if no possibleValues
      if (this.possibleValues.length === 0) {
        this.clearValue(CommonStrata.user);
        // If value is invalid -> clear value
      } else if (
        isDefined(this.value) &&
        !this.possibleValues.includes(this.value)
      ) {
        this.clearValue(CommonStrata.user);
      }
    });
  }
}
