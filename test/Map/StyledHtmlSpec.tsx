import { create } from "react-test-renderer";
import React from "react";
import { runInAction } from "mobx";
import { ThemeProvider } from "../../lib/Styled/styled";
import { act } from "react-dom/test-utils";
import Terria from "../../lib/Models/Terria";
import ViewState from "../../lib/ReactViewModels/ViewState";
import { terriaTheme } from "../../lib/ReactViews/StandardUserInterface/StandardTheme";
import StyledHtml from "../../lib/ReactViews/Map/Panels/HelpPanel/StyledHtml";
import { TooltipWithButtonLauncher } from "../../lib/ReactViews/Generic/TooltipWrapper";
import registerCustomComponentTypes from "../../lib/ReactViews/Custom/registerCustomComponentTypes";

describe("StyledHtml", function () {
  let terria: Terria;
  let viewState: ViewState;

  let testRenderer: any;

  beforeEach(function () {
    terria = new Terria({
      baseUrl: "./"
    });
    viewState = new ViewState({
      terria: terria,
      catalogSearchProvider: null,
      locationSearchProviders: []
    });
  });

  describe("with basic props", function () {
    it("mounts without problems", function () {
      act(() => {
        testRenderer = create(
          <ThemeProvider theme={terriaTheme}>
            <StyledHtml
              markdown={"something something spatial data mochi"}
              viewState={viewState}
            />
          </ThemeProvider>
        );
      });

      const renderer = testRenderer.root;
      expect(renderer).toBeDefined();
    });
    it("creates TooltipWithButtonLauncher when there are terms to inject", function () {
      registerCustomComponentTypes();
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
            <StyledHtml
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
  });
});
