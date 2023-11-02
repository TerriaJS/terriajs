import i18next from "i18next";
import { configure, runInAction } from "mobx";
import isDefined from "../../../../lib/Core/isDefined";
import CommonStrata from "../../../../lib/Models/Definition/CommonStrata";
import Terria from "../../../../lib/Models/Terria";
import WebProcessingServiceCatalogFunctionJob from "../../../../lib/Models/Catalog/Ows/WebProcessingServiceCatalogFunctionJob";

// For more tests see - test\Models\WebProcessingServiceCatalogFunctionSpec.ts

const regionMapping = JSON.stringify(
  require("../../../../wwwroot/data/regionMapping.json")
);

configure({
  enforceActions: "observed",
  computedRequiresReaction: true
});

describe("WebProcessingServiceCatalogFunctionJob", function () {
  let item: WebProcessingServiceCatalogFunctionJob;

  beforeEach(function () {
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

  afterEach(function () {
    jasmine.Ajax.uninstall();
  });

  it("has a type & typeName", function () {
    expect(WebProcessingServiceCatalogFunctionJob.type).toBe("wps-result");
    expect(item.typeName).toBe(
      i18next.t("models.webProcessingService.wpsResult")
    );
  });

  describe("after loading metadata", function () {
    it("correctly defines `Inputs` in info", async function () {
      await item.loadMetadata();
      const inputSection = item.info.find((info) => info.name == "Inputs");
      expect(inputSection).toBeDefined();
      if (isDefined(inputSection)) {
        expect(inputSection.content).toMatch(/point/);
        expect(inputSection.content).toMatch(/144.97228,-37.77138/);
      }
    });

    it("sets the featureInfoTemplate", async function () {
      await item.loadMetadata();
      expect(item.featureInfoTemplate.template).toBeDefined();
    });

    describe("shortReportSections", function () {
      it("adds a shortReport for LiteralData output", async function () {
        item.setTrait(CommonStrata.user, "wpsResponse", {
          ProcessOutputs: {
            Output: { Title: "Sum", Data: { LiteralData: "4242" } }
          }
        });
        await item.loadMetadata();
        const shortReport = item.shortReportSections.find(
          (r) => r.name === "Sum"
        );
        expect(shortReport).toBeDefined();
        if (isDefined(shortReport)) {
          expect(shortReport.content).toBe("4242");
        }
      });
    });
  });
});

function initTerria() {
  const terria = new Terria({ baseUrl: "./" });

  return terria;
}
