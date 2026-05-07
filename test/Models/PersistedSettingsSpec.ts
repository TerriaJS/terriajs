import CommonStrata from "../../lib/Models/Definition/CommonStrata";
import {
  PersistedSettings,
  StorageAdapter
} from "../../lib/Models/PersistedSettings";
import {
  TerriaConfig,
  createTerriaConfig
} from "../../lib/Models/TerriaConfig";

type Store = Record<string, boolean | string | null>;

const makeAdapter = (
  initial: Store = {}
): StorageAdapter & { store: Store } => {
  const store: Store = { ...initial };
  return {
    store,
    getItem: (key: string): boolean | string | null => store[key] ?? null,
    setItem: (key: string, value: boolean | number | string) => {
      store[key] = value as boolean | string;
    }
  };
};

describe("PersistedSettings", () => {
  let config: TerriaConfig;

  beforeEach(() => {
    config = createTerriaConfig();
  });

  describe("read", () => {
    it("reads a viewermode string from storage", () => {
      const adapter = makeAdapter({ viewermode: "2d" });
      const ps = new PersistedSettings(config, adapter);
      expect(ps.read("viewermode")).toBe("2d");
    });

    it("reads useNativeResolution from storage", () => {
      const adapter = makeAdapter({ useNativeResolution: "true" });
      const ps = new PersistedSettings(config, adapter);
      expect(ps.read("useNativeResolution")).toBe(true);
    });

    it("reads shortenShareUrls from storage", () => {
      const adapter = makeAdapter({ shortenShareUrls: "true" });
      const ps = new PersistedSettings(config, adapter);
      expect(ps.read("shortenShareUrls")).toBe(true);
    });

    it("reads baseMaximumScreenSpaceError from storage", () => {
      const adapter = makeAdapter({ baseMaximumScreenSpaceError: "4" });
      const ps = new PersistedSettings(config, adapter);
      expect(ps.read("baseMaximumScreenSpaceError")).toBe(4);
    });

    it("reads a basemap string from storage", () => {
      const adapter = makeAdapter({ basemap: "basemap-bing-aerial" });
      const ps = new PersistedSettings(config, adapter);
      expect(ps.read("basemap")).toBe("basemap-bing-aerial");
    });

    it("reads a viewer mode string from storage", () => {
      const adapter = makeAdapter({ viewermode: "2d" });
      const ps = new PersistedSettings(config, adapter);
      expect(ps.read("viewermode")).toBe("2d");
    });

    it("returns undefined when the key is absent from storage", () => {
      const adapter = makeAdapter();
      const ps = new PersistedSettings(config, adapter);
      expect(ps.read("viewermode")).toBeUndefined();
    });

    it("returns undefined when the value fails schema validation", () => {
      const adapter = makeAdapter({ viewermode: "4d" });
      const ps = new PersistedSettings(config, adapter);
      expect(ps.read("viewermode")).toBeUndefined();
    });
  });

  describe("mapToConfigParams", () => {
    it("reads useNativeResolution from storage as a boolean", () => {
      const adapter = makeAdapter({ useNativeResolution: "true" });
      const ps = new PersistedSettings(config, adapter);
      expect(ps.mapToConfigParams().useNativeResolution).toBe(true);
    });

    it("reads baseMaximumScreenSpaceError from storage as a number", () => {
      const adapter = makeAdapter({ baseMaximumScreenSpaceError: "4" });
      const ps = new PersistedSettings(config, adapter);
      expect(ps.mapToConfigParams().baseMaximumScreenSpaceError).toBe(4);
    });

    it("reads shortenShareUrls from storage as a boolean", () => {
      const adapter = makeAdapter({ shortenShareUrls: "false" });
      const ps = new PersistedSettings(config, adapter);
      expect(ps.mapToConfigParams().shortenShareUrls).toBe(false);
    });

    it("reads all three config keys in a single call", () => {
      const adapter = makeAdapter({
        useNativeResolution: "true",
        baseMaximumScreenSpaceError: "2",
        shortenShareUrls: "false"
      });
      const ps = new PersistedSettings(config, adapter);
      expect(ps.mapToConfigParams()).toEqual({
        useNativeResolution: true,
        baseMaximumScreenSpaceError: 2,
        shortenShareUrls: false
      });
    });
  });

  describe("initConfigSync", () => {
    it("writes useNativeResolution to storage when config changes", () => {
      const adapter = makeAdapter();
      const ps = new PersistedSettings(config, adapter);
      ps.initConfigSync();

      config.update(CommonStrata.user, { useNativeResolution: true });

      expect(adapter.store["useNativeResolution"]).toBeDefined();
    });

    it("writes baseMaximumScreenSpaceError to storage when config changes", () => {
      const adapter = makeAdapter();
      const ps = new PersistedSettings(config, adapter);
      ps.initConfigSync();

      config.update(CommonStrata.user, { baseMaximumScreenSpaceError: 4 });

      expect(adapter.store["baseMaximumScreenSpaceError"]).toBeDefined();
    });

    it("writes shortenShareUrls to storage when config changes", () => {
      const adapter = makeAdapter();
      const ps = new PersistedSettings(config, adapter);
      ps.initConfigSync();

      config.update(CommonStrata.user, { shortenShareUrls: true });

      expect(adapter.store["shortenShareUrls"]).toBeDefined();
    });

    it("returns one disposer", () => {
      const adapter = makeAdapter();
      const ps = new PersistedSettings(config, adapter);
      const disposers = ps.initConfigSync();
      expect(disposers.length).toBe(1);
      disposers.forEach((d) => d());
    });

    it("stops reacting after the disposer is called", () => {
      const adapter = makeAdapter();
      const ps = new PersistedSettings(config, adapter);
      const disposers = ps.initConfigSync();
      disposers.forEach((d) => d());

      config.update(CommonStrata.user, { useNativeResolution: true });

      expect("useNativeResolution" in adapter.store).toBe(false);
    });
  });
});
