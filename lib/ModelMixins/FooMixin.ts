import { computed } from "mobx";
import AbstractConstructor from "../Core/AbstractConstructor";
import Constructor from "../Core/Constructor";
import Model from "../Models/Definition/Model";
import mixTraits from "../Traits/mixTraits";
import CatalogMemberTraits from "../Traits/TraitsClasses/CatalogMemberTraits";
import MappableTraits from "../Traits/TraitsClasses/MappableTraits";
import ShadowTraits from "../Traits/TraitsClasses/ShadowTraits";
import UrlTraits from "../Traits/TraitsClasses/UrlTraits";
import MappableMixin from "./MappableMixin";
import UrlMixin from "./UrlMixin";

class DashTraits extends mixTraits(ShadowTraits) {}

class FooTraits extends mixTraits(
  MappableTraits,
  CatalogMemberTraits,
  UrlTraits,
  DashTraits
) {}

interface IFoo {
  bar: boolean;
}

interface IDash {
  canIDash(): void;
}

function DashMixin<T extends Constructor<Model<DashTraits>>>(
  Base: T
): T & AbstractConstructor<IDash> {
  abstract class Dash extends Base implements IDash {
    canIDash() {}
  }
  return Dash;
}

export default function FooMixin<T extends Constructor<Model<FooTraits>>>(
  Base: T
): T & AbstractConstructor<IFoo> {
  class Foo extends UrlMixin(DashMixin(MappableMixin(Base))) implements IFoo {
    @computed
    get url() {
      this.cesiumRectangle;
      return "foo://dash";
    }

    @computed
    get cacheDuration() {
      return "10";
    }

    @computed get name() {
      return "foo";
    }

    bar = false;
  }

  return Foo;
}

class Foo extends FooMixin(class {} as Constructor<Model<FooTraits>>) {}

const foo = new Foo();
foo.bar;
