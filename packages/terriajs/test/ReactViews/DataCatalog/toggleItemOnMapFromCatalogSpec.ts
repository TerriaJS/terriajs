import { DataSourceAction } from "../../../lib/Core/Analytics/analyticEvents";
import Result from "../../../lib/Core/Result";
import CsvCatalogItem from "../../../lib/Models/Catalog/CatalogItems/CsvCatalogItem";
import GeoJsonCatalogItem from "../../../lib/Models/Catalog/CatalogItems/GeoJsonCatalogItem";
import Terria from "../../../lib/Models/Terria";
import ViewState from "../../../lib/ReactViewModels/ViewState";
import toggleItemOnMapFromCatalog, {
  Op
} from "../../../lib/ReactViews/DataCatalog/toggleItemOnMapFromCatalog";

describe("toggleItemOnMapFromCatalog", function () {
  let terria: Terria;
  let viewState: ViewState;
  let item: GeoJsonCatalogItem;

  const analyticsEvents = {
    [Op.Add]: DataSourceAction.addFromCatalogue,
    [Op.Remove]: DataSourceAction.removeFromCatalogue
  };

  beforeEach(function () {
    terria = new Terria();
    viewState = new ViewState({
      terria,
      catalogSearchProvider: undefined
    });
    item = new GeoJsonCatalogItem("broken", terria);
    terria.addModel(item);
  });

  it("adds an item that fails to load with its error instead of raising it", async function () {
    spyOn(item, "loadMapItems").and.returnValue(
      Promise.resolve(Result.error("Failed to load"))
    );
    const raiseSpy = spyOn(terria, "raiseErrorToUser");

    await toggleItemOnMapFromCatalog(viewState, item, true, analyticsEvents);

    expect(terria.workbench.contains(item)).toBe(true);
    expect(terria.workbench.getItemErrors(item).length).toBe(1);
    expect(raiseSpy).not.toHaveBeenCalled();
  });

  describe("with a time-varying item", function () {
    let csv: CsvCatalogItem;
    let finishLoad: () => void;

    beforeEach(function () {
      csv = new CsvCatalogItem("csv", terria, undefined);
      terria.addModel(csv);
      spyOn(csv, "loadMapItems").and.returnValue(
        new Promise<Result<void>>(
          (resolve) => (finishLoad = () => resolve(Result.none()))
        )
      );
    });

    it("adds the item to the timeline once it has loaded", async function () {
      const toggle = toggleItemOnMapFromCatalog(
        viewState,
        csv,
        true,
        analyticsEvents
      );
      finishLoad();
      await toggle;

      expect(terria.workbench.contains(csv)).toBe(true);
      expect(terria.timelineStack.contains(csv)).toBe(true);
    });

    it("does not add the item to the timeline if it was removed from the workbench while loading", async function () {
      const toggle = toggleItemOnMapFromCatalog(
        viewState,
        csv,
        true,
        analyticsEvents
      );
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(terria.workbench.contains(csv)).toBe(true);

      terria.workbench.remove(csv);
      finishLoad();
      await toggle;

      expect(terria.workbench.contains(csv)).toBe(false);
      expect(terria.timelineStack.contains(csv)).toBe(false);
    });
  });
});
