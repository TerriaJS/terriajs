import Terria from "../../../lib/Models/Terria";
import ViewState from "../../../lib/ReactViewModels/ViewState";
import BottomDock from "../../../lib/ReactViews/BottomDock/BottomDock";
import { renderWithContexts } from "../withContext";

describe("BottomDock", function () {
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

  it("must create TJS-BottomDockFirstPortal", function () {
    const { container } = renderWithContexts(
      <BottomDock terria={terria} viewState={viewState} />,
      viewState
    );

    expect(container.querySelector("#TJS-BottomDockFirstPortal")).toBeVisible();
  });

  it("must create TJS-BottomDockLastPortal", function () {
    const { container } = renderWithContexts(
      <BottomDock terria={terria} viewState={viewState} />,
      viewState
    );
    expect(container.querySelector("#TJS-BottomDockLastPortal")).toBeVisible();
  });
});
