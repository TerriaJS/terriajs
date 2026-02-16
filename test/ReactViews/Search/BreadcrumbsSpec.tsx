import { screen } from "@testing-library/dom";
import CatalogGroup from "../../../lib/Models/Catalog/CatalogGroup";
import Terria from "../../../lib/Models/Terria";
import ViewState from "../../../lib/ReactViewModels/ViewState";
import Breadcrumbs from "../../../lib/ReactViews/Search/Breadcrumbs";
import { renderWithContexts } from "../withContext";

describe("Breadcrumbs", function () {
  let terria: Terria;
  let viewState: ViewState;
  let catalogGroup: CatalogGroup;

  beforeEach(function () {
    terria = new Terria({
      baseUrl: "./"
    });
    viewState = new ViewState({
      terria: terria,
      catalogSearchProvider: undefined
    });
    catalogGroup = new CatalogGroup("group-of-geospatial-cats", terria);
    terria.addModel(catalogGroup);
  });

  describe("with a previewed catalog item", function () {
    it("renders", async function () {
      const { container } = renderWithContexts(
        <Breadcrumbs previewed={catalogGroup} />,
        viewState
      );

      // Breadcrumbs renders with a globe icon SVG
      expect(screen.getByText("group-of-geospatial-cats")).toBeVisible();
      expect(
        container
          .querySelector("svg")
          ?.querySelector("use")
          ?.getAttribute("xlink:href")
      ).toBe("#terriajs-globe");
    });
  });
});
