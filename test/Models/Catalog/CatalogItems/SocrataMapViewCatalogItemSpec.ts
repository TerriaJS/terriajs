import { runInAction } from "mobx";
import SocrataMapViewCatalogItem from "../../../../lib/Models/Catalog/CatalogItems/SocrataMapViewCatalogItem";
import Terria from "../../../../lib/Models/Terria";

const view = JSON.stringify(
  require("../../../../wwwroot/test/Socrata/view.json")
);

describe("SocrataMapViewCatalogItem", function () {
  let terria: Terria;
  let socrataItem: SocrataMapViewCatalogItem;

  beforeEach(function () {
    jasmine.Ajax.install();
    jasmine.Ajax.stubRequest("http://example.com/views/y79a-us3f").andReturn({
      responseText: view
    });

    terria = new Terria();
    socrataItem = new SocrataMapViewCatalogItem("test", terria);

    runInAction(() => {
      socrataItem.setTrait("definition", "resourceId", "y79a-us3f");
      socrataItem.setTrait("definition", "url", "http://example.com");
    });
  });

  afterEach(function () {
    jasmine.Ajax.uninstall();
  });

  it("has a type", function () {
    expect(socrataItem.type).toBe("socrata-map-item");
  });

  it("loads view metadata", async function () {
    await socrataItem.loadMetadata();

    expect(socrataItem.geojsonUrl).toBe(
      "http://example.com/resource/7emh-y3dj.geojson?$limit=10000"
    );
  });
});
