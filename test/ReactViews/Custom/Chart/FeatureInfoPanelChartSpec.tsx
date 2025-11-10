import {
  render,
  screen,
  waitForElementToBeRemoved
} from "@testing-library/react";
import { ThemeProvider } from "styled-components";
import CsvCatalogItem from "../../../../lib/Models/Catalog/CatalogItems/CsvCatalogItem";
import CommonStrata from "../../../../lib/Models/Definition/CommonStrata";
import TerriaFeature from "../../../../lib/Models/Feature/Feature";
import Terria from "../../../../lib/Models/Terria";
import ViewState from "../../../../lib/ReactViewModels/ViewState";
import { ChartAttributes } from "../../../../lib/ReactViews/Custom/ChartCustomComponent";
import CsvChartCustomComponent from "../../../../lib/ReactViews/Custom/CsvChartCustomComponent";
import CustomComponent, {
  ProcessNodeContext
} from "../../../../lib/ReactViews/Custom/CustomComponent";
import parseCustomHtmlToReact from "../../../../lib/ReactViews/Custom/parseCustomHtmlToReact";
import { terriaTheme } from "../../../../lib/ReactViews/StandardUserInterface";

import regionMapping from "../../../../wwwroot/data/regionMapping.json";

import csv from "../../../../wwwroot/test/csv_nongeo/x_height.csv";

describe("FeatureInfoPanelChart", function () {
  let context: ProcessNodeContext;

  beforeEach(function () {
    const terria = new Terria();
    const catalogItem = new CsvCatalogItem("test", terria, undefined);
    catalogItem.setTrait(
      CommonStrata.user,
      "url",
      "test/csv/lat_lon_name_url_col.csv"
    );

    context = {
      terria: new Terria(),
      viewState: new ViewState({ terria, catalogSearchProvider: undefined }),
      feature: new TerriaFeature({}),
      catalogItem
    };

    CustomComponent.register(new CsvChartCustomComponent());

    jasmine.Ajax.install();
    jasmine.Ajax.stubRequest(
      "build/TerriaJS/data/regionMapping.json"
    ).andReturn({ responseJSON: regionMapping });

    // Without stubbing the chart csv, the specs could fail due to loadMapItems
    // not finishing by the time the test renderer returns.
    // So expect some race conditions here.
    jasmine.Ajax.stubRequest("test/csv_nongeo/x_height.csv").andReturn({
      responseText: csv
    });
  });

  afterEach(function () {
    jasmine.Ajax.uninstall();
  });

  describe("yColumn prop", function () {
    describe("when specified", function () {
      it("renders the correct y-column", async function () {
        renderChart(
          `<chart src="test/csv_nongeo/x_height.csv" y-column="plant height"></chart>`,
          context
        );
        await waitForElementToBeRemoved(() =>
          screen.queryByText("chart.noData")
        );

        expect(screen.getByText("Plant Height x x")).toBeVisible();
      });

      it("renders nothing if the specified y-column does not exist", async function () {
        renderChart(
          `<chart src="test/csv_nongeo/x_height.csv" y-column="foo-does-not-exist"></chart>`,
          context
        );

        expect(screen.queryByText("chart.noData")).toBeVisible();
      });
    });

    describe("otherwise", function () {
      it("renders the first line type chart item", async function () {
        renderChart(
          `<chart src="test/csv_nongeo/x_height.csv"></chart>`,
          context
        );

        await waitForElementToBeRemoved(() =>
          screen.queryByText("chart.noData")
        );

        expect(screen.getByText("Z x x")).toBeVisible();
      });
    });
  });

  it("can show a custom X axis label", async function () {
    renderChart(
      `<chart src="test/csv_nongeo/x_height.csv" preview-x-label="life-time"></chart>`,
      context
    );

    await waitForElementToBeRemoved(() => screen.queryByText("chart.noData"));

    expect(screen.getAllByText("life-time")[1]).toBeVisible();
  });
});

/**
 * Render the given chart markup and return the test renderer.
 */
function renderChart(chartMarkup: string, context: ProcessNodeContext): void {
  const chartElements = parseCustomHtmlToReact(chartMarkup, context, false, {
    ADD_TAGS: ["chart"],
    ADD_ATTR: ChartAttributes
  });
  render(<ThemeProvider theme={terriaTheme}>{chartElements}</ThemeProvider>);
}
