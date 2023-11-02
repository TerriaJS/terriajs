import { configure } from "mobx";
import CreateModel from "../../lib/Models/Definition/CreateModel";
import createStratumInstance from "../../lib/Models/Definition/createStratumInstance";
import Terria from "../../lib/Models/Terria";
import objectArrayTrait from "../../lib/Traits/Decorators/objectArrayTrait";
import primitiveTrait from "../../lib/Traits/Decorators/primitiveTrait";
import ModelTraits from "../../lib/Traits/ModelTraits";

configure({
  enforceActions: true,
  computedRequiresReaction: true
});

class InnerTraits extends ModelTraits {
  @primitiveTrait({
    type: "string",
    name: "Foo",
    description: "Foo"
  })
  foo?: string;

  @primitiveTrait({
    type: "number",
    name: "Bar",
    description: "Bar"
  })
  bar?: number;

  @primitiveTrait({
    type: "boolean",
    name: "Baz",
    description: "Baz"
  })
  baz?: boolean;

  static isRemoval(traits: InnerTraits) {
    return traits.bar === 42;
  }
}

class OuterTraits extends ModelTraits {
  @objectArrayTrait({
    type: InnerTraits,
    name: "Inner",
    description: "Inner",
    idProperty: "foo"
  })
  inner?: InnerTraits[];

  @objectArrayTrait({
    type: InnerTraits,
    name: "Inner by index",
    description: "Inner by index",
    idProperty: "index"
  })
  innerByIndex?: InnerTraits[];

  @primitiveTrait({
    type: "string",
    name: "Other",
    description: "Other"
  })
  other?: string;
}

class OuterTraitsNoMerge extends ModelTraits {
  @objectArrayTrait({
    type: InnerTraits,
    name: "Inner",
    description: "Inner",
    idProperty: "foo",
    merge: false
  })
  inner?: InnerTraits[];

  @primitiveTrait({
    type: "string",
    name: "Other",
    description: "Other"
  })
  other?: string;
}

class TestModel extends CreateModel(OuterTraits) {}
class TestModelNoMerge extends CreateModel(OuterTraitsNoMerge) {}

describe("objectArrayTrait", function () {
  it("returns an empty model if all strata are undefined", function () {
    const terria = new Terria();
    const model = new TestModel("test", terria);
    model.strata.set("definition", createStratumInstance(OuterTraits));
    model.strata.set("user", createStratumInstance(OuterTraits));
    expect(model.inner).toBeDefined();
  });

  it("combines values from different strata", function () {
    const terria = new Terria();
    const model = new TestModel("test", terria);

    const definition = createStratumInstance(OuterTraits);
    const user = createStratumInstance(OuterTraits);
    model.strata.set("definition", definition);
    model.strata.set("user", user);

    definition.inner = [
      createStratumInstance(InnerTraits),
      createStratumInstance(InnerTraits)
    ];
    definition.inner[0].foo = "a";
    definition.inner[0].bar = 1;
    definition.inner[1].foo = "b";
    definition.inner[1].bar = 2;
    definition.inner[1].baz = true;

    user.inner = [
      createStratumInstance(InnerTraits),
      createStratumInstance(InnerTraits)
    ];
    user.inner[0].foo = "b";
    user.inner[0].baz = false;
    user.inner[1].foo = "c";
    user.inner[1].bar = 3;

    expect(model.inner).toBeDefined();
    if (model.inner !== undefined) {
      expect(model.inner.length).toEqual(3);

      const a = model.inner.filter((x) => x.foo === "a")[0];
      const b = model.inner.filter((x) => x.foo === "b")[0];
      const c = model.inner.filter((x) => x.foo === "c")[0];
      expect(a).toBeDefined();
      expect(b).toBeDefined();
      expect(c).toBeDefined();

      expect(a.bar).toEqual(1);
      expect(a.baz).toBeUndefined();
      expect(b.bar).toEqual(2);
      expect(b.baz).toEqual(false);
      expect(c.bar).toEqual(3);
      expect(c.baz).toBeUndefined();
    }
  });

  it("updates to reflect array elements added after evaluation", function () {
    const terria = new Terria();
    const model = new TestModel("test", terria);

    const definition = createStratumInstance(OuterTraits);
    const user = createStratumInstance(OuterTraits);
    model.strata.set("definition", definition);
    model.strata.set("user", user);

    definition.inner = [
      createStratumInstance(InnerTraits),
      createStratumInstance(InnerTraits)
    ];
    definition.inner[0].foo = "a";
    definition.inner[0].bar = 1;
    definition.inner[1].foo = "b";
    definition.inner[1].bar = 2;
    definition.inner[1].baz = true;

    user.inner = [
      createStratumInstance(InnerTraits),
      createStratumInstance(InnerTraits)
    ];
    user.inner[0].foo = "b";
    user.inner[0].baz = false;
    user.inner[1].foo = "c";
    user.inner[1].bar = 3;

    expect(model.inner).toBeDefined();

    if (model.inner !== undefined) {
      expect(model.inner.length).toEqual(3);

      const newOne = createStratumInstance(InnerTraits);
      definition.inner.push(newOne);
      newOne.foo = "c";
      newOne.bar = 4;
      newOne.baz = true;

      expect(model.inner.length).toEqual(3);

      const c = model.inner.filter((x) => x.foo === "c")[0];
      expect(c.bar).toEqual(3);
      expect(c.baz).toEqual(true);
    }
  });

  it("allows strata to remove elements from top level", function () {
    const terria = new Terria();
    const model = new TestModel("test", terria);

    const definition = createStratumInstance(OuterTraits);
    const user = createStratumInstance(OuterTraits);
    model.strata.set("definition", definition);
    model.strata.set("user", user);

    definition.inner = [
      createStratumInstance(InnerTraits),
      createStratumInstance(InnerTraits)
    ];
    definition.inner[0].foo = "a";
    definition.inner[0].bar = 1;
    definition.inner[1].foo = "b";
    definition.inner[1].bar = 2;
    definition.inner[1].baz = true;

    user.inner = [
      createStratumInstance(InnerTraits),
      createStratumInstance(InnerTraits),
      createStratumInstance(InnerTraits)
    ];
    user.inner[0].foo = "b";
    user.inner[0].bar = 42; // indicates removed, according to InnerTraits.isRemoval.
    user.inner[1].foo = "c";
    user.inner[1].bar = 3;
    user.inner[2].foo = "a";
    user.inner[2].bar = 11;

    // Here we expect the order to be "a" and then "c" as "a" is defined in a lower strata to "c"
    expect(model.inner.length).toEqual(2);
    expect(model.inner[0].foo).toEqual("a");
    expect(model.inner[0].bar).toEqual(11);
    expect(model.inner[1].foo).toEqual("c");
  });

  it("allows strata to remove elements from bottom level", function () {
    const terria = new Terria();
    const model = new TestModel("test", terria);

    const definition = createStratumInstance(OuterTraits);
    const user = createStratumInstance(OuterTraits);
    model.strata.set("definition", definition);
    model.strata.set("user", user);

    definition.inner = [
      createStratumInstance(InnerTraits),
      createStratumInstance(InnerTraits)
    ];

    // Order is important here:
    // - b (with removal)
    // - a
    definition.inner[0].foo = "b";
    definition.inner[0].bar = 42; // indicates removed, according to InnerTraits.isRemoval.
    definition.inner[0].baz = true;
    definition.inner[1].foo = "a";
    definition.inner[1].bar = 1;

    user.inner = [
      createStratumInstance(InnerTraits),
      createStratumInstance(InnerTraits),
      createStratumInstance(InnerTraits)
    ];

    // Order:
    // - b (removed in "definition")
    // - c
    // - a (exists in "definition")
    user.inner[0].foo = "b";
    user.inner[0].bar = 100;
    user.inner[1].foo = "c";
    user.inner[1].bar = 3;
    user.inner[2].foo = "a";
    user.inner[2].bar = 11;

    // So we expect this order:
    // - a (because it is in "definition")
    // - b (removed in "definition" so treated as from "user")
    // - c (from "user")
    expect(model.inner.length).toEqual(3);
    expect(model.inner[0].foo).toEqual("a");
    expect(model.inner[0].bar).toEqual(11);
    expect(model.inner[1].foo).toEqual("b");
    expect(model.inner[1].bar).toEqual(100);
    expect(model.inner[2].foo).toEqual("c");
    expect(model.inner[2].bar).toEqual(3);
    expect(model.inner[2].baz).toBeUndefined();
  });

  it("updates to reflect new strata added after evaluation", function () {
    const terria = new Terria();
    const model = new TestModel("test", terria);

    const newObj = model.addObject("user", "inner", "test");
    expect(newObj).toBeDefined();

    if (newObj) {
      expect(newObj.foo).toBe("test");
      newObj.setTrait("user", "bar", 4);
      expect(newObj.bar).toBe(4);
      newObj.setTrait("definition", "baz", true);
      expect(newObj.baz).toBe(true);
    }

    expect(model.inner.length).toBe(1);
    expect(model.inner[0].foo).toBe("test");
    expect(model.inner[0].bar).toBe(4);
    expect(model.inner[0].baz).toBe(true);
  });

  it("handles idProperty = index", function () {
    const terria = new Terria();
    const model = new TestModel("test", terria);

    // Create new object and set removal
    const firstObject = model.addObject("definition", "innerByIndex");

    firstObject?.setTrait("definition", "foo", "definition");
    firstObject?.setTrait("user", "bar", 10);
    expect(model.innerByIndex.length).toBe(1);
    expect(model.innerByIndex[0].foo).toBe("definition");

    // Remove first object by setting bar = 42
    firstObject?.setTrait("user", "bar", 42);

    expect(model.innerByIndex.length).toBe(0);

    // Add new object to user
    const secondObject = model.addObject("user", "innerByIndex");
    secondObject?.setTrait("user", "foo", "user");
    secondObject?.setTrait("user", "bar", 10);

    expect(model.innerByIndex.length).toBe(1);
    expect(model.innerByIndex[0].foo).toBe("user");

    // Add new object to definition
    const thirdObject = model.addObject("definition", "innerByIndex");
    thirdObject?.setTrait("user", "foo", "definition");
    thirdObject?.setTrait("user", "bar", 10);

    expect(model.innerByIndex.length).toBe(2);
    expect(model.innerByIndex[0].foo).toBe("user");
    expect(model.innerByIndex[1].foo).toBe("definition");

    // Add new object to user
    const fourthObject = model.addObject("user", "innerByIndex");
    fourthObject?.setTrait("user", "foo", "user2");
    fourthObject?.setTrait("user", "bar", 20);

    expect(model.innerByIndex.length).toBe(3);
    expect(model.innerByIndex[0].foo).toBe("user");
    expect(model.innerByIndex[1].foo).toBe("definition");
    expect(model.innerByIndex[2].foo).toBe("user2");
  });

  it("updates to reflect new strata added after evaluation (with no merge)", function () {
    const terria = new Terria();
    const model = new TestModelNoMerge("test", terria);

    const newObj = model.addObject("user", "inner", "test");
    expect(newObj).toBeDefined();

    if (newObj) {
      expect(newObj.foo).toBe("test");
      newObj.setTrait("user", "bar", 4);
      expect(newObj.bar).toBe(4);
      newObj.setTrait("definition", "baz", true);
      expect(newObj.baz).toBeUndefined();
      newObj.setTrait("user", "baz", true);
      expect(newObj.baz).toBeTruthy();
    }

    expect(model.inner.length).toBe(1);
    expect(model.inner[0].foo).toBe("test");
    expect(model.inner[0].bar).toBe(4);
    expect(model.inner[0].baz).toBe(true);
  });
});
