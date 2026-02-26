import { runInAction } from "mobx";
import { http, HttpResponse } from "msw";
import CatalogGroup from "../../../../lib/Models/Catalog/CatalogGroup";
import OpenDataSoftCatalogGroup from "../../../../lib/Models/Catalog/CatalogGroups/OpenDataSoftCatalogGroup";
import OpenDataSoftCatalogItem from "../../../../lib/Models/Catalog/CatalogItems/OpenDataSoftCatalogItem";
import Terria from "../../../../lib/Models/Terria";
import { worker } from "../../../mocks/browser";

import facets from "../../../../wwwroot/test/ods/facets.json";
import datasets from "../../../../wwwroot/test/ods/datasets.json";
import datasetsCount101Response1 from "../../../../wwwroot/test/ods/datasets-over-100-1.json";
import datasetsCount101Response2 from "../../../../wwwroot/test/ods/datasets-over-100-2.json";

describe("OpenDataSoftCatalogGroup", function () {
  let terria: Terria;
  let odsGroup: OpenDataSoftCatalogGroup;

  beforeEach(function () {
    worker.use(
      http.get("https://example.com/api/v2/catalog/facets/", () =>
        HttpResponse.json(facets)
      )
    );

    terria = new Terria();
    odsGroup = new OpenDataSoftCatalogGroup("test", terria);
  });

  it("has a type", function () {
    expect(odsGroup.type).toBe("opendatasoft-group");
  });

  describe("loads facets", function () {
    beforeEach(function () {
      worker.use(
        http.get("https://example.com/api/v2/catalog/datasets/", () =>
          HttpResponse.json(datasets)
        )
      );
      runInAction(() => {
        odsGroup.setTrait("definition", "url", "https://example.com");
      });
    });

    it("loadsNestedMembers", async function () {
      await odsGroup.loadMembers();
      const facets = odsGroup.memberModels;
      expect(facets.length).toEqual(6);
      const featureFacet = facets[1] as OpenDataSoftCatalogGroup;
      await featureFacet.loadMembers();
      expect(featureFacet.memberModels.length).toEqual(4);
      const geoFeatureFacet = featureFacet.memberModels[1] as CatalogGroup;
      await geoFeatureFacet.loadMembers();
      expect(geoFeatureFacet.memberModels.length).toEqual(6);

      const environmentalSensors = geoFeatureFacet
        .memberModels[1] as OpenDataSoftCatalogItem;

      expect(environmentalSensors.type).toBe("opendatasoft-item");
      expect(environmentalSensors.name).toBe("Environmental sensors");
      expect(environmentalSensors.description?.length).toBe(244);
      expect(environmentalSensors.datasetId).toBe("weather-stations");
    });
  });

  describe("loads over 100 datasets (in multiple requests)", function () {
    beforeEach(function () {
      // Note these two responses don't actually return over 100 datasets
      // Both JSON files have "total_count": 101 - and 6 different datasets each
      // So we expect total 12 datasets
      worker.use(
        http.get(
          "https://example.com/api/v2/catalog/datasets/",
          ({ request }) => {
            const url = new URL(request.url);

            if (
              url.searchParams.get("limit") !== "100" ||
              url.searchParams.get("order_by") !== "title asc" ||
              url.searchParams.get("refine") !== "features:geo" ||
              url.searchParams.get("where") !==
                'features = "geo" OR features = "timeserie"'
            ) {
              return HttpResponse.error();
            }
            const offset = url.searchParams.get("offset");

            if (offset === "100")
              return HttpResponse.json(datasetsCount101Response2);
            return HttpResponse.json(datasetsCount101Response1);
          }
        )
      );
      runInAction(() => {
        odsGroup.setTrait("definition", "url", "https://example.com");
      });
    });

    it("loadsNestedMembers", async function () {
      await odsGroup.loadMembers();
      const facets = odsGroup.memberModels;
      expect(facets.length).toEqual(6);
      const featureFacet = facets[1] as OpenDataSoftCatalogGroup;
      await featureFacet.loadMembers();
      expect(featureFacet.memberModels.length).toEqual(4);
      const geoFeatureFacet = featureFacet.memberModels[1] as CatalogGroup;
      await geoFeatureFacet.loadMembers();
      expect(geoFeatureFacet.memberModels.length).toEqual(12);

      const environmentalSensors = geoFeatureFacet
        .memberModels[1] as OpenDataSoftCatalogItem;

      expect(environmentalSensors.type).toBe("opendatasoft-item");
      expect(environmentalSensors.name).toBe("Environmental sensors");
      expect(environmentalSensors.description?.length).toBe(244);
      expect(environmentalSensors.datasetId).toBe("weather-stations-2");
    });
  });
});
