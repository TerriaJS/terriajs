import React from "react";
import TestRenderer, { act, ReactTestRenderer } from "react-test-renderer";
import { ThemeProvider } from "styled-components";
import Terria from "../../../lib/Models/Terria";
import WebMapServiceCatalogItem from "../../../lib/Models/Catalog/Ows/WebMapServiceCatalogItem";
import ViewState from "../../../lib/ReactViewModels/ViewState";
import Compare, { PropsType } from "../../../lib/ReactViews/Compare/Compare";
import { terriaTheme } from "../../../lib/ReactViews/StandardUserInterface/StandardTheme";

describe("Compare", function() {
  let terria: Terria;
  let viewState: ViewState;
  let leftItem: WebMapServiceCatalogItem;
  let defaultProps: Omit<PropsType, "compareConfig">;

  const leftPanelItemId: string = "mywms";

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
    leftItem = new WebMapServiceCatalogItem(leftPanelItemId, terria);
    leftItem.setTrait(
      "definition",
      "url",
      "/test/WMS/single_style_legend_url.xml"
    );

    defaultProps = {
      viewState
    };
  });

  describe("when entering compare mode", function() {
    it("turns on the splitter", async function() {
      expect(terria.showSplitter).toBe(false);
      await renderCompare({
        ...defaultProps,
        compareConfig: { leftPanelItemId, rightPanelItemId: undefined }
      });
      expect(terria.showSplitter).toBe(true);
    });
  });

  describe("when leaving compare mode", function() {
    it("turns off the splitter", async function() {
      const renderer = await renderCompare({
        ...defaultProps,
        compareConfig: { leftPanelItemId, rightPanelItemId: undefined }
      });
      expect(terria.showSplitter).toBe(true);
      renderer.unmount();
      expect(terria.showSplitter).toBe(false);
    });
  });
});

async function renderCompare(props: PropsType): Promise<ReactTestRenderer> {
  let testRenderer: ReactTestRenderer;
  await act(() => {
    testRenderer = TestRenderer.create(
      <ThemeProvider theme={terriaTheme}>
        <Compare {...props} />
      </ThemeProvider>
    );
  });
  // @ts-ignore
  return testRenderer;
}
