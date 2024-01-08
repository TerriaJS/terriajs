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
  });
});
