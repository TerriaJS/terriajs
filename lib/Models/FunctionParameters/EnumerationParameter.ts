import FunctionParameter, {
  Options as FunctionParameterOptions
} from "./FunctionParameter";
import CatalogFunctionMixin from "../../ModelMixins/CatalogFunctionMixin";
import { autorun, observable, reaction } from "mobx";
import CommonStrata from "../CommonStrata";
import isDefined from "../../Core/isDefined";

interface Options extends FunctionParameterOptions {
  possibleValues: string[];
}

export default class EnumerationParameter extends FunctionParameter<string> {
  readonly type = "enumeration";

  @observable
  readonly possibleValues: string[];

  constructor(catalogFunction: CatalogFunctionMixin, options: Options) {
    super(catalogFunction, options);
    this.possibleValues = options.possibleValues;

    // Set value to something useful if undefined (and a value isRequired)
    reaction(
      () => this.value,
      () => {
        if (
          !isDefined(this.value) &&
          this.isRequired &&
          this.possibleValues.length > 0
        ) {
          this.setValue(CommonStrata.user, this.possibleValues[0]);
        }
      },
      { fireImmediately: true }
    );
  }
}
