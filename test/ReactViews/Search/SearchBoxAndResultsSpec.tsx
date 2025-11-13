import { screen } from "@testing-library/dom";
import { runInAction } from "mobx";
import { ThemeProvider } from "styled-components";
import CommonStrata from "../../../lib/Models/Definition/CommonStrata";
import CatalogSearchProvider from "../../../lib/Models/SearchProviders/CatalogSearchProvider";
import Terria from "../../../lib/Models/Terria";
import ViewState from "../../../lib/ReactViewModels/ViewState";
import SearchBoxAndResults from "../../../lib/ReactViews/Search/SearchBoxAndResults";
import { terriaTheme } from "../../../lib/ReactViews/StandardUserInterface";
import { renderWithContexts } from "../withContext";

describe("SearchBoxAndResults", function () {
  let terria: Terria;
  let viewState: ViewState;

  beforeEach(function () {
    terria = new Terria({
      baseUrl: "./"
    });
    viewState = new ViewState({
      terria: terria,
      catalogSearchProvider: new CatalogSearchProvider("catalog", terria)
    });
  });

  it("renders with an input(SearchBox), but no SearchInDataCatalog without showLocationSearchResults", function () {
    const searchText = "neko";
    runInAction(() => {
      viewState.searchState.locationSearchText = searchText;
      viewState.searchState.showLocationSearchResults = false;
      viewState.searchState.locationSearchResults = [];
    });
    renderWithContexts(
      <ThemeProvider theme={terriaTheme}>
        <SearchBoxAndResults placeholder="Search" />
      </ThemeProvider>,
      viewState
    );

    const searchBox = screen.getByRole("textbox");
    expect(searchBox).toBeVisible();
    expect(searchBox).toHaveValue(searchText);

    expect(
      screen.queryByText("search.searchInDataCatalog")
    ).not.toBeInTheDocument();
  });

  it("renders with an input & SearchInDataCatalog when showLocationSearchResults", async () => {
    const searchText = "mochi";
    runInAction(() => {
      viewState.searchState.locationSearchText = searchText;
      viewState.searchState.showLocationSearchResults = true;
      viewState.searchState.locationSearchResults = [];
    });

    renderWithContexts(
      <ThemeProvider theme={terriaTheme}>
        <SearchBoxAndResults placeholder="Search" />
      </ThemeProvider>,
      viewState
    );

    const searchBox = screen.getByRole("textbox");
    expect(searchBox).toBeVisible();
    expect(searchBox).toHaveValue(searchText);

    expect(screen.getByText("search.searchInDataCatalog")).toBeVisible();
  });

  it("renders with an input & no SearchInDataCatalog without catalogSearchProvider", function () {
    const searchText = "timmynook";
    runInAction(() => {
      viewState.searchState.locationSearchText = searchText;
      viewState.searchState.showLocationSearchResults = true;
      viewState.searchState.locationSearchResults = [];
      viewState.terria.searchBarModel.catalogSearchProvider = undefined;
    });
    renderWithContexts(
      <ThemeProvider theme={terriaTheme}>
        <SearchBoxAndResults placeholder="Search" />
      </ThemeProvider>,
      viewState
    );

    const searchBox = screen.getByRole("textbox");
    expect(searchBox).toBeVisible();
    expect(searchBox).toHaveValue(searchText);
    expect(
      screen.queryByText("search.searchInDataCatalog")
    ).not.toBeInTheDocument();
  });

  it("renders with an input & no SearchInDataCatalog when showSearchInCatalog is false", function () {
    const searchText = "timmynook";
    runInAction(() => {
      viewState.searchState.locationSearchText = searchText;
      viewState.searchState.showLocationSearchResults = true;
      viewState.searchState.locationSearchResults = [];

      viewState.terria.searchBarModel.setTrait(
        CommonStrata.user,
        "showSearchInCatalog",
        false
      );
    });
    renderWithContexts(
      <ThemeProvider theme={terriaTheme}>
        <SearchBoxAndResults placeholder="Search" />
      </ThemeProvider>,
      viewState
    );

    const searchBox = screen.getByRole("textbox");
    expect(searchBox).toBeVisible();
    expect(searchBox).toHaveValue(searchText);
    expect(
      screen.queryByText("search.searchInDataCatalog")
    ).not.toBeInTheDocument();
  });
});
