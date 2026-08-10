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
});
