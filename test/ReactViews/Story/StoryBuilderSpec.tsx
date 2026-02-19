import { screen } from "@testing-library/dom";
import { runInAction } from "mobx";
import Terria from "../../../lib/Models/Terria";
import ViewState from "../../../lib/ReactViewModels/ViewState";
import StoryBuilder from "../../../lib/ReactViews/Story/StoryBuilder";
import { renderWithContexts } from "../withContext";

describe("StoryBuilder", function () {
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
    runInAction(() => {
      viewState.storyBuilderShown = true;
      terria.stories = [
        {
          id: "test-story",
          title: "Test Story",
          text: "A test story",
          shareData: { version: "8.0.0", initSources: [] }
        }
      ];
    });
  });

  it("does not show save instructions by default", function () {
    renderWithContexts(<StoryBuilder />, viewState);
    expect(
      screen.queryByText("story.saveInstructions")
    ).not.toBeInTheDocument();
  });

  it("does not show save instructions when showStorySaveInstructions is false", function () {
    runInAction(() => {
      terria.configParameters.showStorySaveInstructions = false;
    });
    renderWithContexts(<StoryBuilder />, viewState);
    expect(
      screen.queryByText("story.saveInstructions")
    ).not.toBeInTheDocument();
  });

  it("shows save instructions when showStorySaveInstructions is true", function () {
    runInAction(() => {
      terria.configParameters.showStorySaveInstructions = true;
    });
    renderWithContexts(<StoryBuilder />, viewState);
    expect(screen.getByText("story.saveInstructions")).toBeInTheDocument();
  });
});
