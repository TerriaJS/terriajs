import { runInAction } from "mobx";
import createCombinedModel from "../../../lib/Models/Definition/createCombinedModel";
import CreateModel from "../../../lib/Models/Definition/CreateModel";
import Terria from "../../../lib/Models/Terria";
import TraitsForTesting from "../../Types/TraitsForTesting";

const ModelClass = CreateModel(TraitsForTesting);

describe("createCombinedModel", function () {
  let top = new ModelClass(undefined, new Terria());
  let bottom = new ModelClass(undefined, new Terria());

  beforeEach(function () {
    top = new ModelClass(undefined, new Terria());
    bottom = new ModelClass(undefined, new Terria());
  });

  describe("primitive traits", function () {
    it("includes properties from both models", function () {
      runInAction(() => {
        top.setTrait("definition", "withoutDefault", 10);
        bottom.setTrait("definition", "someBool", false);
      });

      const combined = createCombinedModel(top, bottom);
      expect(combined.withoutDefault).toBe(10);
      expect(combined.someBool).toBe(false);
    });

    it("overrides bottom with top", function () {
      runInAction(() => {
        top.setTrait("definition", "withoutDefault", 10);
        bottom.setTrait("definition", "withoutDefault", 20);
      });

      const combined = createCombinedModel(top, bottom);
      expect(combined.withoutDefault).toBe(10);
    });

    it("does not override bottom with top's defaults", function () {
      runInAction(() => {
        bottom.setTrait("definition", "withDefault", 100);
      });

      const combined = createCombinedModel(top, bottom);
      expect(combined.withDefault).toBe(100);
    });

    it("has default if neither top nor bottom have a value", function () {
      const combined = createCombinedModel(top, bottom);
      expect(combined.withDefault).toBe(10);
    });
  });

  describe("object traits", function () {
    it("combines nested objects", function () {
      runInAction(() => {
        top.nestedWithoutDefault.setTrait("definition", "withoutDefault", 100);
        bottom.nestedWithoutDefault.setTrait("definition", "withDefault", 99);
      });

      const combined = createCombinedModel(top, bottom);
      expect(combined.nestedWithoutDefault.withoutDefault).toBe(100);
      expect(combined.nestedWithoutDefault.withDefault).toBe(99);
    });

    it("overrides bottom with top in nested objects", function () {
      runInAction(() => {
        top.nestedWithoutDefault.setTrait("definition", "withoutDefault", 100);
        bottom.nestedWithoutDefault.setTrait(
          "definition",
          "withoutDefault",
          99
        );
      });

      const combined = createCombinedModel(top, bottom);
      expect(combined.nestedWithoutDefault.withoutDefault).toBe(100);
    });

    it("does not override bottom with top's defaults in nested objects", function () {
      runInAction(() => {
        bottom.nestedWithoutDefault.setTrait("definition", "withDefault", 100);
      });

      const combined = createCombinedModel(top, bottom);
      expect(combined.nestedWithoutDefault.withDefault).toBe(100);
    });

    it("has default in nested object if neither top nor bottom have a value", function () {
      const combined = createCombinedModel(top, bottom);
      expect(combined.nestedWithoutDefault.withDefault).toBe(10);
    });
  });

  describe("object array traits", function () {
    it("combines different objects in nested arrays", function () {
      runInAction(() => {
        top
          .addObject("definition", "nestedArrayWithoutDefault", "1")!
          .setTrait("definition", "withoutDefault", 100);
        bottom
          .addObject("definition", "nestedArrayWithoutDefault", "2")!
          .setTrait("definition", "withoutDefault", 99);
      });

      const combined = createCombinedModel(top, bottom);
      expect(combined.nestedArrayWithoutDefault.length).toBe(2);
      expect(combined.nestedArrayWithoutDefault[0].withoutDefault).toBe(99);
      expect(combined.nestedArrayWithoutDefault[1].withoutDefault).toBe(100);
    });

    it("combines different objects with the same ID", function () {
      runInAction(() => {
        top
          .addObject("definition", "nestedArrayWithoutDefault", "1")!
          .setTrait("definition", "withoutDefault", 100);
        bottom
          .addObject("definition", "nestedArrayWithoutDefault", "1")!
          .setTrait("definition", "another", "test");
      });

      const combined = createCombinedModel(top, bottom);
      expect(combined.nestedArrayWithoutDefault.length).toBe(1);
      expect(combined.nestedArrayWithoutDefault[0].withoutDefault).toBe(100);
      expect(combined.nestedArrayWithoutDefault[0].another).toBe("test");
    });

    it("overrides bottom with top in nested objects", function () {
      runInAction(() => {
        top
          .addObject("definition", "nestedArrayWithoutDefault", "1")!
          .setTrait("definition", "withoutDefault", 100);
        bottom
          .addObject("definition", "nestedArrayWithoutDefault", "1")!
          .setTrait("definition", "withoutDefault", 99);
      });

      const combined = createCombinedModel(top, bottom);
      expect(combined.nestedArrayWithoutDefault[0].withoutDefault).toBe(100);
    });

    it("does not override bottom with top's defaults in nested objects", function () {
      runInAction(() => {
        top.addObject("definition", "nestedArrayWithoutDefault", "1");
        bottom
          .addObject("definition", "nestedArrayWithoutDefault", "1")!
          .setTrait("definition", "anotherWithDefault", "bottom");
      });

      const combined = createCombinedModel(top, bottom);
      expect(combined.nestedArrayWithoutDefault[0].anotherWithDefault).toBe(
        "bottom"
      );
    });

    it("has default in nested object if neither top nor bottom have a value", function () {
      runInAction(() => {
        top.addObject("definition", "nestedArrayWithoutDefault", "1");
        bottom.addObject("definition", "nestedArrayWithoutDefault", "1");
      });

      const combined = createCombinedModel(top, bottom);
      expect(combined.nestedWithoutDefault.anotherWithDefault).toBe("default");
    });

    it("handles addObject if idProperty = index", function () {
      runInAction(() => {
        top
          .addObject("definition", "nestedArrayWithoutIdProperty")
          ?.setTrait("definition", "someValue", "some value");
        top
          .addObject("definition", "nestedArrayWithoutIdProperty")
          ?.setTrait("definition", "someValue", null);
        top
          .addObject("definition", "nestedArrayWithoutIdProperty")
          ?.setTrait("definition", "someValue", "the top value");
        bottom
          .addObject("definition", "nestedArrayWithoutIdProperty")
          ?.setTrait("definition", "someValue", null);
        bottom
          .addObject("definition", "nestedArrayWithoutIdProperty")
          ?.setTrait("definition", "someValue", "another value");
      });

      const combined = createCombinedModel(top, bottom);
      expect(combined.nestedArrayWithoutIdProperty.length).toBe(2);

      expect(combined.nestedArrayWithoutIdProperty[0].someValue).toBe(
        "some value"
      );
      expect(combined.nestedArrayWithoutIdProperty[1].someValue).toBe(
        "the top value"
      );
    });
  });
});
