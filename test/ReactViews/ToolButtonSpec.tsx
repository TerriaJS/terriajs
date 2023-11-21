import Terria from "../../lib/Models/Terria";
import ViewState from "../../lib/ReactViewModels/ViewState";

describe("ToolButton", function () {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let viewState: ViewState;

  beforeEach(function () {
    const terria = new Terria();
    viewState = new ViewState({
      terria,
      catalogSearchProvider: undefined,
      locationSearchProviders: []
    });
  });
});
