import ErrorServiceProviderMixin from "../../ModelMixins/ErrorServiceProviderMixin";
import { ModelConstructor } from "../Definition/Model";
import ModelFactory from "../Definition/ModelFactory";

class ErrorServiceProviderFactory extends ModelFactory {
  register(
    type: string,
    constructor: ModelConstructor<ErrorServiceProviderMixin.Instance>
  ) {
    super.register(type, constructor);
  }
}

export default new ErrorServiceProviderFactory();
