import { configure, reaction, toJS } from "mobx";
import addUserCatalogMember from "../../../../lib/Models/Catalog/addUserCatalogMember";
import CommonStrata from "../../../../lib/Models/Definition/CommonStrata";
import CsvCatalogItem from "../../../../lib/Models/Catalog/CatalogItems/CsvCatalogItem";
import Terria from "../../../../lib/Models/Terria";
import YDYRCatalogFunction from "../../../../lib/Models/Catalog/CatalogFunctions/YDYRCatalogFunction";
import YDYRCatalogFunctionJob from "../../../../lib/Models/Catalog/CatalogFunctions/YDYRCatalogFunctionJob";
import "../../../SpecHelpers";

const regionMapping = JSON.stringify(
  require("../../../../wwwroot/data/regionMapping.json")
);

const sa4regionCodes = JSON.stringify(
  require("../../../../wwwroot/data/regionids/region_map-SA4_2016_AUST_SA4_CODE16.json")
);

const lga2011RegionCodes = JSON.stringify(
  require("../../../../wwwroot/data/regionids/region_map-FID_LGA_2011_AUST_LGA_CODE11.json")
);

configure({
  enforceActions: "observed",
  computedRequiresReaction: true
});

const lga11Csv = require("raw-loader!../../../../wwwroot/test/csv/lga_code_2011.csv");

describe("YDYRCatalogFunction", function () {
  let terria: Terria;
  let csv: CsvCatalogItem;
  let ydyr: YDYRCatalogFunction;

  beforeEach(async function () {
    jasmine.Ajax.install();
    jasmine.Ajax.stubRequest(
      "http://example.com/api/v1/disaggregate.json"
    ).andReturn({ responseText: `"someStatusId"` });

    jasmine.Ajax.stubRequest(
      "http://example.com/api/v1/download/someResultKey?format=csv"
    ).andReturn({
      responseText: `SA4_code_2016,Negative Binomial: Lower (10%),Negative Binomial: Upper (90%),Negative Binomial: Average
313,0,1,0
316,0,1,0
`
    });

    let logCounter = 0;
    jasmine.Ajax.stubRequest(
      "http://example.com/api/v1/status/someStatusId"
    ).andCallFunction((req) => {
      if (logCounter < 1) {
        req.respondWith({ responseText: `"Some Log ${logCounter}"` });

        logCounter++;
      } else {
        req.respondWith({
          responseText: `{"key":"someResultKey","report":{"Quality Control":"OK (Model is performing better than baseline), providing full result"}}`
        });
      }
    });

    jasmine.Ajax.stubRequest(
      "https://tiles.terria.io/region-mapping/regionids/region_map-SA4_2016_AUST_SA4_CODE16.json"
    ).andReturn({ responseText: sa4regionCodes });

    jasmine.Ajax.stubRequest(
      "https://tiles.terria.io/region-mapping/regionids/region_map-FID_LGA_2011_AUST_LGA_CODE11.json"
    ).andReturn({ responseText: lga2011RegionCodes });

    jasmine.Ajax.stubRequest(
      "build/TerriaJS/data/regionMapping.json"
    ).andReturn({ responseText: regionMapping });

    terria = new Terria();
    csv = new CsvCatalogItem("test", terria, undefined);

    csv.setTrait(CommonStrata.user, "csvString", lga11Csv);
    await csv.loadRegionProviderList();
    await csv.loadMapItems();
    addUserCatalogMember(terria, csv, { enable: true });

    ydyr = new YDYRCatalogFunction("testYdyr", terria);
    ydyr.setTrait(CommonStrata.definition, "parameters", {
      apiUrl: "http://example.com/api/v1/",
      "Negative Binomial": true,
      "Population Weighted": false,
      "Poisson Linear": false,
      "Ridge Regressor": false,
      "Output Geography": "ABS - 2016 Statistical Areas Level 4"
    });

    // A few reactions will happen, while setting default values for functionParameters
    await new Promise<void>((resolve, reject) => {
      reaction(
        () => ydyr.functionParameters,
        () => {
          if (ydyr.functionParameters.length === 9) resolve();
        }
      );
    });
  });

  afterEach(function () {
    jasmine.Ajax.uninstall();
  });

  it("has a type & typeName", function () {
    expect(YDYRCatalogFunction.type).toBe("ydyr");
    expect(ydyr.typeName).toBe("YourDataYourRegions");
  });

  describe("when loading", async function () {
    it("should correctly render functionParameters", function () {
      expect(ydyr.functionParameters.map(({ type }) => type)).toEqual([
        "string",
        "enumeration",
        "enumeration",
        "enumeration",
        "enumeration",
        "info",
        "boolean",
        "boolean",
        "info"
      ]);
    });

    it("should set default values", () => {
      expect(ydyr.functionParameters.map((p) => p.value)).toEqual([
        "http://example.com/api/v1/",
        csv.uniqueId,
        csv.activeTableStyle.regionColumn?.name,
        csv.activeStyle,
        "ABS - 2016 Statistical Areas Level 4",
        "Predictive models used to convert data between the input and output geographies:",
        true,
        false,
        "By submitting this form your tabular data will be sent to http://example.com/api/v1/ for processing."
      ]);
    });
  });

  describe("when submitted", async function () {
    let job: YDYRCatalogFunctionJob;
    let dispose: () => void;
    beforeEach(async () => {
      job = (await ydyr.submitJob()) as YDYRCatalogFunctionJob;
      dispose = reaction(
        () => job.mapItems,
        () => {}
      );
    });
    afterEach(() => {
      dispose();
    });
    it("should correctly set parameters", async function () {
      expect(toJS(job.parameters)).toEqual(toJS(ydyr.parameters));
    });

    it("should be in workbench", async function () {
      expect(job.inWorkbench).toBeTruthy();
    });

    it("calls YDYR api and sets status id", async function () {
      expect(job.jobId).toEqual("someStatusId");
    });

    it("polls twice - and creates 2 log entries", async function () {
      // Wait until job finished
      await new Promise<void>((resolve) => {
        reaction(
          () => job.jobStatus,
          (status) => (status === "finished" ? resolve() : undefined)
        );
      });

      expect(job.logs.length).toBe(2);
      expect(job.logs).toEqual([
        "Some Log 0",
        `{"key":"someResultKey","report":{"Quality Control":"OK (Model is performing better than baseline), providing full result"}}`
      ]);

      expect(job.resultId).toBe("someResultKey");
    });
    it("downloads results and creates CSVCatalogItem", async function () {
      // Wait until job finished downloading results
      await new Promise<void>((resolve) => {
        reaction(
          () => job.downloadedResults,
          (downloadedResults) => (downloadedResults ? resolve() : undefined)
        );
      });

      expect(job.results.length).toBe(1);
      expect(job.results[0].type).toBe(CsvCatalogItem.type);
      const result = job.results[0] as CsvCatalogItem;
      await result.loadMapItems();

      expect(result.tableColumns.length).toBe(4);
      expect(result.activeStyle).toBe("Negative Binomial: Lower (10%)");
      expect(result.regionProviderDimensions?.selectedId).toBe("SA4_2016");
      expect(result.enableManualRegionMapping).toBeTruthy();
      expect(result.inWorkbench).toBeTruthy();
    });
  });
});
