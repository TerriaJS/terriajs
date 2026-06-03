import CommonStrata from "../../lib/Models/Definition/CommonStrata";
import { createTerriaConfig } from "../../lib/Models/TerriaConfig";

describe("TerriaConfig", function () {
  describe("defaults (from configSchema via strata)", function () {
    it("has the expected default appName", function () {
      expect(createTerriaConfig().appName).toBe("TerriaJS App");
    });

    it("has false default for useNativeResolution", function () {
      expect(createTerriaConfig().useNativeResolution).toBe(false);
    });

    it("has default baseMaximumScreenSpaceError of 2", function () {
      expect(createTerriaConfig().baseMaximumScreenSpaceError).toBe(2);
    });

    it("has undefined default for shortenShareUrls", function () {
      expect(createTerriaConfig().shortenShareUrls).toBeUndefined();
    });

    it("has the expected default supportEmail", function () {
      expect(createTerriaConfig().supportEmail).toBe("info@terria.io");
    });

    it("has the expected default initFragmentPaths", function () {
      expect(createTerriaConfig().initFragmentPaths).toEqual(["init/"]);
    });

    it("has the expected default storyEnabled", function () {
      expect(createTerriaConfig().storyEnabled).toBe(true);
    });

    it("has the expected default persistViewerMode", function () {
      expect(createTerriaConfig().persistViewerMode).toBe(true);
    });

    it("has the expected default leafletMaxZoom", function () {
      expect(createTerriaConfig().leafletMaxZoom).toBe(18);
    });
  });

  describe("update (definition)", function () {
    it("updates only the specified fields, leaving others at default", function () {
      const config = createTerriaConfig();
      config.update(CommonStrata.definition, { appName: "My App" });

      expect(config.appName).toBe("My App");
      expect(config.supportEmail).toBe("info@terria.io"); // default unchanged
    });

    it("uses the last value when the same field is written twice", function () {
      const config = createTerriaConfig();
      config.update(CommonStrata.definition, { appName: "First" });
      config.update(CommonStrata.definition, { appName: "Second" });

      expect(config.appName).toBe("Second");
    });

    it("accumulates keys across multiple calls", function () {
      const config = createTerriaConfig();
      config.update(CommonStrata.definition, { appName: "My App" });
      config.update(CommonStrata.definition, {
        supportEmail: "support@example.com"
      });

      expect(config.appName).toBe("My App");
      expect(config.supportEmail).toBe("support@example.com");
    });

    it("can override array fields", function () {
      const config = createTerriaConfig();
      config.update(CommonStrata.definition, {
        initFragmentPaths: ["custom/", "fallback/"]
      });

      expect(config.initFragmentPaths).toEqual(["custom/", "fallback/"]);
    });

    it("rejects the whole update when a value has an invalid type", function () {
      const config = createTerriaConfig();
      config.update(CommonStrata.definition, { appName: 42 as any });

      expect(config.appName).toBe("TerriaJS App"); // whole input rejected, falls to default
    });
  });

  describe("strata priority", function () {
    it("update applies values readable as direct properties", function () {
      const config = createTerriaConfig();
      config.update(CommonStrata.definition, { appName: "From Config" });
      expect(config.appName).toBe("From Config");
    });

    it("user stratum wins over definition stratum", function () {
      const config = createTerriaConfig();
      config.update(CommonStrata.definition, { appName: "From Config" });
      config.update(CommonStrata.user, { appName: "User Override" });
      expect(config.appName).toBe("User Override");
    });

    it("setting definition after user does not lower the user value", function () {
      const config = createTerriaConfig();
      config.update(CommonStrata.user, { appName: "User Override" });
      config.update(CommonStrata.definition, { appName: "From Config" });
      expect(config.appName).toBe("User Override");
    });

    it("strata defaults are used when no stratum provides a value", function () {
      const config = createTerriaConfig();
      expect(config.appName).toBe("TerriaJS App"); // falls back to schema default
    });

    it("setting one stratum does not clear values in another stratum", function () {
      const config = createTerriaConfig();
      config.update(CommonStrata.definition, { appName: "Config" });
      config.update(CommonStrata.user, { supportEmail: "user@example.com" });
      expect(config.appName).toBe("Config");
      expect(config.supportEmail).toBe("user@example.com");
    });

    it("setValue updates one key without disturbing others in the same stratum", function () {
      const config = createTerriaConfig();
      config.update(CommonStrata.user, {
        appName: "User App",
        ignoreErrors: true
      });
      config.setValue(CommonStrata.user, "appName", "Renamed");
      expect(config.appName).toBe("Renamed");
      expect(config.ignoreErrors).toBe(true); // untouched
    });

    it("setValue respects stratum priority", function () {
      const config = createTerriaConfig();
      config.setValue(CommonStrata.definition, "appName", "Config");
      config.setValue(CommonStrata.user, "appName", "User");
      expect(config.appName).toBe("User");
    });
  });

  describe("stratum attribution", function () {
    it("getProvidingStratum reports defaults before any stratum is set", function () {
      const config = createTerriaConfig();
      expect(config.getProvidingStratum("appName")).toBe(CommonStrata.defaults);
    });

    it("getProvidingStratum reports the stratum that provided the value", function () {
      const config = createTerriaConfig();
      config.update(CommonStrata.definition, { appName: "Config" });
      expect(config.getProvidingStratum("appName")).toBe(
        CommonStrata.definition
      );
    });

    it("getProvidingStratum reports user when user wins", function () {
      const config = createTerriaConfig();
      config.update(CommonStrata.definition, { appName: "Config" });
      config.update(CommonStrata.user, { appName: "User" });
      expect(config.getProvidingStratum("appName")).toBe(CommonStrata.user);
    });

    it("update into definition is reported as definition by getProvidingStratum", function () {
      const config = createTerriaConfig();
      config.update(CommonStrata.definition, { appName: "My App" });
      expect(config.getProvidingStratum("appName")).toBe(
        CommonStrata.definition
      );
    });
  });
});
