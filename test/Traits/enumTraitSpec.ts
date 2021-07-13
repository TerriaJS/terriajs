import enumTrait from "../../lib/Traits/decorators/enumTrait";
import ModelTraits from "../../lib/Traits/ModelTraits";
import CreateModel from "../../lib/Models/CreateModel";
import { configure } from "mobx";
import Terria from "../../lib/Models/Terria";
import createStratumInstance from "../../lib/Models/createStratumInstance";
import updateModelFromJson from "../../lib/Models/updateModelFromJson";
import CommonStrata from "../../lib/Models/CommonStrata";

configure({
  enforceActions: "observed",
  computedRequiresReaction: true
});

enum MyEnum {
  foo,
  bar
}

enum MyEnumString {
  foo = "test",
  bar = "baz"
}

class EnumTraits extends ModelTraits {
  @enumTrait({
    enum: MyEnum,
    name: "Enum trait",
    description: "enumTrait"
  })
  enumTrait?: MyEnum;

  @enumTrait({
    enum: MyEnum,
    name: "enumTraitLabels",
    description: "Enum trait with labels allowed",
    allowLabelsAsValue: true
  })
  enumTraitLabels?: MyEnum;
}

class EnumTraitsString extends ModelTraits {
  @enumTrait({
    enum: MyEnumString,
    name: "enumTraitString",
    description: "Enum trait string"
  })
  enumTraitString?: MyEnumString;

  @enumTrait({
    enum: MyEnumString,
    name: "Enum trait string with labels",
    description: "Enum trait string with labels allowed",
    allowLabelsAsValue: true
  })
  enumTraitStringLabels?: MyEnumString;
}

class EnumModel extends CreateModel(EnumTraits) {}

class EnumModelString extends CreateModel(EnumTraitsString) {}

describe("enumTrait", function() {
  it("returns an empty model if all strata are undefined", function() {
    const terria = new Terria();
    const model = new EnumModel("test", terria);
    expect(model.enumTrait).toBeUndefined();
  });

  it("correctly interpret numeric enum value", function() {
    const terria = new Terria();
    const model = new EnumModel("test", terria);

    const user = createStratumInstance(EnumTraits);
    model.strata.set("user", user);
    user.enumTrait = 1;
    model.propertyIsEnumerable("enumTrait");
    expect(model.enumTrait).toBeDefined();

    expect(model.enumTrait).toEqual(MyEnum.bar);
  });

  it("correctly update model from json (numeric enum)", function() {
    const terria = new Terria();
    const model = new EnumModel("test", terria);

    const user = createStratumInstance(EnumTraits);
    model.strata.set(CommonStrata.user, user);
    updateModelFromJson(model, CommonStrata.user, {
      enumTrait: "bar",
      enumTraitLabels: "foo"
    });
    expect(model.enumTraitLabels).toBeDefined();
    expect(model.enumTraitLabels).toEqual(MyEnum.foo);
    expect(model.enumTrait).toBeUndefined();

    updateModelFromJson(model, CommonStrata.user, {
      enumTrait: 0,
      enumTraitLabels: 1
    });
    expect(model.enumTrait).toBeDefined();
    expect(model.enumTrait).toEqual(MyEnum.foo);
    expect(model.enumTraitLabels).toBeDefined();
    expect(model.enumTraitLabels).toEqual(MyEnum.bar);
  });

  it("correctly update model from json (string enum)", function() {
    const terria = new Terria();
    const model = new EnumModelString("test", terria);

    const user = createStratumInstance(EnumTraitsString);
    model.strata.set(CommonStrata.user, user);
    updateModelFromJson(model, CommonStrata.user, {
      enumTraitString: "foo",
      enumTraitStringLabels: "foo"
    });
    expect(model.enumTraitStringLabels).toBeDefined();
    expect(model.enumTraitStringLabels).toEqual(MyEnumString.foo);
    expect(model.enumTraitString).toBeUndefined();
    // expect(model.enumTraitString).toEqual(MyEnumString.bar);

    updateModelFromJson(model, CommonStrata.user, {
      enumTraitString: "test",
      enumTraitStringLabels: "baz"
    });
    expect(model.enumTraitString).toBeDefined();
    expect(model.enumTraitString).toEqual(MyEnumString.foo);
    expect(model.enumTraitStringLabels).toBeDefined();
    expect(model.enumTraitStringLabels).toEqual(MyEnumString.bar);
  });

  it("combines values from different strata", function() {
    const terria = new Terria();
    const model = new EnumModel("test", terria);

    const definition = createStratumInstance(EnumTraits);
    const user = createStratumInstance(EnumTraits);
    model.strata.set("definition", definition);
    model.strata.set("user", user);

    definition.enumTrait = 1;
    expect(model.enumTrait).toBeDefined();
    expect(model.enumTrait).toEqual(MyEnum.bar);

    user.enumTrait = 0;
    expect(model.enumTrait).toEqual(MyEnum.foo);
  });
});
