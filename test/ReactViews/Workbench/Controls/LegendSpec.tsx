import { render, screen } from "@testing-library/react";
import CsvCatalogItem from "../../../../lib/Models/Catalog/CatalogItems/CsvCatalogItem";
import WebMapServiceCatalogItem from "../../../../lib/Models/Catalog/Ows/WebMapServiceCatalogItem";
import Terria from "../../../../lib/Models/Terria";
import Legend from "../../../../lib/ReactViews/Workbench/Controls/Legend";

describe("Legend", function () {
  let terria: Terria;

  beforeEach(function () {
    terria = new Terria({
      baseUrl: "./"
    });
    terria.configParameters.regionMappingDefinitionsUrl =
      "./data/regionMapping.json";
  });

  describe(" - with image", function () {
    let wmsItem: WebMapServiceCatalogItem;
    beforeEach(function () {
      wmsItem = new WebMapServiceCatalogItem("mywms", terria);
      wmsItem.setTrait(
        "definition",
        "url",
        "/test/WMS/single_style_legend_url.xml"
      );
    });

    it("A legend image can be rendered", async function () {
      await wmsItem.loadMapItems();
      const { container } = render(<Legend item={wmsItem} />);
      const legends = container.querySelectorAll("img");
      expect(legends.length).toEqual(1);
    });

    it("A legend image can be hidden", async function () {
      wmsItem.setTrait("definition", "hideLegendInWorkbench", true);
      await wmsItem.loadMapItems();
      const { container } = render(<Legend item={wmsItem} />);
      expect(container.innerHTML).toBe("");
    });
  });

  describe(" - from Table", function () {
    let csvItem: CsvCatalogItem;
    beforeEach(async function () {
      csvItem = new CsvCatalogItem("mycsv", terria, undefined);
      csvItem.defaultStyle.color.setTrait("definition", "numberOfBins", 2);
      csvItem.setTrait(
        "definition",
        "csvString",
        "Value,lat,lon\n1000,0,0\n2000,0,0"
      );
      await csvItem.loadMapItems();
    });

    it(" - can be generated", function () {
      render(<Legend item={csvItem} />);
      expect(screen.getByText("1,500 to 2,000")).toBeTruthy();
    });

    it(" - can be formatted using toLocaleString", function () {
      csvItem.defaultColumn.setTrait("definition", "format", {
        style: "currency",
        currency: "AUD",
        minimumFractionDigits: 0
      });

      render(<Legend item={csvItem} />);
      // toLocaleString can return $1,500 when using locale en-AU and A$1,500 when using en
      const match =
        screen.queryByText("$1,500 to $2,000") ??
        screen.queryByText("A$1,500 to A$2,000");
      expect(match).toBeTruthy();
    });
  });
});
