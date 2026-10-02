import { DataSourceAction } from "../../../lib/Core/Analytics/analyticEvents";
import Result from "../../../lib/Core/Result";
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
});
