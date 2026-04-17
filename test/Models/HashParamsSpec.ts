import { parseHashParams } from "../../lib/Models/HashParams";

describe("parseHashParams", () => {
  it("returns all-empty defaults when hash is empty", () => {
    const result = parseHashParams({});
    expect(result.clean).toBe(false);
    expect(result.hideWelcomeMessage).toBe(false);
    expect(result.map).toBeUndefined();
    expect(result.ignoreErrors).toBeFalse();
    expect(result.hideWorkbench).toBeFalse();
    expect(result.hideExplorerPanel).toBeFalse();
    expect(result.start).toBeUndefined();
    expect(result.share).toBeUndefined();
    expect(result.tools).toBeUndefined();
    expect(result.initFragments).toEqual([]);
    expect(result.extra).toEqual({});
  });

  describe("flag params (presence matters, value ignored)", () => {
    it("sets clean to true when #clean is present", () => {
      expect(parseHashParams({ clean: "" }).clean).toBe(true);
    });

    it("sets hideWelcomeMessage to true when #hideWelcomeMessage is present", () => {
      expect(
        parseHashParams({ hideWelcomeMessage: "" }).hideWelcomeMessage
      ).toBe(true);
    });

    it("sets tools to true when #tools is present", () => {
      expect(parseHashParams({ tools: "1" }).tools).toBe(true);
    });
  });

  describe("viewer mode (#map=)", () => {
    it("parses a valid viewer mode", () => {
      expect(parseHashParams({ map: "2d" }).map).toBe("2d");
      expect(parseHashParams({ map: "3d" }).map).toBe("3d");
      expect(parseHashParams({ map: "3dsmooth" }).map).toBe("3dsmooth");
    });

    it("returns undefined for an unknown viewer mode", () => {
      expect(parseHashParams({ map: "unknown" }).map).toBeUndefined();
    });

    it("returns undefined when #map is absent", () => {
      expect(parseHashParams({}).map).toBeUndefined();
    });
  });

  describe("named value params", () => {
    it("reads ignoreErrors value", () => {
      expect(parseHashParams({ ignoreErrors: "1" }).ignoreErrors).toBe(true);
    });

    it("reads hideWorkbench value", () => {
      expect(parseHashParams({ hideWorkbench: "1" }).hideWorkbench).toBe(true);
    });

    it("reads hideExplorerPanel value", () => {
      expect(
        parseHashParams({ hideExplorerPanel: "1" }).hideExplorerPanel
      ).toBe(true);
    });

    it("reads start value", () => {
      const json = '{"version":"8.0.0"}';
      expect(parseHashParams({ start: json }).start).toBe(json);
    });

    it("reads share value", () => {
      expect(parseHashParams({ share: "abc123" }).share).toBe("abc123");
    });
  });

  describe("initFragments — keys with no value become init source names", () => {
    it("collects keys with empty values as initFragments", () => {
      const result = parseHashParams({ myInitFile: "", anotherFile: "" });
      expect(result.initFragments).toContain("myInitFile");
      expect(result.initFragments).toContain("anotherFile");
    });

    it("does not include named special keys in initFragments", () => {
      const result = parseHashParams({ clean: "", hideWelcomeMessage: "" });
      expect(result.initFragments).toEqual([]);
    });
  });

  describe("extra — unknown params with values", () => {
    it("collects unknown params with values in extra", () => {
      const result = parseHashParams({
        portalUsername: "alice",
        customParam: "foo"
      });
      expect(result.extra).toEqual({
        portalUsername: "alice",
        customParam: "foo"
      });
    });

    it("does not include named special keys in extra", () => {
      const result = parseHashParams({
        map: "2d",
        ignoreErrors: "1",
        hideWorkbench: "1",
        hideExplorerPanel: "1",
        activeTabId: "catalog",
        start: "{}",
        share: "abc"
      });
      expect(result.extra).toEqual({});
    });

    it("does not include params with empty values in extra", () => {
      const result = parseHashParams({ initFile: "" });
      expect(result.extra["initFile"]).toBeUndefined();
    });
  });

  it("correctly splits a realistic hash into all fields", () => {
    const result = parseHashParams({
      map: "3d",
      hideWelcomeMessage: "",
      myInit: "",
      portalUsername: "alice"
    });
    expect(result.map).toBe("3d");
    expect(result.hideWelcomeMessage).toBe(true);
    expect(result.initFragments).toEqual(["myInit"]);
    expect(result.extra).toEqual({ portalUsername: "alice" });
  });
});
