import { render, screen } from "@testing-library/react";
import { runInAction } from "mobx";
import { ThemeProvider } from "styled-components";
import Terria from "../../lib/Models/Terria";
import ViewState from "../../lib/ReactViewModels/ViewState";
import { terriaTheme } from "../../lib/ReactViews/StandardUserInterface";
import { StyledHtmlRaw } from "../../lib/ReactViews/Map/Panels/HelpPanel/StyledHtml";
import registerCustomComponentTypes from "../../lib/ReactViews/Custom/registerCustomComponentTypes";

describe("StyledHtml", function () {
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

  describe("with basic props", function () {
    it("mounts without problems", function () {
      render(
        <ThemeProvider theme={terriaTheme}>
          <StyledHtmlRaw
            markdown={"something something spatial data mochi"}
            viewState={viewState}
          />
        </ThemeProvider>
      );

      expect(
        screen.getByText("something something spatial data mochi")
      ).toBeVisible();
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
      render(
        <ThemeProvider theme={terriaTheme}>
          <StyledHtmlRaw
            markdown={"something something spatial data mochi"}
            viewState={viewState}
          />
        </ThemeProvider>
      );

      expect(
        screen.getByRole("button", { name: "spatial data" })
      ).toBeVisible();
    });
  });
});
