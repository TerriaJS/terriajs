import { TerriaConfig } from "../../lib/Models/TerriaConfig";

describe("TerriaConfig", function () {
  describe("defaults", () => {
    it("has the expected default appName", function () {
      const config = new TerriaConfig();
      expect(config.appName).toBe("TerriaJS App");
    });

    it("has the expected default supportEmail", function () {
      const config = new TerriaConfig();
      expect(config.supportEmail).toBe("info@terria.io");
    });

    it("has the expected default initFragmentPaths", function () {
      const config = new TerriaConfig();
      expect(config.initFragmentPaths).toEqual(["init/"]);
    });

    it("has the expected default storyEnabled", function () {
      const config = new TerriaConfig();
      expect(config.storyEnabled).toBe(true);
    });

    it("has the expected default persistViewerMode", function () {
      const config = new TerriaConfig();
      expect(config.persistViewerMode).toBe(true);
    });

    it("has the expected default leafletMaxZoom", function () {
      const config = new TerriaConfig();
      expect(config.leafletMaxZoom).toBe(18);
    });
  });

  describe("update config", function () {
    it("updates only the specified fields, leaving others at default", function () {
      const config = new TerriaConfig();
      config.update({ appName: "My App" });

      expect(config.appName).toBe("My App");
      expect(config.supportEmail).toBe("info@terria.io"); // default unchanged
    });

    it("does not overwrite existing value when undefined is applied", function () {
      const config = new TerriaConfig();
      config.update({ appName: undefined });

      expect(config.appName).toBe("TerriaJS App");
    });

    it("uses last value when the same field is applied twice", function () {
      const config = new TerriaConfig();
      config.update({ appName: "First" });
      config.update({ appName: "Second" });

      expect(config.appName).toBe("Second");
    });

    it("silently ignores unknown keys", function () {
      const config = new TerriaConfig();
      expect(() => config.update({ unknownKey: "value" } as any)).not.toThrow();
      expect((config as any).unknownKey).toBeUndefined();
    });

    it("accumulates multiple sequential applies", function () {
      const config = new TerriaConfig();
      config.update({ appName: "My App" });
      config.update({ supportEmail: "support@example.com" });

      expect(config.appName).toBe("My App");
      expect(config.supportEmail).toBe("support@example.com");
    });

    it("can override array fields", function () {
      const config = new TerriaConfig();
      config.update({ initFragmentPaths: ["custom/", "fallback/"] });

      expect(config.initFragmentPaths).toEqual(["custom/", "fallback/"]);
    });
  });
});
