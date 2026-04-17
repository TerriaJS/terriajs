import { TerriaConfig } from "../../lib/Models/TerriaConfig";

describe("TerriaConfig", function () {
  describe("defaults", () => {
    it("has the expected default appName", function () {
      const config = new TerriaConfig(jasmine.createSpy("setLocalProperty"));
      expect(config.appName).toBe("TerriaJS App");
    });

    // Viewer settings default to match former Terria observable defaults
    it("has false default for useNativeResolution", function () {
      expect(
        new TerriaConfig(jasmine.createSpy("setLocalProperty"))
          .useNativeResolution
      ).toBe(false);
    });

    it("has default baseMaximumScreenSpaceError of 2", function () {
      expect(
        new TerriaConfig(jasmine.createSpy("setLocalProperty"))
          .baseMaximumScreenSpaceError
      ).toBe(2);
    });

    it("has undefined default for shortenShareUrls", function () {
      expect(
        new TerriaConfig(jasmine.createSpy("setLocalProperty")).shortenShareUrls
      ).toBeUndefined();
    });

    it("has the expected default supportEmail", function () {
      const config = new TerriaConfig(jasmine.createSpy("setLocalProperty"));
      expect(config.supportEmail).toBe("info@terria.io");
    });

    it("has the expected default initFragmentPaths", function () {
      const config = new TerriaConfig(jasmine.createSpy("setLocalProperty"));
      expect(config.initFragmentPaths).toEqual(["init/"]);
    });

    it("has the expected default storyEnabled", function () {
      const config = new TerriaConfig(jasmine.createSpy("setLocalProperty"));
      expect(config.storyEnabled).toBe(true);
    });

    it("has the expected default persistViewerMode", function () {
      const config = new TerriaConfig(jasmine.createSpy("setLocalProperty"));
      expect(config.persistViewerMode).toBe(true);
    });

    it("has the expected default leafletMaxZoom", function () {
      const config = new TerriaConfig(jasmine.createSpy("setLocalProperty"));
      expect(config.leafletMaxZoom).toBe(18);
    });
  });

  describe("update config", function () {
    it("updates only the specified fields, leaving others at default", function () {
      const config = new TerriaConfig(jasmine.createSpy("setLocalProperty"));
      config.update({ appName: "My App" });

      expect(config.appName).toBe("My App");
      expect(config.supportEmail).toBe("info@terria.io"); // default unchanged
    });

    it("uses last value when the same field is applied twice", function () {
      const config = new TerriaConfig(jasmine.createSpy("setLocalProperty"));
      config.update({ appName: "First" });
      config.update({ appName: "Second" });

      expect(config.appName).toBe("Second");
    });

    it("silently ignores unknown keys", function () {
      const config = new TerriaConfig(jasmine.createSpy("setLocalProperty"));
      expect(() => config.update({ unknownKey: "value" } as any)).not.toThrow();
      expect((config as any).unknownKey).toBeUndefined();
    });

    it("accumulates multiple sequential updates", function () {
      const config = new TerriaConfig(jasmine.createSpy("setLocalProperty"));
      config.update({ appName: "My App" });
      config.update({ supportEmail: "support@example.com" });

      expect(config.appName).toBe("My App");
      expect(config.supportEmail).toBe("support@example.com");
    });

    it("can override array fields", function () {
      const config = new TerriaConfig(jasmine.createSpy("setLocalProperty"));
      config.update({ initFragmentPaths: ["custom/", "fallback/"] });

      expect(config.initFragmentPaths).toEqual(["custom/", "fallback/"]);
    });

    it('should update local storage when "shortenShareUrls" is updated', function () {
      const setLocalPropertySpy = jasmine.createSpy("setLocalProperty");
      const config = new TerriaConfig(setLocalPropertySpy);
      config.update({ shortenShareUrls: true });

      expect(setLocalPropertySpy).toHaveBeenCalledWith(
        "shortenShareUrls",
        true
      );
    });

    it('should update local storage when "useNativeResolution" is updated', function () {
      const setLocalPropertySpy = jasmine.createSpy("setLocalProperty");
      const config = new TerriaConfig(setLocalPropertySpy);
      config.update({ useNativeResolution: true });

      expect(setLocalPropertySpy).toHaveBeenCalledWith(
        "useNativeResolution",
        true
      );
    });

    it('should update local storage when "baseMaximumScreenSpaceError" is updated', function () {
      const setLocalPropertySpy = jasmine.createSpy("setLocalProperty");
      const config = new TerriaConfig(setLocalPropertySpy);
      config.update({ baseMaximumScreenSpaceError: 3 });

      expect(setLocalPropertySpy).toHaveBeenCalledWith(
        "baseMaximumScreenSpaceError",
        "3"
      );
    });
  });
});
