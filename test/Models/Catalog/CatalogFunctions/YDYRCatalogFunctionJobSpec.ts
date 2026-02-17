import { configure, reaction } from "mobx";
import { http, HttpResponse } from "msw";
import YDYRCatalogFunctionJob from "../../../../lib/Models/Catalog/CatalogFunctions/YDYRCatalogFunctionJob";
import CsvCatalogItem from "../../../../lib/Models/Catalog/CatalogItems/CsvCatalogItem";
import CommonStrata from "../../../../lib/Models/Definition/CommonStrata";
import Terria from "../../../../lib/Models/Terria";
import { worker } from "../../../mocks/browser";
import "../../../SpecHelpers";

// For more tests see - test\Models\YDYRCatalogFunctionSpec.ts

import regionMapping from "../../../../wwwroot/data/regionMapping.json";
import sa4regionCodes from "../../../../wwwroot/data/regionids/region_map-SA4_2016_AUST_SA4_CODE16.json";
import lga2011RegionCodes from "../../../../wwwroot/data/regionids/region_map-FID_LGA_2011_AUST_LGA_CODE11.json";

configure({
  enforceActions: "observed",
  computedRequiresReaction: true
});

describe("YDYRCatalogFunctionJob", function () {
  let terria: Terria;
  let job: YDYRCatalogFunctionJob;

  beforeEach(function () {
    let logCounter = 0;
    worker.use(
      http.get(
        "http://example.com/api/v1/download/someResultKey",
        ({ request }) => {
          const url = new URL(request.url);
          if (url.searchParams.get("format") !== "csv")
            throw new Error(`Unexpected query params: ${url.search}`);

          return new HttpResponse(`SA4_code_2016,Negative Binomial: Lower (10%),Negative Binomial: Upper (90%),Negative Binomial: Average
313,0,1,0
316,0,1,0
`);
        }
      ),
      http.get("http://example.com/api/v1/status/someStatusId", () => {
        if (logCounter < 1) {
          const msg = `"Some Log ${logCounter}"`;
          logCounter++;
          return new HttpResponse(msg);
        }
        return new HttpResponse(
          `{"key":"someResultKey","report":{"Quality Control":"OK (Model is performing better than baseline), providing full result"}}`
        );
      }),
      http.get("*/build/TerriaJS/data/regionMapping.json", () =>
        HttpResponse.json(regionMapping)
      ),
      http.get(
        "https://tiles.terria.io/region-mapping/regionids/region_map-SA4_2016_AUST_SA4_CODE16.json",
        () => HttpResponse.json(sa4regionCodes)
      ),
      http.get(
        "https://tiles.terria.io/region-mapping/regionids/region_map-FID_LGA_2011_AUST_LGA_CODE11.json",
        () => HttpResponse.json(lga2011RegionCodes)
      )
    );

    terria = new Terria();

    job = new YDYRCatalogFunctionJob("testYdyr", terria);
    job.setTrait(CommonStrata.definition, "parameters", {
      apiUrl: "http://example.com/api/v1/",
      "Negative Binomial": true,
      "Population Weighted": false,
      "Poisson Linear": false,
      "Ridge Regressor": false,
      "Output Geography": "ABS - 2016 Statistical Areas Level 4"
    });
    job.setTrait(CommonStrata.user, "jobStatus", "running");
    job.setTrait(CommonStrata.user, "refreshEnabled", true);
    job.setTrait(CommonStrata.definition, "jobId", "someStatusId");
  });

  it("has a type & typeName", function () {
    expect(YDYRCatalogFunctionJob.type).toBe("ydyr-job");
    expect(job.typeName).toBe("YourDataYourRegions Job");
  });

  describe("start polling after added to workbench", function () {
    let dispose: () => void;
    beforeEach(() => {
      terria.workbench.add(job);
      dispose = reaction(
        () => job.mapItems,
        () => {}
      );
    });
    afterEach(() => {
      dispose();
    });

    it("should be in workbench", function () {
      expect(job.inWorkbench).toBeTruthy();
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
