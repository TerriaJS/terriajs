import { act } from "react-dom/test-utils";
import Terria from "../../../lib/Models/Terria";
import ViewState from "../../../lib/ReactViewModels/ViewState";
import { SearchBox } from "../../../lib/ReactViews/Search/SearchBox";
import { createWithContexts } from "../withContext";

describe("SearchBox", function () {
  let terria: Terria;
  let viewState: ViewState;

  let testRenderer: any;

  beforeEach(function () {
    terria = new Terria({
      baseUrl: "./"
    });
    viewState = new ViewState({
      terria: terria,
      catalogSearchProvider: undefined
    });
  });

  describe("with basic props", function () {
    const searchText = "mochi";
    let searchBoxValue = "something";

    beforeEach(function () {
      searchBoxValue = "something";
    });
    const searchBoxWithProps = (
      <SearchBox
        onSearchTextChanged={(newVal: any) => {
          searchBoxValue = newVal;
        }}
        onDoSearch={() => {}}
        onFocus={() => {}}
        searchText={searchText}
        placeholder="placeholder"
      />
    );

    it("renders", function () {
      act(() => {
        testRenderer = createWithContexts(viewState, searchBoxWithProps);
      });

      const searchBoxInput = testRenderer.root.findByType("input");
      expect(searchBoxInput).toBeDefined();
      expect(searchBoxInput.props.value).toEqual(searchText);
    });
    it("renders and clearSearch triggers onSearchTextChanged callback", function () {
      act(() => {
        testRenderer = createWithContexts(viewState, searchBoxWithProps);
      });

      const searchBoxInstance = testRenderer.root.instance;
      expect(searchBoxValue).toEqual("something");
      // attempt clear search method
      searchBoxInstance.clearSearch();
      // Now it should be reset
      expect(searchBoxValue).toEqual("");
    });
  });
});
