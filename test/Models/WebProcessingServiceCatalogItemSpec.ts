import { runInAction } from "mobx";
import isDefined from "../../lib/Core/isDefined";
import CatalogMemberFactory from "../../lib/Models/CatalogMemberFactory";
import CommonStrata from "../../lib/Models/CommonStrata";
import CsvCatalogItem from "../../lib/Models/CsvCatalogItem";
import GeoJsonCatalogItem from "../../lib/Models/GeoJsonCatalogItem";
import Terria from "../../lib/Models/Terria";
import WebProcessingServiceCatalogItem from "../../lib/Models/WebProcessingServiceCatalogItem";
import GeoJsonDataSource from "terriajs-cesium/Source/DataSources/GeoJsonDataSource";

describe("WebProcessingServiceCatalogItem", function() {
  let item: WebProcessingServiceCatalogItem;

  beforeEach(function() {
    const terria = initTerria();
    terria.configParameters.regionMappingDefinitionsUrl =
      "/data/regionMapping.json";
    item = new WebProcessingServiceCatalogItem("test", terria);
    runInAction(() => {
      const param1 = item.addObject(CommonStrata.user, "parameters", "param1");
      if (isDefined(param1)) {
        param1.setTrait(CommonStrata.user, "name", "point");
        param1.setTrait(CommonStrata.user, "value", "144.97228,-37.77138");
        param1.setTrait(CommonStrata.user, "geoJsonFeature", {
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [144.97228, -37.77138, null]
          }
        });
      }
    });
  });

  it("has a type & typeName", function() {
    expect(WebProcessingServiceCatalogItem.type).toBe("wps-result");
    expect(item.typeName).toBe("Web Processing Service Result");
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
  CatalogMemberFactory.register(CsvCatalogItem.type, <any>CsvCatalogItem);
  CatalogMemberFactory.register(GeoJsonCatalogItem.type, <any>(
    GeoJsonCatalogItem
  ));
  const terria = new Terria();
  terria.configParameters.regionMappingDefinitionsUrl =
    "/data/regionMapping.json";
  return terria;
}
