const create: any = require("react-test-renderer").create;
import React from "react";
import { act } from "react-dom/test-utils";
import Terria from "../../../lib/Models/Terria";
import ViewState from "../../../lib/ReactViewModels/ViewState";
import Breadcrumbs from "../../../lib/ReactViews/Search/Breadcrumbs";
import DataCatalogTab from "../../../lib/ReactViews/ExplorerWindow/Tabs/DataCatalogTab";
import Icon from "../../../lib/ReactViews/Icon";
import { ThemeProvider } from "styled-components";
import { terriaTheme } from "../../../lib/ReactViews/StandardUserInterface/StandardTheme";
import { runInAction } from "mobx";

describe("Breadcrumbs", function() {
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

  describe("with breadcrumbsShown set to true", function() {
    it("renders", function() {
      runInAction(() => {
        viewState.showBreadcrumbs(true);
      });

      act(() => {
        testRenderer = create(
          <ThemeProvider theme={terriaTheme}>
            <DataCatalogTab terria={terria} viewState={viewState} />
          </ThemeProvider>
        );
      });

      const breadcrumbs = testRenderer.root.findByType(Breadcrumbs);
      expect(breadcrumbs).toBeDefined();
      const icon = breadcrumbs.findByType(Icon);
      expect(icon.props.glyph.id).toBe("globe");
    });
  });

  describe("with breadcrumbsShown set to false", function() {
    it("does not render", function() {
      runInAction(() => {
        viewState.showBreadcrumbs(false);
      });

      act(() => {
        testRenderer = create(
          <ThemeProvider theme={terriaTheme}>
            <DataCatalogTab terria={terria} viewState={viewState} />
          </ThemeProvider>
        );
      });

      expect(() => {
        testRenderer.root.findByType(Breadcrumbs);
      }).toThrow();
    });
  });
});
