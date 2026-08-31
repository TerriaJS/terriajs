import { autorun } from "mobx";
import * as z from "zod";
import { ConfigStrata } from "../../../lib/Models/Config/ConfigStrata";
import { createStratifiedConfig } from "../../../lib/Models/Config/StratifiedConfig";

describe("StratifiedConfig", function () {
  const schema = z.strictObject({
    value: z.number().optional()
  });

  it("observes setValue updates to a previously undefined property", function () {
    const config = createStratifiedConfig(schema);
    const values: Array<number | undefined> = [];
    const dispose = autorun(() => values.push(config.value));

    config.setValue(ConfigStrata.user, "value", 1);
    config.setValue(ConfigStrata.user, "value", 2);

    expect(values).toEqual([undefined, 1, 2]);
    dispose();
  });

  it("does not allow direct assignment to schema properties", function () {
    const config = createStratifiedConfig(schema);

    expect(Reflect.set(config, "value", 1)).toBeFalse();
    expect(config.value).toBeUndefined();
    expect(Object.hasOwn(config, "value")).toBeFalse();
  });

  it("does not allow assignment to unknown properties", function () {
    const config = createStratifiedConfig(schema);

    expect(Reflect.set(config, "unknown", 1)).toBeFalse();
    expect(Object.hasOwn(config, "unknown")).toBeFalse();
  });

  it("does not allow assignment to class properties", function () {
    const config = createStratifiedConfig(schema);

    expect(Reflect.set(config, "schema", z.strictObject({}))).toBeFalse();
    expect(config.schema).toBe(schema);
  });

  it("deep-merges a partial nested write with lower strata, per leaf", function () {
    const nestedSchema = z.strictObject({
      nested: z.strictObject({
        enabled: z.boolean(),
        options: z.strictObject({ first: z.number(), second: z.number() }),
        items: z.array(z.string())
      })
    });
    const config = createStratifiedConfig(nestedSchema);
    config.setValue(ConfigStrata.defaults, "nested", {
      enabled: true,
      options: { first: 1, second: 2 },
      items: ["default"]
    });

    const result = config.update(ConfigStrata.user, {
      nested: { options: { second: 3 }, items: ["replacement"] }
    });

    expect(result).toBeTrue();
    expect(config.nested).toEqual({
      enabled: true, // from defaults
      options: { first: 1, second: 3 }, // first from defaults, second from user
      items: ["replacement"] // array replaced wholesale
    });
  });

  // ── Trait-model parity: object values resolve per-leaf across strata ─────────
  //
  // The model layer resolves an `objectTrait` per sub-property: each leaf comes
  // from the highest stratum that defines *that leaf*, not from whichever
  // stratum owns the whole object. `get()` mirrors that: object-valued keys are
  // deep-merged across strata on read, so a partial higher stratum overrides
  // individual leaves while lower strata still supply the rest.

  it("deep-merges an object value across strata, keeping lower-stratum leaves a higher partial omits", function () {
    const schema = z.strictObject({
      options: z
        .strictObject({ a: z.number(), b: z.number(), c: z.number() })
        .partial()
    });
    const config = createStratifiedConfig(schema);

    config.update(ConfigStrata.definition, { options: { a: 1, b: 2, c: 3 } });
    config.update(ConfigStrata.user, { options: { b: 20 } });

    expect(config.options).toEqual({ a: 1, b: 20, c: 3 });
  });

  it("resolves each leaf from the highest stratum that defines it across three strata", function () {
    const schema = z.strictObject({
      options: z
        .strictObject({
          a: z.number(),
          b: z.number(),
          c: z.number(),
          d: z.number()
        })
        .partial()
    });
    const config = createStratifiedConfig(schema);

    config.update(ConfigStrata.defaults, {
      options: { a: 0, b: 0, c: 0, d: 0 }
    });
    config.update(ConfigStrata.definition, { options: { a: 1, b: 2 } });
    config.update(ConfigStrata.user, { options: { b: 20 } });

    expect(config.options).toEqual({
      a: 1, // definition over defaults
      b: 20, // user over definition over defaults
      c: 0, // only defaults
      d: 0 // only defaults
    });
  });

  it("replaces array-valued leaves wholesale rather than merging them element-wise", function () {
    const schema = z.strictObject({
      nested: z.strictObject({ items: z.array(z.number()) }).partial()
    });
    const config = createStratifiedConfig(schema);

    config.update(ConfigStrata.definition, { nested: { items: [1, 2, 3] } });
    config.update(ConfigStrata.user, { nested: { items: [9] } });

    expect(config.nested).toEqual({ items: [9] });
  });

  it("deep-merges nested objects more than one level deep", function () {
    const schema = z.strictObject({
      outer: z
        .strictObject({
          inner: z.strictObject({ x: z.number(), y: z.number() }).partial()
        })
        .partial()
    });
    const config = createStratifiedConfig(schema);

    config.update(ConfigStrata.definition, {
      outer: { inner: { x: 1, y: 2 } }
    });
    config.update(ConfigStrata.user, { outer: { inner: { y: 20 } } });

    expect(config.outer).toEqual({ inner: { x: 1, y: 20 } });
  });

  it("reacts when a lower-stratum leaf that is not masked by a higher stratum changes", function () {
    const schema = z.strictObject({
      options: z.strictObject({ a: z.number(), b: z.number() }).partial()
    });
    const config = createStratifiedConfig(schema);
    config.update(ConfigStrata.defaults, { options: { a: 1, b: 2 } });
    config.update(ConfigStrata.user, { options: { b: 20 } });

    const seen: Array<unknown> = [];
    const dispose = autorun(() => seen.push(config.options));

    config.update(ConfigStrata.defaults, { options: { a: 5, b: 2 } });

    expect(seen).toEqual([
      { a: 1, b: 20 },
      { a: 5, b: 20 }
    ]);
    dispose();
  });

  it("applies valid keys and reports invalid ones in the same update", function () {
    const schema = z.strictObject({ a: z.number(), b: z.number() });
    const config = createStratifiedConfig(schema);

    const result = config.update(ConfigStrata.definition, {
      a: 1,
      b: "not a number"
    } as never);

    expect(typeof result).toBe("string");
    expect(config.a).toBe(1);
    expect(config.b).toBeUndefined();
  });

  it("drops unknown keys, applies known keys, and reports the unknown key", function () {
    const schema = z.strictObject({ a: z.number() });
    const config = createStratifiedConfig(schema);

    const result = config.update(ConfigStrata.definition, {
      a: 1,
      mystery: 2
    } as never);

    expect(typeof result).toBe("string");
    expect(result).toContain("mystery");
    expect(config.a).toBe(1);
  });

  it("setValue rejects a value that fails schema validation without writing it", function () {
    const schema = z.strictObject({ value: z.number().optional() });
    const config = createStratifiedConfig(schema);

    const result = config.setValue(ConfigStrata.user, "value", "nope" as never);

    expect(typeof result).toBe("string");
    expect(config.value).toBeUndefined();
  });

  it("setValue writes a valid value and returns true", function () {
    const schema = z.strictObject({ value: z.number().optional() });
    const config = createStratifiedConfig(schema);

    expect(config.setValue(ConfigStrata.user, "value", 5)).toBeTrue();
    expect(config.value).toBe(5);
  });

  it("setValue removes a value from a stratum when passed undefined", function () {
    const config = createStratifiedConfig(schema);
    config.setValue(ConfigStrata.definition, "value", 1);
    config.setValue(ConfigStrata.user, "value", 2);

    expect(config.setValue(ConfigStrata.user, "value", undefined)).toBeTrue();
    expect(config.value).toBe(1);
    expect(config.getStratum(ConfigStrata.user)?.value).toBeUndefined();
  });

  it("throws when writing to a stratum that is not registered in the order", function () {
    const schema = z.strictObject({ value: z.number().optional() });
    const config = createStratifiedConfig(schema);

    expect(() => config.update("unregistered", { value: 1 })).toThrowError(
      /not registered/
    );
    expect(() => config.setValue("unregistered", "value", 1)).toThrowError(
      /not registered/
    );
  });

  // A nested sub-schema whose fields are all required and have NO defaults.
  // A bare partial write is still accepted (validation is deep-partial) and
  // stored as a clean partial — completeness comes from the lower strata on read.
  const searchBarSchema = z.strictObject({
    searchBar: z.strictObject({
      placeholder: z.string(),
      minCharacters: z.number(),
      showInCatalog: z.boolean()
    })
  });

  it("a bare partial nested write overrides one field, keeping the rest from the definition (not defaults)", function () {
    const config = createStratifiedConfig(searchBarSchema);

    config.setValue(ConfigStrata.defaults, "searchBar", {
      placeholder: "default",
      minCharacters: 1,
      showInCatalog: false
    });
    config.setValue(ConfigStrata.definition, "searchBar", {
      placeholder: "from-config",
      minCharacters: 3,
      showInCatalog: true
    });

    const result = config.update(ConfigStrata.override, {
      searchBar: { minCharacters: 4 }
    });

    expect(result).toBeTrue();
    expect(config.searchBar).toEqual({
      placeholder: "from-config", // resolved from definition, NOT the default
      minCharacters: 4, // the single overridden field
      showInCatalog: true // resolved from definition, NOT the default
    });
  });

  it("stores a bare partial as a clean partial, so later lower-stratum changes are not masked", function () {
    const config = createStratifiedConfig(searchBarSchema);

    config.setValue(ConfigStrata.definition, "searchBar", {
      placeholder: "from-config",
      minCharacters: 3,
      showInCatalog: true
    });

    const result = config.update(ConfigStrata.override, {
      searchBar: { minCharacters: 4 }
    });

    expect(result).toBeTrue();
    expect(config.getStratum(ConfigStrata.override)?.searchBar).toEqual({
      minCharacters: 4
    });
    expect(config.searchBar).toEqual({
      placeholder: "from-config",
      minCharacters: 4,
      showInCatalog: true
    });

    // A later change to a field the override does not set flows straight through.
    config.setValue(ConfigStrata.definition, "searchBar", {
      placeholder: "changed",
      minCharacters: 3,
      showInCatalog: true
    });
    expect(config.searchBar).toEqual({
      placeholder: "changed",
      minCharacters: 4,
      showInCatalog: true
    });
  });
});
