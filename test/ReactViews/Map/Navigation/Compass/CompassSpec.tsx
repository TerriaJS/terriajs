import { render } from "@testing-library/react";
import { ThemeProvider } from "styled-components";
import Terria from "../../../../../lib/Models/Terria";
import ViewState from "../../../../../lib/ReactViewModels/ViewState";
import Compass from "../../../../../lib/ReactViews/Map/MapNavigation/Items/Compass/Compass";
import { terriaTheme } from "../../../../../lib/ReactViews/StandardUserInterface";

describe("Compass", function () {
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

  describe("with basic props", function () {
    it("renders", function () {
      const { container } = render(
        <ThemeProvider theme={terriaTheme}>
          <Compass theme={terriaTheme} viewState={viewState} terria={terria} />
        </ThemeProvider>
      );

      const icons = container.querySelectorAll("svg");
      expect(icons.length).toBe(4);
    });
  });
});
