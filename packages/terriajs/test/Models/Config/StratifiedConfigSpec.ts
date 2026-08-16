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

  it("deeply merges and validates a nested config value", function () {
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

    expect(
      config.mergeValue(ConfigStrata.user, "nested", {
        options: { second: 3 },
        items: ["replacement"]
      })
    ).toBeTrue();
    expect(config.nested).toEqual({
      enabled: true,
      options: { first: 1, second: 3 },
      items: ["replacement"]
    });
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

  // A nested sub-schema whose fields are all required and have NO defaults —
  // so a bare partial write to the object could not be validated on its own.
  const searchBarSchema = z.strictObject({
    searchBar: z.strictObject({
      placeholder: z.string(),
      minCharacters: z.number(),
      showInCatalog: z.boolean()
    })
  });

  it("mergeValue overrides a single nested field, keeping the rest from the definition (not defaults)", function () {
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

    const result = config.mergeValue(ConfigStrata.override, "searchBar", {
      minCharacters: 4
    });

    expect(result).toBeTrue();
    expect(config.searchBar).toEqual({
      placeholder: "from-config", // resolved from definition, NOT the default
      minCharacters: 4, // the single overridden field
      showInCatalog: true // resolved from definition, NOT the default
    });
  });

  it("update rejects a bare partial nested object when the sub-schema requires the missing fields", function () {
    const config = createStratifiedConfig(searchBarSchema);

    config.setValue(ConfigStrata.definition, "searchBar", {
      placeholder: "from-config",
      minCharacters: 3,
      showInCatalog: true
    });

    const result = config.update(ConfigStrata.override, {
      searchBar: { minCharacters: 4 }
    } as never);

    expect(typeof result).toBe("string");
    // The definition value is left untouched — nothing partial was written.
    expect(config.searchBar).toEqual({
      placeholder: "from-config",
      minCharacters: 3,
      showInCatalog: true
    });
  });
});
