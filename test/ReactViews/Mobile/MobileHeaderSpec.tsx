import MobileHeader from "../../../lib/ReactViews/Mobile/MobileHeader";
import { act } from "react-dom/test-utils";
import { ReactTestRenderer } from "react-test-renderer";
import Terria from "../../../lib/Models/Terria";
import ViewState from "../../../lib/ReactViewModels/ViewState";
import { createWithContexts } from "../withContext";
import processCustomElements from "../../../lib/ReactViews/StandardUserInterface/processCustomElements";
import SearchBox from "../../../lib/ReactViews/Search/SearchBox";

describe("MobileHeader", function () {
  let terria: Terria;
  let viewState: ViewState;

  beforeEach(function () {
    terria = new Terria({
      baseUrl: "./"
    });
    terria;
    viewState = new ViewState({
      terria: terria,
      catalogSearchProvider: undefined
    });
  });

  let testRenderer: ReactTestRenderer;

  it("should render search for locations for small screen", function () {
    const isSmallScreen = true;
    const customElements = processCustomElements(isSmallScreen, undefined);

    viewState.searchState.showMobileLocationSearch = true;

    act(() => {
      testRenderer = createWithContexts(
        viewState,
        <MobileHeader
          menuItems={customElements.menu}
          menuLeftItems={customElements.menuLeft}
          version="unit test version"
        />
      );
    });

    const searchBox = testRenderer.root.findAllByType(SearchBox);
    expect(searchBox.length).toBe(1);
    expect(searchBox[0].props.alwaysShowClear).toBe(true);
    expect(searchBox[0].props.autoFocus).toBe(true);
    expect(searchBox[0].props.searchText).toBe("");
    expect(searchBox[0].props.placeholder).toBe("search.placeholder");
    expect(searchBox[0].props.onDoSearch.name).toBe("bound searchLocations");
    expect(searchBox[0].props.onSearchTextChanged.name).toBe(
      "bound changeLocationSearchText"
    );
    expect(searchBox[0].props.onClear.name).toBe("bound closeLocationSearch");
  });

  it("should render search for catalogue for small screen", function () {
    const isSmallScreen = true;
    const customElements = processCustomElements(isSmallScreen, undefined);

    viewState.searchState.showMobileCatalogSearch = true;

    act(() => {
      testRenderer = createWithContexts(
        viewState,
        <MobileHeader
          menuItems={customElements.menu}
          menuLeftItems={customElements.menuLeft}
          version="unit test version"
        />
      );
    });

    const searchBox = testRenderer.root.findAllByType(SearchBox);
    expect(searchBox.length).toBe(1);
    expect(searchBox[0].props.autoFocus).toBe(true);
    expect(searchBox[0].props.searchText).toBe("");
    expect(searchBox[0].props.placeholder).toBe("search.searchCatalogue");
    expect(searchBox[0].props.onDoSearch.name).toBe("bound searchCatalog");
    expect(searchBox[0].props.onSearchTextChanged.name).toBe(
      "bound changeCatalogSearchText"
    );
    expect(searchBox[0].props.onClear.name).toBe("bound closeCatalogSearch");
  });
});
