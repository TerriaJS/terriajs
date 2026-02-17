import { render, screen } from "@testing-library/react";
import Terria from "../../../lib/Models/Terria";
import ViewState from "../../../lib/ReactViewModels/ViewState";
import { runInAction } from "mobx";
import Prompt from "../../../lib/ReactViews/Generic/Prompt";

describe("HelpPrompt", function () {
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

  describe("with basic props, when welcome message is enabled on startup", function () {
    it("does not render when welcome message is visible", function () {
      runInAction(() => {
        terria.configParameters.showWelcomeMessage = true;
        viewState.showWelcomeMessage = true;
      });
      render(
        <Prompt
          isVisible={
            terria.configParameters.showWelcomeMessage &&
            !viewState.showWelcomeMessage
          }
          displayDelay={0}
          dismissText={""}
          dismissAction={() => {}}
          content={<>foo</>}
        />
      );
      expect(screen.queryByText("foo")).not.toBeInTheDocument();
    });

    it("renders when welcome message is not visible", function () {
      runInAction(() => {
        terria.configParameters.showWelcomeMessage = true;
        viewState.showWelcomeMessage = false;
      });
      render(
        <Prompt
          isVisible={
            (terria.configParameters.showWelcomeMessage ?? false) &&
            !viewState.showWelcomeMessage
          }
          displayDelay={0}
          dismissText={""}
          dismissAction={() => {}}
          content={<>foo</>}
        />
      );

      expect(screen.getByText("foo")).toBeVisible();
    });
  });

  describe("when welcome message is disabled on startup", function () {
    it("does not render", function () {
      runInAction(() => {
        terria.configParameters.showWelcomeMessage = false;
      });
      render(
        <Prompt
          isVisible={
            (terria.configParameters.showWelcomeMessage ?? false) &&
            !viewState.showWelcomeMessage
          }
          displayDelay={0}
          dismissText={""}
          dismissAction={() => {}}
          content={<>foo</>}
        />
      );
      expect(screen.queryByText("foo")).not.toBeInTheDocument();
    });
  });
});
