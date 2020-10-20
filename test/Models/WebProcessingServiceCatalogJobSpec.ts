import i18next from "i18next";
import { configure, runInAction } from "mobx";
import GeoJsonDataSource from "terriajs-cesium/Source/DataSources/GeoJsonDataSource";
import isDefined from "../../lib/Core/isDefined";
import CommonStrata from "../../lib/Models/CommonStrata";
import CsvCatalogItem from "../../lib/Models/CsvCatalogItem";
import Terria from "../../lib/Models/Terria";
import WebProcessingServiceCatalogFunctionJob from "../../lib/Models/WebProcessingServiceCatalogFunctionJob";

const regionMapping = JSON.stringify(
  require("../../wwwroot/data/regionMapping.json")
);

configure({
  enforceActions: "observed",
  computedRequiresReaction: true
});

const executeResponseXml = require("raw-loader!../../wwwroot/test/WPS/ExecuteResponse.xml");

describe("WebProcessingServiceCatalogFunctionJob", function() {
  let item: WebProcessingServiceCatalogFunctionJob;

  beforeEach(function() {
    const terria = initTerria();
    item = new WebProcessingServiceCatalogFunctionJob("test", terria);
    runInAction(() => {
      item.setTrait(CommonStrata.user, "parameters", {
        name: "point",
        value: "144.97228,-37.77138"
      });
      item.setTrait(CommonStrata.user, "geojsonFeatures", [
        {
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [144.97228, -37.77138]
          },
          properties: {}
        }
      ]);
      item.setTrait(CommonStrata.user, "jobStatus", "finished");
    });
    jasmine.Ajax.install();
    jasmine.Ajax.stubRequest(
      "build/TerriaJS/data/regionMapping.json"
    ).andReturn({ responseText: regionMapping });
  });

  afterEach(function() {
    jasmine.Ajax.uninstall();
  });

  it("has a type & typeName", function() {
    expect(WebProcessingServiceCatalogFunctionJob.type).toBe("wps-result");
    expect(item.typeName).toBe(
      i18next.t("models.webProcessingService.wpsResult")
    );
  });

  it("loads metadata from `wpsResponseUrl` if it is set", async function() {
    jasmine.Ajax.stubRequest("http://example.com/WPS/test").andReturn({
      responseText: executeResponseXml
    });

    runInAction(() => {
      item.setTrait(
        CommonStrata.user,
        "wpsResponseUrl",
        "http://example.com/WPS/test"
      );
    });

    await item.loadMapItems();

    expect(item.results.length).toBe(2);
  });

  describe("after loading metadata", function() {
    it("correctly defines `Inputs` in info", async function() {
      await item.loadMetadata();
      const inputSection = item.info.find(info => info.name == "Inputs");
      expect(inputSection).toBeDefined();
      if (isDefined(inputSection)) {
        expect(inputSection.content).toMatch(/point/);
        expect(inputSection.content).toMatch(/144.97228,-37.77138/);
      }
    });

    it("sets the featureInfoTemplate", async function() {
      await item.loadMetadata();
      expect(item.featureInfoTemplate.template).toBeDefined();
    });

    describe("shortReportSections", function() {
      it("adds a shortReport for LiteralData output", async function() {
        item.setTrait(CommonStrata.user, "wpsResponse", {
          ProcessOutputs: {
            Output: { Title: "Sum", Data: { LiteralData: "4242" } }
          }
        });
        await item.loadMetadata();
        const shortReport = item.shortReportSections.find(
          r => r.name === "Sum"
        );
        expect(shortReport).toBeDefined();
        if (isDefined(shortReport)) {
          expect(shortReport.content).toBe("4242");
        }
      });

      it("adds a shortReport for complex data with mimeType", async function() {
        item.setTrait(CommonStrata.user, "wpsResponse", {
          ProcessOutputs: {
            Output: {
              Title: "Some data",
              Data: {
                ComplexData: {
                  mimeType: "text/csv",
                  text: "abc,def"
                }
              }
            }
          }
        });
        await item.loadMetadata();
        expect(item.shortReportSections[0].content).toMatch(
          /collapsible.*chart/
        );
      });

      describe("when mimeType is terriajs catalog member json", function() {
        beforeEach(function() {
          runInAction(() => {
            item.setTrait(CommonStrata.user, "wpsResponse", {
              ProcessOutputs: {
                Output: {
                  Title: "Geometry Drill",
                  Data: {
                    ComplexData: {
                      mimeType: "application/vnd.terriajs.catalog-member+json",
                      text: JSON.stringify({
                        isEnabled: true,
                        type: "csv",
                        csvString: "abc,def"
                      })
                    }
                  }
                }
              }
            });
          });
        });

        it("adds a new catalog member for the output", async function() {
          const workbenchAdd = spyOn(
            item.terria.workbench,
            "add"
          ).and.callThrough();
          await item.loadMetadata();
          expect(workbenchAdd).toHaveBeenCalledWith(
            jasmine.any(CsvCatalogItem)
          );
        });

        it("adds a short report", async function() {
          await item.loadMetadata();
          expect(item.shortReportSections[0].content).toBe(
            "Chart Geometry Drill generated."
          );
        });
      });
    });
  });

  describe("after loading mapItems", function() {
    it("returns mapItems", async function() {
      jasmine.Ajax.stubRequest("http://example.com/WPS/test").andReturn({
        responseText: executeResponseXml
      });

      runInAction(() => {
        item.setTrait(
          CommonStrata.user,
          "wpsResponseUrl",
          "http://example.com/WPS/test"
        );
      });

      await item.loadMapItems();
      expect(item.mapItems.length).toBe(1);
      expect(item.mapItems[0]).toEqual(jasmine.any(GeoJsonDataSource));
    });

    it("defines a rectangle", async function() {
      await item.loadMapItems();
      expect(item.rectangle).toBeDefined();
    });
  });
});

function initTerria() {
  const terria = new Terria({ baseUrl: "./" });

  return terria;
}
