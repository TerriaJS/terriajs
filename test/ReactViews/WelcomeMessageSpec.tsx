const create: any = require("react-test-renderer").create;
import { runInAction } from "mobx";
import React from "react";
import { act } from "react-dom/test-utils";
import CommonStrata from "../../lib/Models/Definition/CommonStrata";
import Terria from "../../lib/Models/Terria";
import ViewState from "../../lib/ReactViewModels/ViewState";
import { WelcomeMessagePureBase } from "../../lib/ReactViews/WelcomeMessage/WelcomeMessage";
const WelcomeMessage: any = require("../../lib/ReactViews/WelcomeMessage/WelcomeMessage")
  .default;

describe("WelcomeMessage", function() {
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

  it("renders when welcomeMessage.show is set to true in config file", function() {
    runInAction(() =>
      terria.configParameters.welcomeMessage.setTrait(
        CommonStrata.user,
        "show",
        true
      )
    );
    act(() => {
      testRenderer = create(<WelcomeMessage viewState={viewState} />);
    });
    const welcomeMessagePure = testRenderer.root.findByType(
      WelcomeMessagePureBase
    );
    expect(welcomeMessagePure.props.showWelcomeMessage).toEqual(true);
  });

  it("doesn't render when welcomeMessage.show is set to false in config file", function() {
    runInAction(() =>
      terria.configParameters.welcomeMessage.setTrait(
        CommonStrata.user,
        "show",
        false
      )
    );
    act(() => {
      testRenderer = create(<WelcomeMessage viewState={viewState} />);
    });
    const welcomeMessagePure = testRenderer.root.findByType(
      WelcomeMessagePureBase
    );
    expect(welcomeMessagePure.props.showWelcomeMessage).toEqual(false);
  });
});
