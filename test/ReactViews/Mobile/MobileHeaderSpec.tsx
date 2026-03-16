import { screen } from "@testing-library/react";
import i18next from "i18next";
import Terria from "../../../lib/Models/Terria";
import ViewState from "../../../lib/ReactViewModels/ViewState";
import MobileHeader from "../../../lib/ReactViews/Mobile/MobileHeader";
import processCustomElements from "../../../lib/ReactViews/StandardUserInterface/processCustomElements";
import { renderWithContexts } from "../withContext";

describe("MobileHeader", function () {
  let terria: Terria;
  let viewState: ViewState;

  beforeAll(async function () {
    await i18next.changeLanguage("en");
  });
  beforeEach(function () {
    terria = new Terria({
      baseUrl: "./"
    });
    viewState = new ViewState({
      terria: terria,
      catalogSearchProvider: undefined
    });
  });

  afterAll(async function () {
    await i18next.changeLanguage("cimode");
  });

  it("should render search for locations for small screen", function () {
    const isSmallScreen = true;
    const customElements = processCustomElements(isSmallScreen, undefined);

    viewState.searchState.showMobileLocationSearch = true;

    renderWithContexts(
      <MobileHeader
        menuItems={customElements.menu}
        menuLeftItems={customElements.menuLeft}
      />,
      viewState
    );

    const searchInputs = screen.getAllByRole("textbox");
    expect(searchInputs.length).toBe(1);
    expect(searchInputs[0]).toHaveAttribute(
      "placeholder",
      "Search for locations"
    );
  });

  it("should render search for catalogue for small screen", function () {
    const isSmallScreen = true;
    const customElements = processCustomElements(isSmallScreen, undefined);

    viewState.searchState.showMobileCatalogSearch = true;

    renderWithContexts(
      <MobileHeader
        menuItems={customElements.menu}
        menuLeftItems={customElements.menuLeft}
      />,
      viewState
    );

    const searchInputs = screen.getAllByRole("textbox");
    expect(searchInputs.length).toBe(1);
    expect(searchInputs[0]).toHaveAttribute(
      "placeholder",
      "Search the catalogue"
    );
  });
});
