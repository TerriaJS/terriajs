import { runInAction } from "mobx";
import CatalogGroup from "../../../../lib/Models/Catalog/CatalogGroup";
import OpenDataSoftCatalogGroup from "../../../../lib/Models/Catalog/CatalogGroups/OpenDataSoftCatalogGroup";
import OpenDataSoftCatalogItem from "../../../../lib/Models/Catalog/CatalogItems/OpenDataSoftCatalogItem";
import Terria from "../../../../lib/Models/Terria";
import fetchMock from "fetch-mock";

const facets = JSON.stringify(
  require("../../../../wwwroot/test/ods/facets.json")
);

const datasets = JSON.stringify(
  require("../../../../wwwroot/test/ods/datasets.json")
);

describe("OpenDataSoftCatalogGroup", function() {
  let terria: Terria;
  let odsGroup: OpenDataSoftCatalogGroup;

  beforeEach(function() {
    fetchMock.mock("https://example.com/api/v2/catalog/facets/", {
      body: facets
    });

    fetchMock.mock(
      "https://example.com/api/v2/catalog/datasets/?limit=100&order_by=title+asc&refine=features%3Ageo&where=features+%3D+%22geo%22+OR+features+%3D+%22timeserie%22",
      { body: datasets }
    );

    terria = new Terria();
    odsGroup = new OpenDataSoftCatalogGroup("test", terria);
  });

  afterEach(function() {
    fetchMock.restore();
  });

  it("has a type", function() {
    expect(odsGroup.type).toBe("opendatasoft-group");
  });

  describe("loads facets", function() {
    beforeEach(async function() {
      runInAction(() => {
        odsGroup.setTrait("definition", "url", "https://example.com");
      });
    });

    it("loadsNestedMembers", async function() {
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
});
