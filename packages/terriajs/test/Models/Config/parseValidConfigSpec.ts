import * as z from "zod";
import { parseValidConfig } from "../../../lib/Models/Config/parseValidConfig";

describe("parseValidConfig", function () {
  const schema = z.strictObject({
    appName: z.string().optional(),
    minCharacters: z.number().optional(),
    searchBarConfig: z
      .strictObject({
        placeholder: z.string().optional(),
        minCharacters: z.number().optional()
      })
      .optional(),
    entries: z.array(z.strictObject({ title: z.string() })).optional()
  });

  it("returns the parsed data and no issues when everything is valid", function () {
    const result = parseValidConfig(schema, {
      appName: "My Map",
      searchBarConfig: { placeholder: "Search" }
    });

    expect(result.data).toEqual({
      appName: "My Map",
      searchBarConfig: { placeholder: "Search" }
    });
    expect(result.issues).toEqual([]);
    expect(result.message).toBe("");
  });

  it("reports an issue and applies nothing when the input is not an object", function () {
    const result = parseValidConfig(schema, "not an object");

    expect(result.data).toEqual({});
    expect(result.issues.length).toBe(1);
    expect(result.message).toContain("object");
  });

  it("drops an unknown top-level key, applies the rest, and names the key", function () {
    const result = parseValidConfig(schema, { appName: "My Map", mystery: 1 });

    expect(result.data).toEqual({ appName: "My Map" });
    expect(result.issues.map((issue) => issue.path)).toEqual(["mystery"]);
  });

  it("drops an invalid top-level value and keeps its siblings", function () {
    const result = parseValidConfig(schema, {
      appName: "My Map",
      minCharacters: "three"
    });

    expect(result.data).toEqual({ appName: "My Map" });
    expect(result.issues.map((issue) => issue.path)).toEqual(["minCharacters"]);
  });

  it("drops only the unknown nested key, keeping its siblings and the other top-level keys", function () {
    const result = parseValidConfig(schema, {
      appName: "My Map",
      searchBarConfig: { placeholder: "Search", bogus: 1 }
    });

    expect(result.data).toEqual({
      appName: "My Map",
      searchBarConfig: { placeholder: "Search" }
    });
    expect(result.issues.map((issue) => issue.path)).toEqual([
      "searchBarConfig.bogus"
    ]);
  });

  it("drops only the invalid nested leaf, keeping the valid leaf beside it", function () {
    const result = parseValidConfig(schema, {
      appName: "My Map",
      searchBarConfig: { placeholder: "Search", minCharacters: "three" }
    });

    expect(result.data).toEqual({
      appName: "My Map",
      searchBarConfig: { placeholder: "Search" }
    });
    expect(result.issues.map((issue) => issue.path)).toEqual([
      "searchBarConfig.minCharacters"
    ]);
  });

  it("reports every rejected value when several are invalid", function () {
    const result = parseValidConfig(schema, {
      appName: "My Map",
      minCharacters: "three",
      mystery: 1
    });

    expect(result.data).toEqual({ appName: "My Map" });
    expect(result.issues.map((issue) => issue.path).sort()).toEqual([
      "minCharacters",
      "mystery"
    ]);
  });

  it("drops the whole array when one of its elements is invalid, since arrays are replaced wholesale", function () {
    const result = parseValidConfig(schema, {
      appName: "My Map",
      entries: [{ title: "Intro" }, { title: 7 }]
    });

    expect(result.data).toEqual({ appName: "My Map" });
    expect(result.issues.map((issue) => issue.path)).toEqual(["entries"]);
  });

  it("applies nothing and reports the error when a whole-object refinement fails", function () {
    const refinedSchema = z
      .strictObject({ a: z.number().optional(), b: z.number().optional() })
      .refine((value) => value.a !== value.b, "a and b must differ");

    const result = parseValidConfig(refinedSchema, { a: 1, b: 1 });

    expect(result.data).toEqual({});
    expect(result.message).toContain("must differ");
  });

  it("applies nothing, reporting only the first parse, when the input still fails after the rejected values are removed", function () {
    const dependentSchema = z
      .strictObject({ a: z.number().optional(), b: z.string().optional() })
      .refine(
        (value) => value.a === undefined || value.b !== undefined,
        "a requires b"
      );

    const result = parseValidConfig(dependentSchema, { a: 1, b: 5 });

    expect(result.data).toEqual({});
    expect(result.issues.map((issue) => issue.path)).toEqual(["b"]);
    expect(result.message).not.toContain("a requires b");
  });

  it("does not mutate the input", function () {
    const raw = {
      appName: "My Map",
      searchBarConfig: { placeholder: "Search", bogus: 1 }
    };

    parseValidConfig(schema, raw);

    expect(raw).toEqual({
      appName: "My Map",
      searchBarConfig: { placeholder: "Search", bogus: 1 }
    });
  });
});
