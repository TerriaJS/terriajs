import { readLocalStorageSettings } from "../../lib/Models/PersistedSettings";

describe("readLocalStorageSettings", () => {
  const makeGetLocalProp =
    (store: Record<string, string | boolean | null>) => (key: string) =>
      store[key] ?? null;

  it("returns no viewerMode or baseMapId when storage is empty", () => {
    const result = readLocalStorageSettings(makeGetLocalProp({}), true);
    expect(result.viewerMode).toBeUndefined();
    expect(result.baseMapId).toBeUndefined();
    expect(result.useNativeResolution).toBeUndefined();
    expect(result.baseMaximumScreenSpaceError).toBeUndefined();
    expect(result.shortenShareUrls).toBeUndefined();
  });

  it("reads baseMapId from storage", () => {
    const result = readLocalStorageSettings(
      makeGetLocalProp({ basemap: "basemap-bing-aerial" }),
      true
    );
    expect(result.baseMapId).toBe("basemap-bing-aerial");
  });

  it("reads useNativeResolution from storage", () => {
    const result = readLocalStorageSettings(
      makeGetLocalProp({ useNativeResolution: true }),
      true
    );
    expect(result.useNativeResolution).toBe(true);
  });

  it("reads baseMaximumScreenSpaceError from storage", () => {
    const result = readLocalStorageSettings(
      makeGetLocalProp({ baseMaximumScreenSpaceError: "4" }),
      true
    );
    expect(result.baseMaximumScreenSpaceError).toBe(4);
  });

  it("ignores non-numeric baseMaximumScreenSpaceError", () => {
    const result = readLocalStorageSettings(
      makeGetLocalProp({ baseMaximumScreenSpaceError: "not-a-number" }),
      true
    );
    expect(result.baseMaximumScreenSpaceError).toBeUndefined();
  });

  it("reads a valid viewerMode when persistViewerMode is true", () => {
    const result = readLocalStorageSettings(
      makeGetLocalProp({ viewermode: "2d" }),
      true
    );
    expect(result.viewerMode).toBe("2d");
  });

  it("ignores viewerMode when persistViewerMode is false", () => {
    const result = readLocalStorageSettings(
      makeGetLocalProp({ viewermode: "2d" }),
      false
    );
    expect(result.viewerMode).toBeUndefined();
  });

  it("ignores unknown viewerMode strings", () => {
    const result = readLocalStorageSettings(
      makeGetLocalProp({ viewermode: "unknown-mode" }),
      true
    );
    expect(result.viewerMode).toBeUndefined();
  });

  it("reads shortenShareUrls from storage", () => {
    const result = readLocalStorageSettings(
      makeGetLocalProp({ shortenShareUrls: true }),
      true
    );
    expect(result.shortenShareUrls).toBe(true);
  });

  it("ignores non-boolean shortenShareUrls", () => {
    const result = readLocalStorageSettings(
      makeGetLocalProp({ shortenShareUrls: "not-a-boolean" }),
      true
    );
    expect(result.shortenShareUrls).toBeUndefined();
  });
});
