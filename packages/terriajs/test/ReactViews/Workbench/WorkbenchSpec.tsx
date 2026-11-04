import { screen } from "@testing-library/react";
import Terria from "../../../lib/Models/Terria";
import ViewState from "../../../lib/ReactViewModels/ViewState";
import Workbench from "../../../lib/ReactViews/Workbench/Workbench";
import { renderWithContexts } from "../withContext";

describe("Workbench panel", function () {
  let terria: Terria;
  let viewState: ViewState;

  beforeEach(function () {
    terria = new Terria({ baseUrl: "./" });
    viewState = new ViewState({ terria });
  });

  function renderWorkbench() {
    renderWithContexts(
      <Workbench terria={terria} viewState={viewState} />,
      viewState
    );
  }

  describe("the workbench-remove-all element", function () {
    it("renders Remove All when nothing hides it", function () {
      renderWorkbench();

      expect(screen.queryByText("workbench.removeAll")).toBeVisible();
    });

    it("renders Remove All when the element is visible", function () {
      terria.elements.set("workbench-remove-all", { visible: true });
      renderWorkbench();

      expect(screen.queryByText("workbench.removeAll")).toBeVisible();
    });

    it("does not render Remove All when the element is hidden", function () {
      terria.elements.set("workbench-remove-all", { visible: false });
      renderWorkbench();

      expect(screen.queryByText("workbench.removeAll")).toBeNull();
    });
  });
});
