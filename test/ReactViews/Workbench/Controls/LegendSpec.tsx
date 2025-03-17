import { findAllWithClass } from "react-shallow-testutils";
import TestRenderer from "react-test-renderer";
import CsvCatalogItem from "../../../../lib/Models/Catalog/CatalogItems/CsvCatalogItem";
import WebMapServiceCatalogItem from "../../../../lib/Models/Catalog/Ows/WebMapServiceCatalogItem";
import Terria from "../../../../lib/Models/Terria";
import Legend from "../../../../lib/ReactViews/Workbench/Controls/Legend";
import { getShallowRenderedOutput } from "../../MoreShallowTools";

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

    it("A legend image can be rendered", function (done) {
      wmsItem
        .loadMapItems()
        .then(() => {
          const testRenderer = TestRenderer.create(<Legend item={wmsItem} />);

          const legends = testRenderer.root.findAllByType("img");
          expect(legends.length).toEqual(1);
        })
        .then(done);
    });

    it("A legend image can be hidden", function (done) {
      wmsItem.setTrait("definition", "hideLegendInWorkbench", true);
      wmsItem
        .loadMapItems()
        .then(() => {
          const legendSection = <Legend item={wmsItem} />;
          const result = getShallowRenderedOutput(legendSection);
          expect(result).toBeNull();
        })
        .then(done);
    });
  });

  xdescribe(" - from Table", function () {
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
      const legendSection = <Legend item={csvItem} />;
      const result = getShallowRenderedOutput(legendSection);
      const memberComponents = findAllWithClass(
        result,
        "tjs-legend__legendTitles"
      );
      expect(memberComponents.length).toEqual(2);
      expect(memberComponents[0].props.children[1].props.children).toEqual(
        "1,500 to 2,000"
      );
    });

    it(" - can be formatted using toLocaleString", function () {
      csvItem.defaultColumn.setTrait("definition", "format", {
        style: "currency",
        currency: "AUD",
        minimumFractionDigits: 0
      });

      const legendSection = <Legend item={csvItem} />;
      const result = getShallowRenderedOutput(legendSection);
      const memberComponents = findAllWithClass(
        result,
        "tjs-legend__legendTitles"
      );
      expect(memberComponents.length).toEqual(2);
      // toLocaleString can return $1,500 when using locale en-AU and A$1,500 when using en
      expect(
        ["$1,500 to $2,000", "A$1,500 to A$2,000"].includes(
          memberComponents[0].props.children[1].props.children
        )
      ).toBeTruthy();
    });
  });
});
