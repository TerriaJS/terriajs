import URI from "urijs";
import {
  buildInitSourcesFromConfig,
  buildInitSourcesFromShare,
  buildInitSourcesFromSpaRoutes,
  buildInitSourcesFromStartData,
  generateInitFragmentSource,
  InitSourceFromData,
  isInitFromData,
  isInitFromDataPromise,
  isInitFromOptions,
  isInitFromUrl
} from "../../lib/Models/InitSource";
import { http, HttpResponse } from "msw";
import { worker } from "../mocks/browser";
import { TerriaConfig } from "../../lib/Models/TerriaConfig";
import Terria from "../../lib/Models/Terria";
import ShareDataService from "../../lib/Models/ShareDataService";

describe("InitSource", () => {
  describe("buildInitSourcesFromConfig", () => {
    const baseUri = new URI("http://example.com/app/");
    const initFragmentPaths = ["init/", "http://cdn.example.com/init/"];

    it("returns empty array when config has no initializationUrls", () => {
      const sources = buildInitSourcesFromConfig(
        new TerriaConfig(),
        baseUri,
        initFragmentPaths
      );
      expect(sources.length).toBe(0);
    });

    it("converts a .json URL to an InitSourceFromUrl with absolute URL", () => {
      const config = new TerriaConfig();
      config.update({ initializationUrls: ["catalog/main.json"] });
      const sources = buildInitSourcesFromConfig(
        config,
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

    it("converts a non-.json fragment to InitSourceFromOptions with one option per initFragmentPath", () => {
      const config = new TerriaConfig();
      config.update({ initializationUrls: ["nationalparks"] });
      const sources = buildInitSourcesFromConfig(
        config,
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

    it("sets errorSeverity to Error for each init source", () => {
      const config = new TerriaConfig();
      config.update({ initializationUrls: ["catalog.json"] });
      const sources = buildInitSourcesFromConfig(
        config,
        baseUri,
        initFragmentPaths
      );

      expect(sources[0].errorSeverity).toBeDefined();
    });

    it("sets a descriptive name for each init source", () => {
      const config = new TerriaConfig();
      config.update({ initializationUrls: ["catalog.json"] });
      const sources = buildInitSourcesFromConfig(
        config,
        baseUri,
        initFragmentPaths
      );

      expect(sources[0].name).toContain("catalog.json");
    });

    it("converts v7initializationUrls to InitSourceFromDataPromise entries", () => {
      worker.use(
        http.get("*/old-catalog.json", () =>
          HttpResponse.json({ catalog: "old" })
        )
      );
      const config = new TerriaConfig();
      config.update({ v7initializationUrls: ["old-catalog.json"] });
      const sources = buildInitSourcesFromConfig(
        config,
        baseUri,
        initFragmentPaths
      );

      expect(sources.length).toBe(1);
      expect(isInitFromDataPromise(sources[0])).toBeTrue();
    });

    it("includes both v8 and v7 sources when both are present", () => {
      worker.use(
        http.get("*/old.json", () => HttpResponse.json({ catalog: "old" }))
      );
      const config = new TerriaConfig();
      config.update({
        initializationUrls: ["new.json"],
        v7initializationUrls: ["old.json"]
      });
      const sources = buildInitSourcesFromConfig(
        config,
        baseUri,
        initFragmentPaths
      );

      expect(sources.length).toBe(2);
      expect(isInitFromUrl(sources[0])).toBeTrue();
      expect(isInitFromDataPromise(sources[1])).toBeTrue();
    });
  });

  describe("generateInitFragmentSource", () => {
    const baseUri = new URI("http://example.com/");
    const paths = ["init/"];

    it("returns InitSourceFromUrl for .json URLs", () => {
      const source = generateInitFragmentSource(baseUri, paths, "data.json");
      expect(isInitFromUrl(source)).toBeTrue();
    });

    it("returns InitSourceFromOptions for fragment names without extension", () => {
      const source = generateInitFragmentSource(baseUri, paths, "mydata");
      expect(isInitFromOptions(source)).toBeTrue();
    });

    it("handles .JSON extension case-insensitively", () => {
      const source = generateInitFragmentSource(baseUri, paths, "DATA.JSON");
      expect(isInitFromUrl(source)).toBeTrue();
    });
  });

  describe("buildInitSourcesFromStartData", () => {
    it("parses inline JSON and returns initSources", async () => {
      const startData = {
        version: "8.0.0",
        initSources: [{ workbench: ["id1"] }]
      };
      const initSources = await buildInitSourcesFromStartData(startData);
      expect(initSources.length).toBe(1);
      expect(isInitFromData(initSources[0])).toBeTrue();
    });
  });

  describe("buildInitSourcesFromShare", () => {
    it("calls shareDataService.resolveData and returns initSources", async () => {
      const shareData = {
        version: "8.0.0",
        initSources: [{ workbench: ["item1"] }]
      };
      const terria = new Terria();

      const shareDataService = {
        resolveData: jasmine
          .createSpy("resolveData")
          .and.returnValue(Promise.resolve(shareData))
      };

      terria.setShareDataService(shareDataService as never as ShareDataService);

      const initSources = await buildInitSourcesFromShare("abc123", terria);

      expect(shareDataService.resolveData).toHaveBeenCalledWith("abc123");
      expect(initSources.length).toBe(1);
      expect(isInitFromData(initSources[0])).toBeTrue();
    });

    it("returns empty initSources when no shareDataService is provided", async () => {
      const terria = new Terria();
      const initSources = await buildInitSourcesFromShare("abc123", terria);
      expect(initSources).toEqual([]);
    });
  });

  describe("SPA routes", () => {
    describe("/catalog/:id route", function () {
      it("adds an initSource with previewedItemId", async function () {
        const initSources = await buildInitSourcesFromSpaRoutes(
          "catalog/my-layer",
          ""
        );
        expect(initSources.length).toBe(1);
        if (isInitFromData(initSources[0])) {
          expect((initSources[0].data as any).previewedItemId).toBe("my-layer");
        }
      });
    });

    describe("/story/:id route", function () {
      it("fetches the story JSON, adds initSources, and sets playStory in userProperties", async function () {
        worker.use(
          http.get("stories/my-story", () =>
            HttpResponse.json({
              version: "8.0.0",
              initSources: [{ stories: [{ id: "s1", title: "Story 1" }] }]
            })
          )
        );

        const initSources = await buildInitSourcesFromSpaRoutes(
          "story/my-story",
          "stories/"
        );

        expect(initSources.length).toBe(1);
        expect(isInitFromData(initSources[0])).toBeTrue();
        expect(
          (initSources[0] as InitSourceFromData).data.stories?.[0].id
        ).toBe("s1");
      });

      it("returns empty initSources when storyRouteUrlPrefix is not defined", async function () {
        const initSources = await buildInitSourcesFromSpaRoutes(
          "story/my-story",
          undefined
        );
        expect(initSources).toEqual([]);
      });
    });
  });
});
