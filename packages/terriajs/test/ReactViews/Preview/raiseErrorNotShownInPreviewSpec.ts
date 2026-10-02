import Result from "../../../lib/Core/Result";
import CatalogGroup from "../../../lib/Models/Catalog/CatalogGroup";
import GeoJsonCatalogItem from "../../../lib/Models/Catalog/CatalogItems/GeoJsonCatalogItem";
import StubCatalogItem from "../../../lib/Models/Catalog/CatalogItems/StubCatalogItem";
import Terria from "../../../lib/Models/Terria";
import ViewState from "../../../lib/ReactViewModels/ViewState";
import raiseErrorNotShownInPreview, {
  previewShowsLoadErrors
} from "../../../lib/ReactViews/Preview/raiseErrorNotShownInPreview";

describe("raiseErrorNotShownInPreview", function () {
  let terria: Terria;
  let viewState: ViewState;

  beforeEach(function () {
    terria = new Terria();
    viewState = new ViewState({
      terria,
      catalogSearchProvider: undefined
    });
  });

  it("knows which items show their load errors in the preview", function () {
    expect(previewShowsLoadErrors(new GeoJsonCatalogItem("a", terria))).toBe(
      true
    );
    expect(previewShowsLoadErrors(new CatalogGroup("b", terria))).toBe(true);
    expect(previewShowsLoadErrors(new StubCatalogItem("c", terria))).toBe(
      false
    );
  });

  it("only raises errors the preview doesn't show", function () {
    const raiseSpy = spyOn(terria, "raiseErrorToUser");
    const result = Result.error("Failed to load");

    raiseErrorNotShownInPreview(
      viewState,
      new GeoJsonCatalogItem("a", terria),
      result
    );
    expect(raiseSpy).not.toHaveBeenCalled();

    raiseErrorNotShownInPreview(
      viewState,
      new StubCatalogItem("c", terria),
      result
    );
    expect(raiseSpy).toHaveBeenCalledTimes(1);
  });
});
