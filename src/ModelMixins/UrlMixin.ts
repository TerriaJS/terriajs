import { computed, makeObservable } from "mobx";
import URI from "urijs";
import AbstractConstructor from "../Core/AbstractConstructor";
import Model from "../Models/Definition/Model";
import UrlTraits from "../Traits/TraitsClasses/UrlTraits";

type BaseType = Model<UrlTraits>;

function UrlMixin<T extends AbstractConstructor<BaseType>>(Base: T) {
  abstract class UrlMixin extends Base {
    constructor(...args: any[]) {
      super(...args);
      makeObservable(this);
    }

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
