import { configure, reaction, runInAction } from "mobx";
import Cartographic from "terriajs-cesium/Source/Core/Cartographic";
import GeoJsonDataSource from "terriajs-cesium/Source/DataSources/GeoJsonDataSource";
import isDefined from "../../lib/Core/isDefined";
import TerriaError from "../../lib/Core/TerriaError";
import AsyncMappableMixin from "../../lib/ModelMixins/AsyncMappableMixin";
import CommonStrata from "../../lib/Models/CommonStrata";
import CsvCatalogItem from "../../lib/Models/CsvCatalogItem";
import DateTimeParameter from "../../lib/Models/FunctionParameters/DateTimeParameter";
import EnumerationParameter from "../../lib/Models/FunctionParameters/EnumerationParameter";
import GeoJsonParameter from "../../lib/Models/FunctionParameters/GeoJsonParameter";
import LineParameter from "../../lib/Models/FunctionParameters/LineParameter";
import PointParameter from "../../lib/Models/FunctionParameters/PointParameter";
import PolygonParameter from "../../lib/Models/FunctionParameters/PolygonParameter";
import RectangleParameter from "../../lib/Models/FunctionParameters/RectangleParameter";
import StringParameter from "../../lib/Models/FunctionParameters/StringParameter";
import Terria from "../../lib/Models/Terria";
import WebProcessingServiceCatalogFunction from "../../lib/Models/WebProcessingServiceCatalogFunction";
import WebProcessingServiceCatalogFunctionJob from "../../lib/Models/WebProcessingServiceCatalogFunctionJob";
import "../SpecHelpers";
import YDYRCatalogFunction from "../../lib/Models/YDYRCatalogFunction";
import addUserCatalogMember from "../../lib/Models/addUserCatalogMember";

const regionMapping = JSON.stringify(
  require("../../wwwroot/data/regionMapping.json")
);
configure({
  enforceActions: "observed",
  computedRequiresReaction: true
});

const lga11Csv = require("raw-loader!../../wwwroot/test/csv/lga_code_2011.csv");

describe("YDYRCatalogFunction", function() {
  let terria: Terria;
  let csv: CsvCatalogItem;
  let ydyr: YDYRCatalogFunction;

  beforeEach(async function() {
    jasmine.Ajax.install();
    jasmine.Ajax.stubRequest(
      "http://example.com/api/v1/disaggregate.json"
    ).andReturn({ responseText: `"someStatusId"` });

    let logCounter = 1;
    jasmine.Ajax.stubRequest(
      "http://example.com/api/v1/status/someStatusId"
    ).andCallFunction(req => {
      if (logCounter < 5) {
        req.respondWith({ responseText: `"Some Log ${logCounter}"` });

        logCounter++;
      } else {
        req.respondWith({
          responseText: `{
          "key": "someResultKey",
          "report": {
            "Quality Control": "OK (Model is performing better than baseline), providing full result"
          }
        }
        `
        });
      }
    });

    jasmine.Ajax.stubRequest(
      "http://example.com/api/v1/download/f3eac45d?format=csv"
    ).andReturn({
      responseText: `SA4_code_2016,Negative Binomial: Lower (10%),Negative Binomial: Upper (90%),Negative Binomial: Average
313,0,1,0
316,0,1,0
`
    });

    jasmine.Ajax.stubRequest(
      "build/TerriaJS/data/regionMapping.json"
    ).andReturn({ responseText: regionMapping });

    terria = new Terria();
    csv = new CsvCatalogItem("test", terria, undefined);

    csv.setTrait(CommonStrata.user, "csvString", lga11Csv);
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
  });

  afterEach(function() {
    jasmine.Ajax.uninstall();
  });

  it("has a type & typeName", function() {
    expect(YDYRCatalogFunction.type).toBe("ydyr");
    expect(ydyr.typeName).toBe("YourDataYourRegions");
  });

  describe("when loading", async function() {
    it("should correctly render functionParameters and set default values", async function() {
      // A few reactions will happen, while setting default values for functionParameters
      await new Promise((resolve, reject) => {
        reaction(
          () => ydyr.functionParameters,
          () => {
            if (ydyr.functionParameters.length === 9) {
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
              expect(ydyr.functionParameters.map(p => p.value)).toEqual([
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
              resolve();
            }
          }
        );
      });
    });
  });

  // Try remove csv then look at parameters

  // Set invalid values for parameters

  // Run

  // Poll/logs

  // Results
});
