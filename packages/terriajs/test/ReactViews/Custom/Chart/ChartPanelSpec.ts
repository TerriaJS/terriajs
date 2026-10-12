import Result from "../../../../lib/Core/Result";
import TerriaError from "../../../../lib/Core/TerriaError";
import GeoJsonCatalogItem from "../../../../lib/Models/Catalog/CatalogItems/GeoJsonCatalogItem";
import Terria from "../../../../lib/Models/Terria";
import { loadChartPanelMapItems } from "../../../../lib/ReactViews/Custom/Chart/ChartPanel";

describe("ChartPanel", function () {
  describe("loadChartPanelMapItems", function () {
    let terria: Terria;
    let item: GeoJsonCatalogItem;
    let raiseErrorToUser: jasmine.Spy;

    beforeEach(function () {
      terria = new Terria({ baseUrl: "./" });
      item = new GeoJsonCatalogItem("broken-item", terria);
      spyOn(item, "loadMapItems").and.returnValue(
        Promise.resolve(Result.error("Failed to load map items"))
      );
      raiseErrorToUser = spyOn(terria, "raiseErrorToUser");
      terria.workbench.items = [item];
    });

    it("raises load errors for workbench items", async function () {
      await loadChartPanelMapItems(terria);

      expect(raiseErrorToUser).toHaveBeenCalledTimes(1);
    });

    it("doesn't raise load errors shown on the workbench item", async function () {
      terria.workbench.setItemErrors(item, [
        TerriaError.from("Failed to load map items")
      ]);

      await loadChartPanelMapItems(terria);

      expect(raiseErrorToUser).not.toHaveBeenCalled();
    });

    it("doesn't raise load errors for items removed from the workbench while loading", async function () {
      terria.workbench.setItemErrors(item, [
        TerriaError.from("Failed to load map items")
      ]);

      const loading = loadChartPanelMapItems(terria);
      // e.g. a story scene with an empty workbench is applied
      terria.workbench.items = [];
      await loading;

      expect(raiseErrorToUser).not.toHaveBeenCalled();
    });
  });
});
