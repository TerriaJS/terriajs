import { screen, waitFor } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import i18next from "i18next";
import { runInAction } from "mobx";
import { I18nextProvider } from "react-i18next";
import { ThemeProvider } from "styled-components";
import CommonStrata from "../../../lib/Models/Definition/CommonStrata";
import CatalogSearchProvider from "../../../lib/Models/SearchProviders/CatalogSearchProvider";
import MapboxSearchProvider from "../../../lib/Models/SearchProviders/MapboxSearchProvider";
import NominatimSearchProvider from "../../../lib/Models/SearchProviders/NominatimSearchProvider";
import SearchProviderResult from "../../../lib/Models/SearchProviders/SearchProviderResults";
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

  let nominatimProvider: NominatimSearchProvider;
  let mapboxProvider: MapboxSearchProvider;
  let nominatimSpy: jasmine.Spy;
  let mapboxSpy: jasmine.Spy;

  const i18n = i18next.createInstance({
    lng: "spec",
    debug: false,
    resources: {
      spec: {
        translation: {}
      }
    }
  });

  beforeEach(async () => {
    await i18n.init();

    nominatimProvider = new NominatimSearchProvider("nominatim", terria);
    mapboxProvider = new MapboxSearchProvider("mapbox", terria);

    // Mock the doSearch methods to avoid actual API calls.
    // @ts-expect-error: doSearch method is protected
    nominatimSpy = spyOn(nominatimProvider, "doSearch").and.callFake(
      (searchText: string, abortSignal: AbortSignal) => {
        return new Promise((resolve) => {
          if (!abortSignal.aborted) {
            runInAction(() => {
              nominatimProvider.searchResult.results.push({
                name: `Nominatim result for ${searchText}`,
                tooltip: undefined,
                isImportant: false,
                clickAction: undefined,
                catalogItem: undefined,
                isOpen: false,
                type: "",
                location: undefined,
                toggleOpen: jasmine.createSpy("toggleOpen")
              });
            });
          }
          resolve(undefined);
        });
      }
    );

    // @ts-expect-error: doSearch method is protected
    mapboxSpy = spyOn(mapboxProvider, "doSearch").and.callFake(
      (searchText: string, abortSignal: AbortSignal) => {
        return new Promise((resolve) => {
          if (!abortSignal.aborted) {
            runInAction(() => {
              mapboxProvider.searchResult.results.push({
                name: `Mapbox result for ${searchText}`,
                tooltip: undefined,
                isImportant: false,
                clickAction: undefined,
                catalogItem: undefined,
                isOpen: false,
                type: "",
                location: undefined,
                toggleOpen: jasmine.createSpy("toggleOpen")
              });
            });
          }
          resolve(undefined);
        });
      }
    );
  });

  afterEach(() => {
    mapboxSpy.calls.reset();
    nominatimSpy.calls.reset();

    // Clear the search providers after each test
    // @ts-expect-error: locationSearchProviders is a private property
    terria.searchBarModel.locationSearchProviders.clear();
  });

  it("should display search results from mapbox search provider", async function () {
    const user = userEvent.setup();
    runInAction(() => {
      terria.searchBarModel.addSearchProvider(mapboxProvider);
    });

    renderWithContexts(
      <I18nextProvider i18n={i18n}>
        <ThemeProvider theme={terriaTheme}>
          <SearchBoxAndResults placeholder="Search for places" />
        </ThemeProvider>
      </I18nextProvider>,
      viewState
    );

    const searchBox = screen.getByRole("textbox");

    await user.type(searchBox, "test search");

    await waitFor(
      () => {
        expect(screen.getByText("Mapbox result for")).toBeInTheDocument();
      },
      { timeout: 5000 }
    );

    expect(mapboxProvider.searchResult.results.length).toBe(1);

    expect(mapboxSpy).toHaveBeenCalledTimes(1);
  });

  it('should not trigger search for nominatim provider until "Enter" is pressed', async function () {
    const user = userEvent.setup();
    runInAction(() => {
      terria.searchBarModel.addSearchProvider(nominatimProvider);
    });

    renderWithContexts(
      <I18nextProvider i18n={i18n}>
        <ThemeProvider theme={terriaTheme}>
          <SearchBoxAndResults placeholder="Search for places" />
        </ThemeProvider>
      </I18nextProvider>,
      viewState
    );

    const searchBox = screen.getByRole("textbox");

    await user.type(searchBox, "test search");

    expect(screen.queryByText("Nominatim result for")).not.toBeInTheDocument();
    await waitFor(() => {
      expect(
        screen.getByText("viewModels.enterToStartSearch")
      ).toBeInTheDocument();
    });

    expect(nominatimSpy).not.toHaveBeenCalled();

    await user.keyboard("{Enter}");

    await waitFor(() => {
      expect(screen.getByText("Nominatim result for")).toBeInTheDocument();
    });

    expect(nominatimProvider.searchResult.results.length).toBe(1);
    expect(nominatimSpy).toHaveBeenCalledTimes(1);
  });

  it("should cancel previous search when new search text is set", async function () {
    const user = userEvent.setup();
    runInAction(() => {
      terria.searchBarModel.addSearchProvider(nominatimProvider);
      terria.searchBarModel.addSearchProvider(mapboxProvider);
    });

    renderWithContexts(
      <I18nextProvider i18n={i18n}>
        <ThemeProvider theme={terriaTheme}>
          <SearchBoxAndResults placeholder="Search for places" />
        </ThemeProvider>
      </I18nextProvider>,
      viewState
    );

    const searchBox = screen.getByRole("textbox");
    await user.type(searchBox, "first");

    await user.clear(searchBox);
    await user.type(searchBox, "second");

    await waitFor(
      () => {
        expect(screen.getByText("second")).toBeInTheDocument();
      },
      { timeout: 5000 }
    );

    expect(screen.queryByText("first")).not.toBeInTheDocument();
  });

  it("should preserve individual provider state during searches", async function () {
    const user = userEvent.setup();
    runInAction(() => {
      terria.searchBarModel.addSearchProvider(nominatimProvider);
      terria.searchBarModel.addSearchProvider(mapboxProvider);
    });

    renderWithContexts(
      <I18nextProvider i18n={i18n}>
        <ThemeProvider theme={terriaTheme}>
          <SearchBoxAndResults placeholder="Search for places" />
        </ThemeProvider>
      </I18nextProvider>,
      viewState
    );

    await user.type(screen.getByRole("textbox"), "test query");

    await waitFor(
      () => {
        expect(
          screen.getByText("viewModels.enterToStartSearch")
        ).toBeInTheDocument();
      },
      { timeout: 5000 }
    );
    await waitFor(
      () => {
        expect(screen.getByText("Mapbox result for")).toBeInTheDocument();
      },
      { timeout: 5000 }
    );

    await user.keyboard("{Enter}");

    await waitFor(
      () => {
        expect(screen.getByText("Nominatim result for")).toBeInTheDocument();
      },
      { timeout: 5000 }
    );

    await waitFor(
      () => {
        expect(screen.getByText("Mapbox result for")).toBeInTheDocument();
      },
      { timeout: 5000 }
    );

    expect(nominatimSpy).toHaveBeenCalledTimes(1);
    expect(mapboxSpy).toHaveBeenCalledTimes(1);
  });

  it("should clear results when search input is cleared", async function () {
    const user = userEvent.setup();
    runInAction(() => {
      terria.searchBarModel.addSearchProvider(nominatimProvider);
      terria.searchBarModel.addSearchProvider(mapboxProvider);
    });

    renderWithContexts(
      <I18nextProvider i18n={i18n}>
        <ThemeProvider theme={terriaTheme}>
          <SearchBoxAndResults placeholder="Search for places" />
        </ThemeProvider>
      </I18nextProvider>,
      viewState
    );

    await user.type(screen.getByRole("textbox"), "test");
    await user.keyboard("{Enter}");

    await waitFor(() => {
      expect(screen.getByText("Nominatim result for")).toBeInTheDocument();
    });

    await userEvent.clear(screen.getByRole("textbox"));

    await waitFor(() => {
      expect(viewState.searchState.showLocationSearchResults).toBe(false);
    });
    expect(nominatimProvider.searchResult.results.length).toBe(0);
    expect(mapboxProvider.searchResult.results.length).toBe(0);
  });

  it("should handle manual vs automatic search triggering correctly", async function () {
    const user = userEvent.setup();
    runInAction(() => {
      terria.searchBarModel.addSearchProvider(mapboxProvider); // Has autocomplete enabled
    });

    renderWithContexts(
      <I18nextProvider i18n={i18n}>
        <ThemeProvider theme={terriaTheme}>
          <SearchBoxAndResults placeholder="Search for places" />
        </ThemeProvider>
      </I18nextProvider>,
      viewState
    );

    const searchBox = screen.getByRole("textbox");

    await user.type(searchBox, "test");

    expect(mapboxSpy).not.toHaveBeenCalled();

    await user.keyboard("{Enter}");

    await waitFor(
      () => {
        expect(mapboxSpy).toHaveBeenCalledTimes(1);
      },
      { timeout: 8000 }
    );
  });
});
