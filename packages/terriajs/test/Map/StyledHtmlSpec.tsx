import { render, screen } from "@testing-library/react";
import { runInAction } from "mobx";
import Terria from "../../lib/Models/Terria";
import ViewState from "../../lib/ReactViewModels/ViewState";
import { StyledHtmlRaw } from "../../lib/ReactViews/Map/Panels/HelpPanel/StyledHtml";
import registerCustomComponentTypes from "../../lib/ReactViews/Custom/registerCustomComponentTypes";
import { TerriaThemeProvider } from "../ReactViews/withContext";

describe("StyledHtml", function () {
  let terria: Terria;
  let viewState: ViewState;

  beforeEach(function () {
    terria = new Terria({
      baseUrl: "./"
    });
    viewState = new ViewState({
      terria: terria
    });
  });

  describe("with basic props", function () {
    it("mounts without problems", function () {
      render(
        <TerriaThemeProvider>
          <StyledHtmlRaw
            markdown={"something something spatial data mochi"}
            viewState={viewState}
          />
        </TerriaThemeProvider>
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
        <TerriaThemeProvider>
          <StyledHtmlRaw
            markdown={"something something spatial data mochi"}
            viewState={viewState}
          />
        </TerriaThemeProvider>
      );

      expect(
        screen.getByRole("button", { name: "spatial data" })
      ).toBeVisible();
    });
  });
});
