import Terria from "../../lib/Models/Terria";
import ViewState from "../../lib/ReactViewModels/ViewState";

describe("ToolButton", function() {
  let viewState: ViewState;

  beforeEach(function() {
    const terria = new Terria();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    viewState = new ViewState({
      terria,
      catalogSearchProvider: undefined,
      locationSearchProviders: []
    });
  });
});
