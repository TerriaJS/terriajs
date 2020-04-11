"use strict";

/*global require,expect*/
import React from "react";
import { getShallowRenderedOutput } from "./MoreShallowTools";
import WelcomeMessage from "../../lib/ReactViews/WelcomeMessage/WelcomeMessage.jsx";
import Terria from "../../lib/Models/Terria";
import ViewState from "../../lib/ReactViewModels/ViewState";

describe("WelcomeMessage", function() {
  let terria;
  let viewState;

  beforeEach(function() {
    terria = new Terria({
      baseUrl: "./"
    });
    viewState = new ViewState({
      terria: terria
    });
  });

  it("is displayed when showWelcomeMessage is set to true in config file", function() {
    terria.configParameters.showWelcomeMessage = true;
    const welcomeMessage = <WelcomeMessage viewState={viewState} />;
    const result = getShallowRenderedOutput(welcomeMessage);
    expect(result.props.showWelcomeMessage).toEqual(true);
  });

  it("is not displayed when showWelcomeMessage is set to false in config file", function() {
    terria.configParameters.showWelcomeMessage = false;
    const welcomeMessage = <WelcomeMessage viewState={viewState} />;
    const result = getShallowRenderedOutput(welcomeMessage);
    expect(result.props.showWelcomeMessage).not.toEqual(true);
  });
});
