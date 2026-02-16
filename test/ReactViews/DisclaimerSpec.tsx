import { screen } from "@testing-library/react";
import { runInAction } from "mobx";
import Terria from "../../lib/Models/Terria";
import ViewState from "../../lib/ReactViewModels/ViewState";
import Disclaimer from "../../lib/ReactViews/Disclaimer";
import { renderWithContexts } from "./withContext";

describe("Disclaimer", function () {
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

  describe("with basic disclaimerSettings and disclaimerVisible set to true", function () {
    it("renders", function () {
      runInAction(() => {
        viewState.disclaimerSettings = {
          title: "Disclaimer",
          confirmText: "Ok",
          denyText: "Cancel",
          message: "Test"
        };
        viewState.disclaimerVisible = true;
      });
      renderWithContexts(<Disclaimer />, viewState);

      expect(screen.getByRole("button", { name: "Ok" })).toBeVisible();
    });
  });

  describe("with limited disclaimerSettings and disclaimerVisible set to true", function () {
    it("renders", function () {
      runInAction(() => {
        viewState.disclaimerSettings = {};
        viewState.disclaimerVisible = true;
      });
      renderWithContexts(<Disclaimer />, viewState);
      expect(screen.getByRole("button", { name: "Ok" })).toBeVisible();
    });
  });

  describe("with disclaimerVisible set to false", function () {
    it("does not render", function () {
      runInAction(() => {
        terria.configParameters.globalDisclaimer = undefined;
        viewState.disclaimerVisible = false;
      });
      renderWithContexts(<Disclaimer />, viewState);
      expect(
        screen.queryByRole("button", { name: "Ok" })
      ).not.toBeInTheDocument();
    });
  });
});
