const create: any = require("react-test-renderer").create;
import React from "react";
import { act } from "react-dom/test-utils";
import Terria from "../../../../../lib/Models/Terria";
import ViewState from "../../../../../lib/ReactViewModels/ViewState";
import Compass from "../../../../../lib/ReactViews/Map/Navigation/Compass";

describe("GyroscopeGuidance", function() {
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

  describe("with basic props", function() {
    const searchBoxWithProps = (
      <Compass onClose={() => {}} viewState={viewState} terria={terria} />
    );

    it("renders", function() {
      act(() => {
        testRenderer = create(searchBoxWithProps);
      });

      const button = testRenderer.root.findByType("button");
      expect(button).toBeDefined();
    });
  });
});
