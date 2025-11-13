import { runInAction } from "mobx";
import CatalogGroup from "../../../../lib/Models/Catalog/CatalogGroup";
import OpenDataSoftCatalogGroup from "../../../../lib/Models/Catalog/CatalogGroups/OpenDataSoftCatalogGroup";
import OpenDataSoftCatalogItem from "../../../../lib/Models/Catalog/CatalogItems/OpenDataSoftCatalogItem";
import Terria from "../../../../lib/Models/Terria";
import fetchMock from "fetch-mock";

import facets from "../../../../wwwroot/test/ods/facets.json";
import datasets from "../../../../wwwroot/test/ods/datasets.json";
import datasetsCount101Response1 from "../../../../wwwroot/test/ods/datasets-over-100-1.json";
import datasetsCount101Response2 from "../../../../wwwroot/test/ods/datasets-over-100-2.json";

describe("OpenDataSoftCatalogGroup", function () {
  let terria: Terria;
  let odsGroup: OpenDataSoftCatalogGroup;

  beforeEach(function () {
    fetchMock.mock("https://example.com/api/v2/catalog/facets/", {
      body: JSON.stringify(facets)
    });

    terria = new Terria();
    odsGroup = new OpenDataSoftCatalogGroup("test", terria);
  });

  afterEach(function () {
    fetchMock.restore();
  });

  it("has a type", function () {
    expect(odsGroup.type).toBe("opendatasoft-group");
  });

  describe("loads facets", function () {
    beforeEach(function () {
      fetchMock.mock(
        "https://example.com/api/v2/catalog/datasets/?limit=100&offset=0&order_by=title+asc&refine=features%3Ageo&where=features+%3D+%22geo%22+OR+features+%3D+%22timeserie%22",
        { body: JSON.stringify(datasets) }
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
      // Note these two responses don't actually return over 100 datasest
      // Both JSON files have "total_count": 101 - and 6 different datasets each
      // So we expect total 12 datasets

      // Offset = 0
      fetchMock.mock(
        "https://example.com/api/v2/catalog/datasets/?limit=100&offset=0&order_by=title+asc&refine=features%3Ageo&where=features+%3D+%22geo%22+OR+features+%3D+%22timeserie%22",
        { body: JSON.stringify(datasetsCount101Response1) }
      );

      // Offset = 100
      fetchMock.mock(
        "https://example.com/api/v2/catalog/datasets/?limit=100&offset=100&order_by=title+asc&refine=features%3Ageo&where=features+%3D+%22geo%22+OR+features+%3D+%22timeserie%22",
        { body: JSON.stringify(datasetsCount101Response2) }
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
