import { runInAction } from "mobx";
import { http, HttpResponse } from "msw";
import SocrataMapViewCatalogItem from "../../../../lib/Models/Catalog/CatalogItems/SocrataMapViewCatalogItem";
import Terria from "../../../../lib/Models/Terria";
import { worker } from "../../../mocks/browser";

import view from "../../../../wwwroot/test/Socrata/view.json";

describe("SocrataMapViewCatalogItem", function () {
  let terria: Terria;
  let socrataItem: SocrataMapViewCatalogItem;

  beforeEach(function () {
    worker.use(
      http.get("http://example.com/views/y79a-us3f", () =>
        HttpResponse.json(view)
      )
    );

    terria = new Terria();
    socrataItem = new SocrataMapViewCatalogItem("test", terria);

    runInAction(() => {
      socrataItem.setTrait("definition", "resourceId", "y79a-us3f");
      socrataItem.setTrait("definition", "url", "http://example.com");
    });
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
