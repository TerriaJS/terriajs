import Constructor from "../../lib/Core/Constructor";
import CreateModel from "../../lib/Models/CreateModel";
import ExtendModel from "../../lib/Models/ExtendModel";
import Model from "../../lib/Models/Model";
import Terria from "../../lib/Models/Terria";
import mixTraits from "../../lib/Traits/mixTraits";
import ModelTraits from "../../lib/Traits/ModelTraits";
import primitiveTrait from "../../lib/Traits/primitiveTrait";

class FooTraits extends ModelTraits {
  @primitiveTrait({
    name: "foo",
    type: "string",
    description: "foo"
  })
  foo = "foo";
}

class BarTraits extends mixTraits(FooTraits) {
  @primitiveTrait({
    name: "bar",
    type: "string",
    description: "bar"
  })
  bar = "bar";
}

class Foo extends MixinA(CreateModel(FooTraits)) {
  fooMethod() {
    return "fooMethod";
  }
}

function MixinA<T extends Constructor<Model<FooTraits>>>(Base: T) {
  return class extends Base {
    get a() {
      return "a";
    }
  };
}

function MixinB<T extends Constructor<Model<FooTraits>>>(Base: T) {
  return class extends Base {
    get b() {
      return "b";
    }
  };
}

describe("ExtendModel", function() {
  describe("The extended model", function() {
    it("contains all the extended traits", function() {
      const Bar = ExtendModel(Foo, BarTraits);
      expect(Bar.TraitsClass).toBe(BarTraits);
    });

    it("inherits all parent methods", function() {
      const Bar = ExtendModel(Foo, BarTraits);
      const bar = new Bar("bar", new Terria());
      expect(bar.fooMethod()).toBe("fooMethod");
      expect(bar.a).toBe("a");
    });

    it("permits other classes to be mixed in", function() {
      const B = MixinB(ExtendModel(Foo, BarTraits));
      const b = new B("B", new Terria());
      expect(b.b).toBe("b");
    });
  });
});
