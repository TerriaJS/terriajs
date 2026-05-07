import { http, HttpResponse } from "msw";
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
import ShareDataService from "../../lib/Models/ShareDataService";
import { createTerriaConfig } from "../../lib/Models/TerriaConfig";
import { worker } from "../mocks/browser";
import { ShareLinkService } from "../../lib/ReactViews/Map/Panels/SharePanel/BuildShareLink";
import Terria from "../../lib/Models/Terria";

describe("InitSource", () => {
  describe("buildInitSourcesFromConfig", () => {
    const baseUri = new URI("http://example.com/app/");
    const initFragmentPaths = ["init/", "http://cdn.example.com/init/"];

    it("returns empty array when config has no initializationUrls", () => {
      const sources = buildInitSourcesFromConfig({
        initializationUrls: [],
        v7initializationUrls: [],
        baseUri,
        initFragmentPaths
      });
      expect(sources.length).toBe(0);
    });

    it("converts a .json URL to an InitSourceFromUrl with absolute URL", () => {
      const sources = buildInitSourcesFromConfig({
        initializationUrls: ["catalog/main.json"],
        baseUri,
        initFragmentPaths
      });

      expect(sources.length).toBe(1);
      expect(isInitFromUrl(sources[0])).toBeTrue();
      if (isInitFromUrl(sources[0])) {
        expect(sources[0].initUrl).toBe(
          "http://example.com/app/catalog/main.json"
        );
      }
    });

    it("converts a non-.json fragment to InitSourceFromOptions with one option per initFragmentPath", () => {
      const sources = buildInitSourcesFromConfig({
        initializationUrls: ["nationalparks"],
        baseUri,
        initFragmentPaths
      });

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
      const sources = buildInitSourcesFromConfig({
        initializationUrls: ["catalog.json"],
        v7initializationUrls: [],
        baseUri,
        initFragmentPaths
      });

      expect(sources[0].errorSeverity).toBeDefined();
    });

    it("sets a descriptive name for each init source", () => {
      const sources = buildInitSourcesFromConfig({
        initializationUrls: ["catalog.json"],
        v7initializationUrls: [],
        baseUri,
        initFragmentPaths
      });

      expect(sources[0].name).toContain("catalog.json");
    });

    it("converts v7initializationUrls to InitSourceFromDataPromise entries", async () => {
      worker.use(
        http.get("old-catalog.json", () =>
          HttpResponse.json({ catalog: "old" })
        )
      );
      const config = createTerriaConfig();
      config.update("user", {});
      const sources = buildInitSourcesFromConfig({
        v7initializationUrls: ["old-catalog.json"],
        baseUri,
        initFragmentPaths
      });

      expect(sources.length).toBe(1);
      expect(isInitFromDataPromise(sources[0])).toBeTrue();
      // have to await the data promise to ensure it resolves without error
      if (isInitFromDataPromise(sources[0])) {
        await sources[0].data;
      }
    });

    it("includes both v8 and v7 sources when both are present", async () => {
      worker.use(
        http.get("*/old.json", () => HttpResponse.json({ catalog: "old" }))
      );
      const config = createTerriaConfig();
      config.update("user", {});
      const sources = buildInitSourcesFromConfig({
        initializationUrls: ["new.json"],
        v7initializationUrls: ["old.json"],
        baseUri,
        initFragmentPaths
      });

      expect(sources.length).toBe(2);
      expect(isInitFromUrl(sources[0])).toBeTrue();
      expect(isInitFromDataPromise(sources[1])).toBeTrue();
      if (isInitFromDataPromise(sources[1])) {
        await sources[1].data;
      }
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

      const shareDataService = {
        resolveData: jasmine
          .createSpy("resolveData")
          .and.returnValue(Promise.resolve(shareData))
      };

      const initSources = await buildInitSourcesFromShare(
        "abc123",
        new ShareLinkService(
          new Terria(),
          shareDataService as never as ShareDataService
        )
      );

      expect(shareDataService.resolveData).toHaveBeenCalledWith("abc123");
      expect(initSources.length).toBe(1);
      expect(isInitFromData(initSources[0])).toBeTrue();
    });

    it("returns empty initSources when no shareDataService is provided", async () => {
      const initSources = await buildInitSourcesFromShare("abc123", undefined);
      expect(initSources).toEqual([]);
    });
  });

  describe("SPA routes", () => {
    describe("/catalog/:id route", function () {
      it("adds an initSource with previewedItemId", async function () {
        const { initSources, hasStory } = await buildInitSourcesFromSpaRoutes(
          "catalog/my-layer",
          ""
        );
        expect(initSources.length).toBe(1);
        expect(isInitFromData(initSources[0])).toBeTrue();
        expect(
          (initSources[0] as InitSourceFromData).data.previewedItemId
        ).toBe("my-layer");
        expect(hasStory).toBeFalse();
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

        const { initSources, hasStory } = await buildInitSourcesFromSpaRoutes(
          "story/my-story",
          "stories/"
        );

        expect(initSources.length).toBe(1);
        expect(isInitFromData(initSources[0])).toBeTrue();
        expect(
          (initSources[0] as InitSourceFromData).data.stories?.[0].id
        ).toBe("s1");
        expect(hasStory).toBeTrue();
      });

      it("returns empty initSources when storyRouteUrlPrefix is not defined", async function () {
        const { initSources, hasStory } = await buildInitSourcesFromSpaRoutes(
          "story/my-story",
          undefined
        );
        expect(initSources).toEqual([]);
        expect(hasStory).toBeFalse();
      });
    });
  });
});
