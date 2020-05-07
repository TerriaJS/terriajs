const create: any = require("react-test-renderer").create;
import React from "react";
import { act } from "react-dom/test-utils";
import { runInAction } from "mobx";
import { withThemeContext } from "../withThemeContext";
import Terria from "../../../lib/Models/Terria";
import ViewState from "../../../lib/ReactViewModels/ViewState";
import CloseButton from "../../../lib/ReactViews/Generic/CloseButton";
import TourPortal, {
  TourGrouping,
  TourPreface
} from "../../../lib/ReactViews/Tour/TourPortal";

describe("TourPortal", function() {
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
    describe("renders", function() {
      it("nothing when current tour index is negative", function() {
        act(() => {
          testRenderer = create(<TourPortal viewState={viewState} />);
        });

        expect(() => testRenderer.root.findByType("div")).toThrow();
      });
      it("renders something using the TourPreface path under preface conditions", function() {
        runInAction(() => {
          viewState.currentTourIndex = 0;
          viewState.setShowTour(false);
        });
        act(() => {
          testRenderer = create(
            withThemeContext(<TourPortal viewState={viewState} />)
          );
        });

        const buttons = testRenderer.root.findAllByType("button");
        expect(testRenderer.root.children).toBeDefined();
        expect(buttons).toBeDefined();
        expect(buttons.length).toEqual(3);
        const closeButton = testRenderer.root.findAllByType(CloseButton);
        expect(closeButton).toBeDefined();
        expect(closeButton.length).toEqual(1);
        expect(testRenderer.root.findByType(TourPreface)).toBeDefined();
        expect(() => testRenderer.root.findByType(TourGrouping)).toThrow();
      });
      it("renders something using the TourGrouping path under showPortal conditions", function() {
        runInAction(() => {
          viewState.currentTourIndex = 0;
          viewState.setShowTour(true);
        });
        act(() => {
          testRenderer = create(
            withThemeContext(<TourPortal viewState={viewState} />)
          );
        });

        const buttons = testRenderer.root.findAllByType("button");
        expect(buttons).toBeDefined();
        expect(buttons.length).toEqual(3);
        const closeButton = testRenderer.root.findAllByType(CloseButton);
        expect(closeButton).toBeDefined();
        expect(closeButton.length).toEqual(1);

        expect(testRenderer.root.findByType(TourGrouping)).toBeDefined();
        expect(() => testRenderer.root.findByType(TourPreface)).toThrow();
      });
    });
    // it("renders and clearSearch triggers onSearchTextChanged callback", function() {
    //   act(() => {
    //     testRenderer = create(tourPortalWithProps);
    //   });

    //   const searchBoxInstance = testRenderer.root.instance;
    //   expect(searchBoxValue).toEqual("something");
    //   // attempt clear search method
    //   searchBoxInstance.clearSearch();
    //   // Now it should be reset
    //   expect(searchBoxValue).toEqual("");
    // });
  });
});
