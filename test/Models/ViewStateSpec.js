import Terria from "../../lib/Models/Terria";
import ViewState, {
  DATA_CATALOG_NAME
} from "../../lib/ReactViewModels/ViewState";

describe("ViewState", function() {
  var terria;
  var viewState;

  beforeEach(function() {
    terria = new Terria({
      baseUrl: "./"
    });
    viewState = new ViewState({
      terria: terria
    });
  });

  it("opens Add Data when openAddData is set to true in config file", function() {
    terria.configParameters.openAddData = true;
    viewState.afterTerriaStarted();
    expect(viewState.explorerPanelIsVisible).toEqual(true);
    expect(viewState.activeTabCategory).toEqual(DATA_CATALOG_NAME);
  });

  it("does not open Add Data when openAddData is set to false in config file", function() {
    terria.configParameters.openAddData = false;
    viewState.afterTerriaStarted();
    expect(viewState.explorerPanelIsVisible).toEqual(false);
  });
});
