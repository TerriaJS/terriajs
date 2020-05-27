const create: any = require("react-test-renderer").create;
import React from "react";
import { act } from "react-dom/test-utils";
import Terria from "../../lib/Models/Terria";
import ViewState from "../../lib/ReactViewModels/ViewState";
import { runInAction } from "mobx";
import Disclaimer from "../../lib/ReactViews/Disclaimer.jsx";
import FadeIn from "../../lib/ReactViews/Transitions/FadeIn/FadeIn.jsx";
import Box from "../../lib/Styled/Box.jsx";

describe("Disclaimer", function() {
  let terria: Terria;
  let viewState: ViewState;

  let testRenderer: any;

  beforeEach(function() {
    terria = new Terria({
      baseUrl: "./"
    });
    viewState = new ViewState({
      terria: terria,
      catalogSearchProvider: null,
      locationSearchProviders: []
    });
  });

  it("renders when globalDisclaimer property is defined in config file", function() {
    runInAction(() => {
      viewState.disclaimerSettings = {
        title: "Disclaimer",
        confirmText: "Ok",
        denyText: "Cancel",
        message: "Test"
      };
      viewState.disclaimerVisible = true;
    });
    act(() => {
      testRenderer = create(<Disclaimer viewState={viewState} />);
    });
    const disclaimerContainer = testRenderer.root.findAllByType(Box);
    console.log(disclaimerContainer);
    expect(disclaimerContainer.length).toBeTruthy();
  });

  it("doesn't render when globalDisclaimer property is not defined in config file", function() {
    runInAction(() => {
      terria.configParameters.globalDisclaimer = undefined;
      viewState.disclaimerVisible = false;
    });
    act(() => {
      testRenderer = create(<Disclaimer viewState={viewState} />);
    });
    const disclaimerContainer = testRenderer.root.findAllByType(Box);
    console.log(disclaimerContainer);
    expect(disclaimerContainer.length).toBeFalsy();
  });
});
