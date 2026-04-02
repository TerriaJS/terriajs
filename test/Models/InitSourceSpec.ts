import URI from "urijs";
import {
  buildInitSourcesFromConfig,
  generateInitFragmentSource,
  isInitFromDataPromise,
  isInitFromOptions,
  isInitFromUrl
} from "../../lib/Models/InitSource";
import { http, HttpResponse } from "msw";
import { worker } from "../mocks/browser";

describe("InitSource", () => {
  describe("buildInitSourcesFromConfig()", function () {
    const baseUri = new URI("http://example.com/app/");
    const initFragmentPaths = ["init/", "http://cdn.example.com/init/"];

    it("returns empty array when config has no initializationUrls", function () {
      const sources = buildInitSourcesFromConfig(
        {},
        baseUri,
        initFragmentPaths
      );
      expect(sources.length).toBe(0);
    });

    it("converts a .json URL to an InitSourceFromUrl with absolute URL", function () {
      const sources = buildInitSourcesFromConfig(
        { initializationUrls: ["catalog/main.json"] },
        baseUri,
        initFragmentPaths
      );

      expect(sources.length).toBe(1);
      expect(isInitFromUrl(sources[0])).toBeTrue();
      if (isInitFromUrl(sources[0])) {
        expect(sources[0].initUrl).toBe(
          "http://example.com/app/catalog/main.json"
        );
      }
    });

    it("converts a non-.json fragment to InitSourceFromOptions with one option per initFragmentPath", function () {
      const sources = buildInitSourcesFromConfig(
        { initializationUrls: ["nationalparks"] },
        baseUri,
        initFragmentPaths
      );

      expect(sources.length).toBe(1);
      expect(isInitFromOptions(sources[0])).toBeTrue();
      if (isInitFromOptions(sources[0])) {
        expect(sources[0].options.length).toBe(2);
        expect(isInitFromUrl(sources[0].options[0])).toBeTrue();
        if (isInitFromUrl(sources[0].options[0])) {
          expect(sources[0].options[0].initUrl).toBe(
            "http://example.com/app/init/nationalparks.json"
          );
        }
        if (isInitFromUrl(sources[0].options[1])) {
          expect(sources[0].options[1].initUrl).toBe(
            "http://cdn.example.com/init/nationalparks.json"
          );
        }
      }
    });

    it("sets errorSeverity to Error for each init source", function () {
      const sources = buildInitSourcesFromConfig(
        { initializationUrls: ["catalog.json"] },
        baseUri,
        initFragmentPaths
      );

      expect(sources[0].errorSeverity).toBeDefined();
    });

    it("sets a descriptive name for each init source", function () {
      const sources = buildInitSourcesFromConfig(
        { initializationUrls: ["catalog.json"] },
        baseUri,
        initFragmentPaths
      );

      expect(sources[0].name).toContain("catalog.json");
    });

    it("converts v7initializationUrls to InitSourceFromDataPromise entries", function () {
      worker.use(
        http.get("*/old-catalog.json", () =>
          HttpResponse.json({ catalog: "old" })
        )
      );
      const sources = buildInitSourcesFromConfig(
        { v7initializationUrls: ["old-catalog.json"] },
        baseUri,
        initFragmentPaths
      );

      expect(sources.length).toBe(1);
      expect(isInitFromDataPromise(sources[0])).toBeTrue();
    });

    it("includes both v8 and v7 sources when both are present", function () {
      worker.use(
        http.get("*/old.json", () => HttpResponse.json({ catalog: "old" }))
      );
      const sources = buildInitSourcesFromConfig(
        {
          initializationUrls: ["new.json"],
          v7initializationUrls: ["old.json"]
        },
        baseUri,
        initFragmentPaths
      );

      expect(sources.length).toBe(2);
      expect(isInitFromUrl(sources[0])).toBeTrue();
      expect(isInitFromDataPromise(sources[1])).toBeTrue();
    });
  });

  describe("generateInitFragmentSource()", function () {
    const baseUri = new URI("http://example.com/");
    const paths = ["init/"];

    it("returns InitSourceFromUrl for .json URLs", function () {
      const source = generateInitFragmentSource(baseUri, paths, "data.json");
      expect(isInitFromUrl(source)).toBeTrue();
    });

    it("returns InitSourceFromOptions for fragment names without extension", function () {
      const source = generateInitFragmentSource(baseUri, paths, "mydata");
      expect(isInitFromOptions(source)).toBeTrue();
    });

    it("handles .JSON extension case-insensitively", function () {
      const source = generateInitFragmentSource(baseUri, paths, "DATA.JSON");
      expect(isInitFromUrl(source)).toBeTrue();
    });
  });
});
