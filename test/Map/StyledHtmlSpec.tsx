import { create } from "react-test-renderer";
import React from "react";
import { runInAction } from "mobx";
import { ThemeProvider } from "styled-components";
import { act } from "react-dom/test-utils";
import Terria from "../../lib/Models/Terria";
import ViewState from "../../lib/ReactViewModels/ViewState";
// import TrainerBar from "../../lib/ReactViews/Map/TrainerBar/TrainerBar";
import { terriaTheme } from "../../lib/ReactViews/StandardUserInterface/StandardTheme";
import { StyledHtmlRaw } from "../../lib/ReactViews/Map/Panels/HelpPanel/StyledHtml";
import { TooltipWithButtonLauncher } from "../../lib/ReactViews/Generic/TooltipWrapper";
import registerCustomComponentTypes from "../../lib/ReactViews/Custom/registerCustomComponentTypes";
// import Box from "../../lib/Styled/Box";

describe("StyledHtml", function() {
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
    it("mounts without problems", function() {
      act(() => {
        testRenderer = create(
          <ThemeProvider theme={terriaTheme}>
            <StyledHtmlRaw
              markdown={"something something spatial data mochi"}
              viewState={viewState}
            />
          </ThemeProvider>
        );
      });

      const renderer = testRenderer.root;
      expect(renderer).toBeDefined();
    });
    it("creates TooltipWithButtonLauncher when there are terms to inject", function() {
      registerCustomComponentTypes(terria);
      const spatialDataTerm = {
        term: "spatial data",
        content: "data that is spatial, spluh"
      };
      runInAction(() => {
        terria.updateParameters({
          regionMappingDefinitionsUrl: "",
          initFragmentPaths: [],
          storyEnabled: false,
          helpContentTerms: [spatialDataTerm]
        });
      });
      act(() => {
        testRenderer = create(
          <ThemeProvider theme={terriaTheme}>
            <StyledHtmlRaw
              markdown={"something something spatial data mochi"}
              viewState={viewState}
            />
          </ThemeProvider>
        );
      });

      const renderer = testRenderer.root;
      expect(renderer).toBeDefined();
      const tooltipWrapper = renderer.findByType(TooltipWithButtonLauncher);
      expect(tooltipWrapper).toBeDefined();
    });
    // it("renders nothing when setTrainerBarVisible is false", function() {
    //   runInAction(() => {
    //     terria.updateParameters({
    //       regionMappingDefinitionsUrl: "",
    //       initFragmentPaths: [],
    //       storyEnabled: false,
    //       helpContent: [TestHelpContent as any]
    //     });
    //     viewState.setTrainerBarVisible(false);
    //   });
    //   expect(viewState.trainerBarVisible).toEqual(false);
    //   act(() => {
    //     testRenderer = create(
    //       <ThemeProvider theme={terriaTheme}>
    //         <TrainerBar terria={terria} viewState={viewState} />
    //       </ThemeProvider>
    //     );
    //   });

    //   const divs = testRenderer.root.findAllByType("div");
    //   const buttons = testRenderer.root.findAllByType("button");
    //   const boxes = testRenderer.root.findAllByType(Box);

    //   expect(divs.length).toEqual(0);
    //   expect(buttons.length).toEqual(0);
    //   expect(boxes.length).toEqual(0);
    // });
    // it("renders a button to toggle visibility", function() {
    //   runInAction(() => {
    //     terria.updateParameters({
    //       regionMappingDefinitionsUrl: "",
    //       initFragmentPaths: [],
    //       storyEnabled: false,
    //       helpContent: [TestHelpContent as any]
    //     });
    //     viewState.setTrainerBarVisible(true);
    //   });
    //   act(() => {
    //     testRenderer = create(
    //       <ThemeProvider theme={terriaTheme}>
    //         <TrainerBar terria={terria} viewState={viewState} />
    //       </ThemeProvider>
    //     );
    //   });

    //   const divs = testRenderer.root.findAllByType("div");
    //   const buttons = testRenderer.root.findAllByType("button");
    //   const boxes = testRenderer.root.findAllByType(Box);
    //   expect(divs.length).toBeTruthy();
    //   expect(buttons.length).toBeTruthy();
    //   expect(boxes.length).toBeTruthy();
    // });
  });
});
