import queryToObject from "terriajs-cesium/Source/Core/queryToObject";
import { parseHashParams } from "../../lib/Models/HashParams";

const parseUrl = (url: string) => {
  const urlObj = new URL(url);
  return queryToObject(urlObj.hash.substring(1));
};

describe("parseHashParams", () => {
  it("returns all-empty defaults when hash is empty", () => {
    const result = parseHashParams({});

    expect(result.clean).toBe(false);
    expect(result.hideWelcomeMessage).toBe(false);
    expect(result.map).toBeUndefined();
    expect(result.ignoreErrors).toBeUndefined();
    expect(result.hideWorkbench).toBeUndefined();
    expect(result.hideExplorerPanel).toBeUndefined();
    expect(result.start).toBeUndefined();
    expect(result.share).toBeUndefined();
    expect(result.tools).toBeUndefined();
    expect(result.initFragments).toEqual([]);
    expect(result.extra).toEqual({});
  });

  describe("flag params (presence matters, value ignored)", () => {
    it("sets clean to true when #clean is present", () => {
      const params = parseUrl("http://terria.com/#clean");
      expect(parseHashParams(params).clean).toBe(true);
    });

    it("sets hideWelcomeMessage to true when #hideWelcomeMessage is present", () => {
      const params = parseUrl("http://terria.com/#hideWelcomeMessage=1");
      expect(parseHashParams(params).hideWelcomeMessage).toBe(true);
    });

    it("sets tools to true when #tools is present", () => {
      const params = parseUrl("http://terria.com/#tools=1");
      expect(parseHashParams(params).tools).toBe(true);
    });
  });

  describe("viewer mode (#map=)", () => {
    it("parses a valid viewer mode", () => {
      const params = parseUrl("http://terria.com/#map=2d");
      expect(parseHashParams(params).map).toBe("2d");

      const params3d = parseUrl("http://terria.com/#map=3d");
      expect(parseHashParams(params3d).map).toBe("3d");

      const params3dSmooth = parseUrl("http://terria.com/#map=3dsmooth");
      expect(parseHashParams(params3dSmooth).map).toBe("3dsmooth");
    });

    it("returns undefined for an unknown viewer mode", () => {
      const params = parseUrl("http://terria.com/#map=unknown");
      expect(parseHashParams(params).map).toBeUndefined();
    });

    it("returns undefined when #map is absent", () => {
      const params = parseUrl("http://terria.com/");
      expect(parseHashParams(params).map).toBeUndefined();
    });
  });

  describe("named value params", () => {
    it("reads ignoreErrors value", () => {
      const params = parseUrl("http://terria.com/#ignoreErrors=1");
      expect(parseHashParams(params).ignoreErrors).toBe(true);
    });

    it("reads hideWorkbench value", () => {
      const params = parseUrl("http://terria.com/#hideWorkbench=1");
      expect(parseHashParams(params).hideWorkbench).toBe(true);
    });

    it("reads hideExplorerPanel value", () => {
      const params = parseUrl("http://terria.com/#hideExplorerPanel=1");
      expect(parseHashParams(params).hideExplorerPanel).toBe(true);
    });

    it("reads start value", () => {
      const json = '{"version":"8.0.0"}';
      const params = parseUrl(`http://terria.com/#start={"version":"8.0.0"}`);

      // @ts-expect-error start is typed as unknown
      expect(parseHashParams(params).start).toEqual(JSON.parse(json));
    });

    it("reads share value", () => {
      const params = parseUrl("http://terria.com/#share=abc123");
      expect(parseHashParams(params).share).toBe("abc123");
    });
  });

  describe("initFragments — keys with no value become init source names", () => {
    it("collects keys with empty values as initFragments", () => {
      const hashParams = parseUrl("http://terria.com/#myInitFile&anotherFile");
      const result = parseHashParams(hashParams);
      expect(result.initFragments).toEqual(["myInitFile", "anotherFile"]);
    });

    it("does not include named special keys in initFragments", () => {
      const hashParams = parseUrl(
        "http://terria.com/#clean&hideWelcomeMessage&myInitFile&anotherFile"
      );
      const result = parseHashParams(hashParams);
      expect(result.initFragments).toEqual(["myInitFile", "anotherFile"]);
    });
  });

  describe("extra — unknown params with values", () => {
    it("collects unknown params with values in extra", () => {
      const hashParams = parseUrl(
        "http://terria.com/#portalUsername=alice&customParam=foo"
      );

      const result = parseHashParams(hashParams);
      expect(result.extra).toEqual({
        portalUsername: "alice",
        customParam: "foo"
      });
    });

    it("does not include named special keys in extra", () => {
      const hashParams = parseUrl(
        "http://terria.com/#map=2d&ignoreErrors=1&hideWorkbench=1&hideExplorerPanel=1&activeTabId=catalog&start={}&share=abc"
      );
      const result = parseHashParams(hashParams);
      expect(result.extra).toEqual({ activeTabId: "catalog" });
    });

    it("does not include params with empty values in extra", () => {
      const hashParams = parseUrl("http://terria.com/#initFile=");
      const result = parseHashParams(hashParams);
      expect(result.extra["initFile"]).toBeUndefined();
    });
  });

  it("correctly splits a realistic hash into all fields", () => {
    const hashParams = parseUrl(
      "http://terria.com/#map=3d&hideWelcomeMessage&myInit&portalUsername=alice"
    );
    const result = parseHashParams(hashParams);
    expect(result.map).toBe("3d");
    expect(result.hideWelcomeMessage).toBe(true);
    expect(result.initFragments).toEqual(["myInit"]);
    expect(result.extra).toEqual({ portalUsername: "alice" });
  });
});
