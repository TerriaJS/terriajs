import { computed } from "mobx";
import URI from "urijs";
import Constructor from "../Core/Constructor";
import Model from "../Models/Model";
import UrlTraits from "../Traits/UrlTraits";

type UrlModel = Model<UrlTraits>;

function UrlMixin<T extends Constructor<UrlModel>>(Base: T) {
  class UrlMixin extends Base {
    @computed
    get uri(): uri.URI | undefined {
      if (this.url === undefined) {
        return undefined;
      }
      return new URI(this.url);
    }
  }

  return UrlMixin;
}

namespace UrlMixin {
  export interface UrlMixin extends InstanceType<ReturnType<typeof UrlMixin>> {}
  export function isMixedInto(model: any): model is UrlMixin {
    return model && model.isGroup;
  }
}

export default UrlMixin;
