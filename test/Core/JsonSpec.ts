import {
  isJsonObject,
  isJsonBoolean,
  isJsonNumber,
  isJsonString,
  isJsonValue,
  isJsonArray,
  isJsonStringArray,
  isJsonNumberArray,
  assertObject,
  assertString,
  assertNumber,
  assertArray,
  isJsonObjectArray
} from "../../lib/Core/Json";
import Terria from "../../lib/Models/Terria";

describe("Json", function() {
  const emptyFunctionMock = () => {
    // no-op
  };
  it("isJsonObject", function() {
    expect(isJsonObject(null)).toBeFalsy();
    expect(isJsonObject(1)).toBeFalsy();
    expect(isJsonObject("stringy")).toBeFalsy();
    expect(isJsonObject(["a string"])).toBeFalsy();
    expect(
      isJsonObject({ actually: "an Object", with: ["JsonValues", null] })
    ).toBeTruthy();

    expect(isJsonObject(emptyFunctionMock)).toBeFalsy();
    expect(isJsonObject(new Terria())).toBeFalsy();

    expect(isJsonObject({ prop: emptyFunctionMock })).toBeFalsy();
    expect(
      isJsonObject({
        not: "an Object",
        with: ["JsonValues", emptyFunctionMock]
      })
    ).toBeFalsy();
    expect(
      isJsonObject({
        not: "an Object",
        with: ["JsonValues", { function: emptyFunctionMock }]
      })
    ).toBeFalsy();

    // Deep = false

    expect(
      isJsonObject(
        {
          not: "an Object",
          with: ["JsonValues", { function: emptyFunctionMock }]
        },
        false
      )
    ).toBeTruthy();
  });

  it("isJsonBoolean", function() {
    expect(isJsonBoolean(null)).toBeFalsy();
    expect(isJsonBoolean(1)).toBeFalsy();
    expect(isJsonBoolean("stringy")).toBeFalsy();
    expect(isJsonBoolean(["a string"])).toBeFalsy();
    expect(isJsonBoolean(false)).toBeTruthy();
    expect(
      isJsonBoolean({ actually: "an Object", with: ["JsonValues", null] })
    ).toBeFalsy();

    expect(isJsonBoolean(emptyFunctionMock)).toBeFalsy();
    expect(isJsonBoolean(new Terria())).toBeFalsy();
  });

  it("isJsonNumber", function() {
    expect(isJsonNumber(null)).toBeFalsy();
    expect(isJsonNumber(1)).toBeTruthy();
    expect(isJsonNumber("stringy")).toBeFalsy();
    expect(isJsonNumber([2])).toBeFalsy();
    expect(isJsonNumber(false)).toBeFalsy();
    expect(
      isJsonNumber({ actually: "an Object", with: ["JsonValues", null] })
    ).toBeFalsy();

    expect(isJsonNumber(emptyFunctionMock)).toBeFalsy();
    expect(isJsonNumber(new Terria())).toBeFalsy();
  });

  it("isJsonString", function() {
    expect(isJsonString(null)).toBeFalsy();
    expect(isJsonString(1)).toBeFalsy();
    expect(isJsonString("stringy")).toBeTruthy();
    expect(isJsonString(["a string"])).toBeFalsy();
    expect(isJsonString(false)).toBeFalsy();
    expect(
      isJsonString({ actually: "an Object", with: ["JsonValues", null] })
    ).toBeFalsy();

    expect(isJsonString(emptyFunctionMock)).toBeFalsy();
    expect(isJsonString(new Terria())).toBeFalsy();
  });

  it("isJsonValue", function() {
    expect(isJsonValue(null)).toBeTruthy();
    expect(isJsonValue(1)).toBeTruthy();
    expect(isJsonValue("stringy")).toBeTruthy();
    expect(isJsonValue(["a string"])).toBeTruthy();
    expect(isJsonValue(false)).toBeTruthy();
    expect(
      isJsonValue({ actually: "an Object", with: ["JsonValues", null] })
    ).toBeTruthy();

    expect(isJsonValue(emptyFunctionMock)).toBeFalsy();
    expect(isJsonValue(new Terria())).toBeFalsy();

    expect(
      isJsonValue({ not: "an Object", with: ["JsonValues", emptyFunctionMock] })
    ).toBeFalsy();
    expect(
      isJsonValue({
        not: "an Object",
        with: ["JsonValues", { function: emptyFunctionMock }]
      })
    ).toBeFalsy();

    // Deep = false

    expect(
      isJsonValue(
        {
          not: "an Object",
          with: ["JsonValues", { function: emptyFunctionMock }]
        },
        false
      )
    ).toBeTruthy();
  });

  it("isJsonArray", function() {
    expect(isJsonArray(null)).toBeFalsy();
    expect(isJsonArray(1)).toBeFalsy();
    expect(isJsonArray("stringy")).toBeFalsy();
    expect(isJsonArray(["a string"])).toBeTruthy();
    expect(isJsonArray(false)).toBeFalsy();
    expect(isJsonArray(["JsonValues", null])).toBeTruthy();

    expect(isJsonArray(emptyFunctionMock)).toBeFalsy();
    expect(isJsonArray(new Terria())).toBeFalsy();

    expect(
      isJsonArray([
        "JsonValues",
        null,
        { not: "an Object", with: ["JsonValues", emptyFunctionMock] }
      ])
    ).toBeFalsy();

    // Deep = false

    expect(
      isJsonArray(
        [
          "JsonValues",
          null,
          { not: "an Object", with: ["JsonValues", emptyFunctionMock] }
        ],
        false
      )
    ).toBeTruthy();
  });

  it("isJsonStringArray", function() {
    expect(isJsonStringArray(null)).toBeFalsy();
    expect(isJsonStringArray(1)).toBeFalsy();
    expect(isJsonStringArray("stringy")).toBeFalsy();
    expect(isJsonStringArray(["a string"])).toBeTruthy();
    expect(isJsonStringArray(false)).toBeFalsy();
    expect(isJsonStringArray(["JsonValues", 8])).toBeFalsy();

    expect(isJsonStringArray(emptyFunctionMock)).toBeFalsy();
    expect(isJsonStringArray(new Terria())).toBeFalsy();

    expect(
      isJsonStringArray(["JsonValues", "adsf", ["asdf", "asdf"]])
    ).toBeFalsy();
  });

  it("isJsonNumberArray", function() {
    expect(isJsonNumberArray(null)).toBeFalsy();
    expect(isJsonNumberArray(1)).toBeFalsy();
    expect(isJsonNumberArray("stringy")).toBeFalsy();
    expect(isJsonNumberArray(false)).toBeFalsy();
    expect(isJsonNumberArray([3, 234])).toBeTruthy();
    expect(isJsonNumberArray(["JsonValues", 8])).toBeFalsy();

    expect(isJsonNumberArray(emptyFunctionMock)).toBeFalsy();
    expect(isJsonNumberArray(new Terria())).toBeFalsy();

    expect(isJsonNumberArray([3, 1, [3, 4]])).toBeFalsy();
  });

  it("isJsonObjectArray", function() {
    expect(isJsonObjectArray(null)).toBeFalsy();
    expect(isJsonObjectArray(1)).toBeFalsy();
    expect(isJsonObjectArray("stringy")).toBeFalsy();
    expect(isJsonObjectArray(false)).toBeFalsy();
    expect(isJsonObjectArray([3, 234])).toBeFalsy();
    expect(isJsonObjectArray(["JsonValues", 8])).toBeFalsy();
    expect(isJsonObjectArray([{ some: "json object" }, 8])).toBeFalsy();
    expect(
      isJsonObjectArray([
        { some: "json object" },
        { another: { json: "object" } }
      ])
    ).toBeTruthy();

    expect(isJsonObjectArray(emptyFunctionMock)).toBeFalsy();
    expect(isJsonObjectArray(new Terria())).toBeFalsy();

    expect(isJsonObjectArray([3, 1, [3, 4]])).toBeFalsy();
  });

  it("assertObject", function() {
    expect(() => assertObject(null)).toThrow();
    expect(() => assertObject(1)).toThrow();
    expect(() => assertObject("stringy")).toThrow();
    expect(() => assertObject(["a string"])).toThrow();
    expect(() =>
      assertObject({ actually: "an Object", with: ["JsonValues", null] })
    ).toBeTruthy();

    expect(() => assertObject(emptyFunctionMock)).toThrow();
    expect(() => assertObject(new Terria())).toThrow();

    expect(() => assertObject({ prop: emptyFunctionMock })).toThrow();
    expect(() =>
      assertObject({
        not: "an Object",
        with: ["JsonValues", emptyFunctionMock]
      })
    ).toThrow();
    expect(() =>
      assertObject({
        not: "an Object",
        with: ["JsonValues", { function: emptyFunctionMock }]
      })
    ).toThrow();
  });
  it("assertString", function() {
    expect(() => assertString(null)).toThrow();
    expect(() => assertString(1)).toThrow();
    expect(() => assertString("stringy")).toBeTruthy();
    expect(() => assertString(["a string"])).toThrow();
    expect(() =>
      assertString({ actually: "an Object", with: ["JsonValues", null] })
    ).toThrow();

    expect(() => assertString(emptyFunctionMock)).toThrow();
    expect(() => assertString(new Terria())).toThrow();

    expect(() => assertString({ prop: emptyFunctionMock })).toThrow();
    expect(() =>
      assertString({
        not: "an Object",
        with: ["JsonValues", emptyFunctionMock]
      })
    ).toThrow();
    expect(() =>
      assertString({
        not: "an Object",
        with: ["JsonValues", { function: emptyFunctionMock }]
      })
    ).toThrow();
  });
  it("assertNumber", function() {
    expect(() => assertNumber(null)).toThrow();
    expect(() => assertNumber(1)).toBeTruthy();
    expect(() => assertNumber("stringy")).toThrow();
    expect(() => assertNumber(["a string"])).toThrow();
    expect(() =>
      assertNumber({ actually: "an Object", with: ["JsonValues", null] })
    ).toThrow();

    expect(() => assertNumber(emptyFunctionMock)).toThrow();
    expect(() => assertNumber(new Terria())).toThrow();

    expect(() => assertNumber({ prop: emptyFunctionMock })).toThrow();
    expect(() =>
      assertNumber({
        not: "an Object",
        with: ["JsonValues", emptyFunctionMock]
      })
    ).toThrow();
    expect(() =>
      assertNumber({
        not: "an Object",
        with: ["JsonValues", { function: emptyFunctionMock }]
      })
    ).toThrow();
  });
  it("assertArray", function() {
    expect(() => assertArray(null)).toThrow();
    expect(() => assertArray(1)).toThrow();
    expect(() => assertArray("stringy")).toThrow();
    expect(() => assertArray(["a string"])).toBeTruthy();
    expect(() =>
      assertArray({ actually: "an Object", with: ["JsonValues", null] })
    ).toThrow();

    expect(() => assertArray(emptyFunctionMock)).toThrow();
    expect(() => assertArray(new Terria())).toThrow();

    expect(() => assertArray({ prop: emptyFunctionMock })).toThrow();
    expect(() =>
      assertArray({ not: "an Object", with: ["JsonValues", emptyFunctionMock] })
    ).toThrow();
    expect(() =>
      assertArray({
        not: "an Object",
        with: ["JsonValues", { function: emptyFunctionMock }]
      })
    ).toThrow();
  });
});
