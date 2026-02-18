import { screen } from "@testing-library/react";
import { runInAction } from "mobx";
import Terria from "../../../../lib/Models/Terria";
import ViewState from "../../../../lib/ReactViewModels/ViewState";
import TrainerBar from "../../../../lib/ReactViews/StandardUserInterface/TrainerBar/TrainerBar";
import { renderWithContexts } from "../../withContext";
import TestHelpContent from "./test-help-content";

describe("TrainerBar", function () {
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
    it("mounts without problems", function () {
      const { container } = renderWithContexts(<TrainerBar />, viewState);

      expect(container).toBeEmptyDOMElement();
    });

    it("renders nothing when setTrainerBarVisible is false", function () {
      runInAction(() => {
        terria.updateParameters({
          regionMappingDefinitionsUrl: "",
          initFragmentPaths: [],
          storyEnabled: false,
          helpContent: [TestHelpContent as any]
        });
        viewState.setTrainerBarVisible(false);
      });

      expect(viewState.trainerBarVisible).toEqual(false);

      const { container } = renderWithContexts(<TrainerBar />, viewState);

      expect(container).toBeEmptyDOMElement();
    });

    it("renders a button to toggle visibility", function () {
      runInAction(() => {
        terria.updateParameters({
          regionMappingDefinitionsUrl: "",
          initFragmentPaths: [],
          storyEnabled: false,
          helpContent: [TestHelpContent as any]
        });
        viewState.setTrainerBarVisible(true);
      });
      const { container } = renderWithContexts(<TrainerBar />, viewState);

      expect(container.querySelectorAll("div").length).toBeTruthy();
      expect(screen.getAllByRole("button").length).toBeTruthy();
    });
  });
});
