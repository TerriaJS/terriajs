import Terria from "../../../../lib/Models/Terria";
import CesiumTerrainCatalogItem from "../../../../lib/Models/Catalog/CatalogItems/CesiumTerrainCatalogItem";
import CommonStrata from "../../../../lib/Models/Definition/CommonStrata";
import CesiumTerrainProvider from "terriajs-cesium/Source/Core/CesiumTerrainProvider";
import { runInAction } from "mobx";

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
    jasmine.Ajax.install();
  });

  afterEach(function () {
    jasmine.Ajax.uninstall();
  });

  describe("loading", function () {
    it("rejects with an error when there is a network error", async function () {
      jasmine.Ajax.stubRequest(/no-such-server/).andReturn({
        status: undefined
      });
      item.setTrait(CommonStrata.user, "url", "http://no-such-server");
      const result = await item.loadMapItems();
      expect(result.error?.message).toBeDefined(
        "Failed to load terrain provider"
      );
    });

    it("can load terrain from a URL", async function () {
      jasmine.Ajax.stubRequest(/foo/).andReturn({
        status: 200,
        responseJSON: validResponse
      });

      item.setTrait(CommonStrata.user, "url", "https://example.com/foo/bar");
      const result = await item.loadMapItems();
      runInAction(() => {
        expect(result.error).toBeUndefined();
        expect(item.mapItems[0] instanceof CesiumTerrainProvider).toBe(true);
      });
    });

    it("can load terrain from `ionAssetId`", async function () {
      // Stub request from IonResource
      jasmine.Ajax.stubRequest(/424242/).andReturn({
        status: 200,
        responseJSON: {
          url: "foo/bar",
          attributions: []
        }
      });

      // Stub request for terrain
      jasmine.Ajax.stubRequest(/foo/).andReturn({
        status: 200,
        responseJSON: validResponse
      });

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
      jasmine.Ajax.stubRequest(/foo/).andReturn({
        status: 200,
        responseJSON: validResponse
      });
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
