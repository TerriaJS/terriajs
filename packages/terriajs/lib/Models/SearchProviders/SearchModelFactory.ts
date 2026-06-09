import LocationSearchProviderMixin from "../../ModelMixins/SearchProviders/LocationSearchProviderMixin";
import { ModelConstructor } from "../Definition/Model";
import ModelFactory from "../Definition/ModelFactory";

export class SearchModelFactory extends ModelFactory {
  register(
    type: string,
    constructor: ModelConstructor<LocationSearchProviderMixin.Instance>
  ) {
    super.register(type, constructor);
  }
}
