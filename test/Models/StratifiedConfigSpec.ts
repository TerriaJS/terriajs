import { z } from "zod";

import { StratifiedConfig } from "../../lib/Models/StratifiedConfig";
import { ConfigStrata } from "../../lib/Models/ConfigStrata";

/**
 * Pure-validation schema — no `.default()` calls.
 * Defaults live in TEST_DEFAULTS and are loaded into the `defaults` stratum.
 */
const testSchema = z.object({
  appName: z.string(),
  maxFeatures: z.number(),
  debugMode: z.boolean().optional()
});

const TEST_DEFAULTS = {
  appName: "Default App",
  maxFeatures: 100
};

/** Factory that pre-populates the defaults stratum, mirroring createTerriaConfig. */
function createConfig(): StratifiedConfig<typeof testSchema> {
  const config = new StratifiedConfig(testSchema);
  config.update(ConfigStrata.defaults, TEST_DEFAULTS);
  return config;
}

describe("StratifiedConfig", function () {
  describe("defaults", function () {
    it("returns default value from defaults stratum", function () {
      const config = createConfig();
      expect(config.get("appName")).toBe("Default App");
      expect(config.get("maxFeatures")).toBe(100);
    });

    it("reports 'defaults' as the providing stratum when only defaults stratum is set", function () {
      const config = createConfig();
      expect(config.getProvidingStratum("appName")).toBe(ConfigStrata.defaults);
    });

    it("returns undefined for optional field not set in any stratum", function () {
      const config = createConfig();
      expect(config.get("debugMode")).toBeUndefined();
      expect(config.getProvidingStratum("debugMode")).toBe(
        ConfigStrata.defaults
      );
    });

    it("returns undefined when no strata are set at all", function () {
      const config = new StratifiedConfig(testSchema);
      expect(config.get("appName")).toBeUndefined();
    });
  });

  describe("resolution priority", function () {
    it("definition stratum wins over defaults", function () {
      const config = createConfig();
      config.update(ConfigStrata.definition, { appName: "Config App" });
      expect(config.get("appName")).toBe("Config App");
    });

    it("underride stratum wins over defaults but loses to definition", function () {
      const config = createConfig();
      config.update(ConfigStrata.underride, { appName: "Underride" });
      config.update(ConfigStrata.definition, { appName: "Definition" });
      expect(config.get("appName")).toBe("Definition");
    });

    it("override stratum wins over definition stratum", function () {
      const config = createConfig();
      config.update(ConfigStrata.definition, { appName: "Definition" });
      config.update(ConfigStrata.override, { appName: "Override" });
      expect(config.get("appName")).toBe("Override");
    });

    it("user stratum wins over all other strata", function () {
      const config = createConfig();
      config.update(ConfigStrata.underride, { appName: "Underride" });
      config.update(ConfigStrata.definition, { appName: "Definition" });
      config.update(ConfigStrata.override, { appName: "Override" });
      config.update(ConfigStrata.user, { appName: "User" });
      expect(config.get("appName")).toBe("User");
    });

    it("full priority chain: user > override > definition > underride > defaults", function () {
      const config = createConfig();

      expect(config.get("appName")).toBe("Default App");

      config.update(ConfigStrata.underride, { appName: "Underride" });
      expect(config.get("appName")).toBe("Underride");

      config.update(ConfigStrata.definition, { appName: "Definition" });
      expect(config.get("appName")).toBe("Definition");

      config.update(ConfigStrata.override, { appName: "Override" });
      expect(config.get("appName")).toBe("Override");

      config.update(ConfigStrata.user, { appName: "User" });
      expect(config.get("appName")).toBe("User");
    });
  });

  describe("undefined handling", function () {
    it("skips strata where the key is absent (not present in the partial)", function () {
      const config = createConfig();
      config.update(ConfigStrata.user, {}); // appName not set
      config.update(ConfigStrata.definition, { appName: "Definition" });
      expect(config.get("appName")).toBe("Definition");
    });

    it("treats undefined as 'not set in this stratum' and falls through", function () {
      const config = createConfig();
      config.update(ConfigStrata.user, { appName: undefined });
      config.update(ConfigStrata.definition, { appName: "Definition" });
      expect(config.get("appName")).toBe("Definition");
    });

    it("resolves independent keys from different strata", function () {
      const config = createConfig();
      config.update(ConfigStrata.definition, { appName: "Config App" });
      config.update(ConfigStrata.user, { maxFeatures: 50 });
      expect(config.get("appName")).toBe("Config App");
      expect(config.get("maxFeatures")).toBe(50);
    });
  });

  describe("stratum attribution", function () {
    it("reports the stratum that provided the value", function () {
      const config = createConfig();
      config.update(ConfigStrata.definition, { appName: "Config" });
      expect(config.getProvidingStratum("appName")).toBe(
        ConfigStrata.definition
      );
    });

    it("reports user stratum when user wins over definition", function () {
      const config = createConfig();
      config.update(ConfigStrata.definition, { appName: "Config" });
      config.update(ConfigStrata.user, { appName: "User" });
      expect(config.getProvidingStratum("appName")).toBe(ConfigStrata.user);
    });

    it("reports defaults stratum when no strata have the key set", function () {
      const config = createConfig();
      config.update(ConfigStrata.user, {}); // key not set
      expect(config.getProvidingStratum("appName")).toBe(ConfigStrata.defaults);
    });

    it("reports defaults when value is set to undefined in all strata", function () {
      const config = createConfig();
      config.update(ConfigStrata.user, { appName: undefined });
      config.update(ConfigStrata.definition, { appName: undefined });
      expect(config.getProvidingStratum("appName")).toBe(ConfigStrata.defaults);
    });
  });

  describe("stratum access", function () {
    it("returns undefined for an unset stratum", function () {
      const config = createConfig();
      expect(config.getStratum(ConfigStrata.definition)).toBeUndefined();
    });

    it("returns the values set in a stratum", function () {
      const config = createConfig();
      config.update(ConfigStrata.definition, { appName: "Config" });
      expect(config.getStratum(ConfigStrata.definition)).toEqual({
        appName: "Config"
      });
    });

    it("merges into the existing stratum on subsequent update calls", function () {
      const config = createConfig();
      config.update(ConfigStrata.definition, { appName: "First" });
      config.update(ConfigStrata.definition, { maxFeatures: 10 });
      expect(config.get("appName")).toBe("First"); // preserved from first update
      expect(config.get("maxFeatures")).toBe(10);
    });

    it("overwrites a key when the same key is updated again", function () {
      const config = createConfig();
      config.update(ConfigStrata.definition, { appName: "First" });
      config.update(ConfigStrata.definition, { appName: "Second" });
      expect(config.get("appName")).toBe("Second");
    });
  });

  describe("update schema validation", function () {
    it("stores a valid value in the stratum", function () {
      const config = createConfig();
      config.update(ConfigStrata.definition, { appName: "Valid" });
      expect(config.get("appName")).toBe("Valid");
    });

    it("rejects the whole update when a value has an invalid type", function () {
      const config = createConfig();
      config.update(ConfigStrata.definition, { appName: 42 as any });
      // whole input rejected — falls through to defaults stratum
      expect(config.get("appName")).toBe("Default App");
    });

    it("drops unknown keys silently", function () {
      const config = new StratifiedConfig(testSchema);
      config.update(ConfigStrata.definition, {
        unknownKey: "value"
      } as any);
      expect(config.getStratum(ConfigStrata.definition)).toEqual({});
    });

    it("rejects the whole input when any value has an invalid type", function () {
      const config = createConfig();
      config.update(ConfigStrata.definition, {
        appName: "Valid",
        maxFeatures: "not-a-number" as any
      });
      // whole input rejected — both keys fall through to defaults stratum
      expect(config.get("appName")).toBe("Default App");
      expect(config.get("maxFeatures")).toBe(100);
    });
  });

  describe("setValue", function () {
    it("sets a single key without disturbing other keys in the stratum", function () {
      const config = createConfig();
      config.update(ConfigStrata.definition, {
        appName: "Config",
        maxFeatures: 42
      });
      config.setValue(ConfigStrata.definition, "appName", "Updated");
      expect(config.get("appName")).toBe("Updated");
      expect(config.get("maxFeatures")).toBe(42); // untouched
    });

    it("creates the stratum if it does not exist yet", function () {
      const config = createConfig();
      config.setValue(ConfigStrata.user, "appName", "User App");
      expect(config.get("appName")).toBe("User App");
    });

    it("respects priority — user setValue wins over definition update", function () {
      const config = createConfig();
      config.update(ConfigStrata.definition, { appName: "Config" });
      config.setValue(ConfigStrata.user, "appName", "User");
      expect(config.get("appName")).toBe("User");
    });
  });

  describe("parseInput", function () {
    it("returns only keys present in the raw input", function () {
      const config = new StratifiedConfig(testSchema);
      const result = config.parseInput({ appName: "Parsed" });
      expect(result).toEqual({ appName: "Parsed" });
      expect("maxFeatures" in result).toBe(false);
    });

    it("returns empty object when any value fails schema validation", function () {
      const config = new StratifiedConfig(testSchema);
      const result = config.parseInput({ appName: 42 }); // wrong type
      expect(result).toEqual({});
    });

    it("ignores keys not in the schema", function () {
      const config = new StratifiedConfig(testSchema);
      const result = config.parseInput({ unknownKey: "value", appName: "OK" });
      expect(result).toEqual({ appName: "OK" });
      expect("unknownKey" in result).toBe(false);
    });

    it("does NOT inject defaults for absent keys", function () {
      const config = new StratifiedConfig(testSchema);
      const result = config.parseInput({});
      expect(Object.keys(result).length).toBe(0);
    });

    it("returns empty object for non-object input", function () {
      const config = new StratifiedConfig(testSchema);
      expect(config.parseInput(null)).toEqual({});
      expect(config.parseInput("string")).toEqual({});
      expect(config.parseInput([])).toEqual({});
    });
  });

  describe("direct property access (proxy behaviour)", function () {
    it("exposes every schema key as a direct property", function () {
      const config = createConfig();
      expect((config as any).appName).toBe("Default App");
      expect((config as any).maxFeatures).toBe(100);
      expect((config as any).debugMode).toBeUndefined();
    });

    it("direct property mirrors config.get() result", function () {
      const config = createConfig();
      expect((config as any).appName).toBe(config.get("appName"));
      expect((config as any).maxFeatures).toBe(config.get("maxFeatures"));
    });

    it("direct property reflects strata resolution (same path as get())", function () {
      const config = createConfig();
      config.update(ConfigStrata.definition, { appName: "Config" });
      expect((config as any).appName).toBe(config.get("appName"));
    });

    it("does not define properties that shadow existing class methods", function () {
      const config = createConfig();
      expect(typeof config.get).toBe("function");
      expect(typeof config.update).toBe("function");
      expect(typeof config.getProvidingStratum).toBe("function");
    });
  });
});
