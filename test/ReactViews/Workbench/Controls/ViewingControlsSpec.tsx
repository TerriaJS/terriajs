import { action } from "mobx";
import React from "react";
import { act } from "react-dom/test-utils";
import TestRenderer, { ReactTestRenderer } from "react-test-renderer";
import Terria from "../../../../lib/Models/Terria";
import WebMapServiceCatalogItem from "../../../../lib/Models/WebMapServiceCatalogItem";
import ViewState from "../../../../lib/ReactViewModels/ViewState";

const ViewingControls = require("../../../../lib/ReactViews/Workbench/Controls/ViewingControls");

describe("ViewingControls", function() {
  let terria: Terria;
  let viewState: ViewState;
  let testRenderer: ReactTestRenderer;

  beforeEach(function() {
    terria = new Terria({
      baseUrl: "./"
    });
    terria.configParameters.regionMappingDefinitionsUrl =
      "./data/regionMapping.json";
    (terria.currentViewer as any).canShowSplitter = true;
    viewState = new ViewState({
      terria,
      catalogSearchProvider: undefined,
      locationSearchProviders: []
    });
  });

  describe("compare", function() {
    let wmsItem: WebMapServiceCatalogItem;

    beforeEach(
      action(function() {
        wmsItem = new WebMapServiceCatalogItem("mywms", terria);
        wmsItem.setTrait(
          "definition",
          "url",
          "/test/WMS/single_style_legend_url.xml"
        );
        viewState.workbenchWithOpenControls = wmsItem.uniqueId;
      })
    );

    it("shows compare option for items that can be compared", function() {
      act(() => {
        testRenderer = TestRenderer.create(
          <ViewingControls viewState={viewState} item={wmsItem} />
        );
      });
      const compareItemMenuOption = testRenderer.root.findByProps({
        title: "workbench.splitItemTitle"
      });
      expect(compareItemMenuOption).toBeDefined();
    });

    it("sets the left comparison item when compare option is selected", function() {
      act(() => {
        testRenderer = TestRenderer.create(
          <ViewingControls viewState={viewState} item={wmsItem} />
        );
      });
      const compareItemMenuOption = testRenderer.root.findByProps({
        title: "workbench.splitItemTitle"
      });
      expect(terria.compareLeftItemId).toBeUndefined();
      compareItemMenuOption.props.onClick();
      expect(terria.compareLeftItemId).toBe("mywms");
    });
  });
});
