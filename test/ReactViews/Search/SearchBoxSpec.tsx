import { screen } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import Terria from "../../../lib/Models/Terria";
import ViewState from "../../../lib/ReactViewModels/ViewState";
import { SearchBox } from "../../../lib/ReactViews/Search/SearchBox";
import { renderWithContexts } from "../withContext";

describe("SearchBox", function () {
  let terria: Terria;
  let viewState: ViewState;

  beforeEach(function () {
    terria = new Terria({
      baseUrl: "./"
    });
    viewState = new ViewState({
      terria: terria,
      catalogSearchProvider: undefined
    });
  });

  describe("with basic props", () => {
    it("renders", () => {
      renderWithContexts(
        <SearchBox
          onSearchTextChanged={jasmine.createSpy()}
          onDoSearch={() => {}}
          onFocus={() => {}}
          searchText={"mochi"}
          placeholder="placeholder"
        />,
        viewState
      );

      const searchBoxInput = screen.getByRole("textbox");

      expect(searchBoxInput).toBeVisible();
      expect(searchBoxInput).toHaveValue("mochi");
    });

    it("renders and clearSearch triggers onSearchTextChanged callback", async () => {
      const onSeachTextChangedSpy = jasmine.createSpy();
      renderWithContexts(
        <SearchBox
          onSearchTextChanged={onSeachTextChangedSpy}
          onDoSearch={() => {}}
          onFocus={() => {}}
          searchText={"mochi"}
          placeholder="placeholder"
        />,
        viewState
      );

      await userEvent.click(
        screen.getByRole("button", { name: "Clear search" })
      );

      expect(onSeachTextChangedSpy).toHaveBeenCalledWith("");
    });
  });
});
