import { computed } from "mobx";
import URI from "urijs";
import Constructor from "../Core/Constructor";
import Model from "../Models/Definition/Model";
import UrlTraits from "../Traits/TraitsClasses/UrlTraits";

type UrlModel = Model<UrlTraits>;

function UrlMixin<T extends Constructor<UrlModel>>(Base: T) {
  class UrlMixin extends Base {
    get hasUrlMixin() {
      return true;
    }

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
  export interface Instance extends InstanceType<ReturnType<typeof UrlMixin>> {}
  export function isMixedInto(model: any): model is Instance {
    return model && model.hasUrlMixin;
  }
}

export default UrlMixin;
