import { render } from "@testing-library/react";
import Terria from "../../../../../lib/Models/Terria";
import ViewState from "../../../../../lib/ReactViewModels/ViewState";
import Compass from "../../../../../lib/ReactViews/Map/MapNavigation/Items/Compass/Compass";
import { terriaTheme } from "../../../../../lib/ReactViews/StandardUserInterface";
import { TerriaThemeProvider } from "../../../withContext";

describe("Compass", function () {
  let terria: Terria;
  let viewState: ViewState;

  beforeEach(function () {
    terria = new Terria({
      baseUrl: "./"
    });
    viewState = new ViewState({
      terria: terria
    });
  });

  describe("with basic props", function () {
    it("renders", function () {
      const { container } = render(
        <TerriaThemeProvider>
          <Compass theme={terriaTheme} viewState={viewState} terria={terria} />
        </TerriaThemeProvider>
      );

      const icons = container.querySelectorAll("svg");
      expect(icons.length).toBe(4);
    });
  });
});
