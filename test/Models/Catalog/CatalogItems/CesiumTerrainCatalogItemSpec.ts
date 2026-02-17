import Terria from "../../../../lib/Models/Terria";
import CesiumTerrainCatalogItem from "../../../../lib/Models/Catalog/CatalogItems/CesiumTerrainCatalogItem";
import CommonStrata from "../../../../lib/Models/Definition/CommonStrata";
import CesiumTerrainProvider from "terriajs-cesium/Source/Core/CesiumTerrainProvider";
import { runInAction } from "mobx";
import { http, HttpResponse } from "msw";
import { worker } from "../../../mocks/browser";

describe("CesiumTerrainCatalogItem", function () {
  let terria: Terria;
  let item: CesiumTerrainCatalogItem;

  const validResponse = {
    tilejson: "2.1.0",
    format: "heightmap-1.0",
    version: "1.0.0",
    scheme: "tms",
    tiles: ["{z}/{x}/{y}.terrain?v={version}"]
  };

  beforeEach(function () {
    terria = new Terria();
    item = new CesiumTerrainCatalogItem(undefined, terria);
  });

  describe("loading", function () {
    it("rejects with an error when there is a network error", async function () {
      worker.use(
        http.get("http://no-such-server/*", () => HttpResponse.error())
      );
      item.setTrait(CommonStrata.user, "url", "http://no-such-server");
      const result = await item.loadMapItems();
      expect(result.error?.message).toBeDefined(
        "Failed to load terrain provider"
      );
    });

    it("can load terrain from a URL", async function () {
      worker.use(
        http.get("https://example.com/foo/*", () =>
          HttpResponse.json(validResponse)
        )
      );

      item.setTrait(CommonStrata.user, "url", "https://example.com/foo/bar");
      const result = await item.loadMapItems();
      runInAction(() => {
        expect(result.error).toBeUndefined();
        expect(item.mapItems[0] instanceof CesiumTerrainProvider).toBe(true);
      });
    });

    it("can load terrain from `ionAssetId`", async function () {
      worker.use(
        // Stub request from IonResource
        http.get("https://api.cesium.com/v1/assets/424242/endpoint", () =>
          HttpResponse.json({
            url: "https://example.com/foo/bar",
            attributions: []
          })
        ),
        // Stub request for terrain
        http.get("https://example.com/foo/*", () =>
          HttpResponse.json(validResponse)
        )
      );

      item.setTrait(CommonStrata.user, "ionAssetId", 424242);
      const result = await item.loadMapItems();
      runInAction(() => {
        expect(result.error).toBeUndefined();
        expect(item.mapItems[0] instanceof CesiumTerrainProvider).toBe(true);
      });
    });
  });

  describe("mapItems", function () {
    it("should be empty when `show` is false", async function () {
      worker.use(
        http.get("https://example.com/foo/*", () =>
          HttpResponse.json(validResponse)
        )
      );
      item.setTrait(CommonStrata.user, "url", "https://example.com/foo/bar");
      await item.loadMapItems();
      runInAction(() => {
        expect(item.mapItems.length).toBe(1);
        item.setTrait(CommonStrata.user, "show", false);
        expect(item.mapItems.length).toBe(0);
      });
    });
  });
});
