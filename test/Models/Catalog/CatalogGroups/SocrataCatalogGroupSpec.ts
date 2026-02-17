import { runInAction } from "mobx";
import { http, HttpResponse } from "msw";
import Terria from "../../../../lib/Models/Terria";
import SocrataCatalogGroup from "../../../../lib/Models/Catalog/CatalogGroups/SocrataCatalogGroup";
import CatalogGroup from "../../../../lib/Models/Catalog/CatalogGroup";
import SocrataMapViewCatalogItem from "../../../../lib/Models/Catalog/CatalogItems/SocrataMapViewCatalogItem";
import { worker } from "../../../mocks/browser";

import facets from "../../../../wwwroot/test/Socrata/facets.json";
import search from "../../../../wwwroot/test/Socrata/search.json";

describe("SocrataCatalogGroup", function () {
  let terria: Terria;
  let socrataGroup: SocrataCatalogGroup;

  beforeEach(function () {
    worker.use(
      http.get(
        "http://example.com/api/catalog/v1/domains/example.com/facets",
        ({ request }) => {
          const url = new URL(request.url);
          if (url.searchParams.get("only") !== "dataset,map")
            throw new Error(`Unexpected query params: ${url.search}`);
          return HttpResponse.json(facets);
        }
      ),
      http.get("http://example.com/api/catalog/v1", ({ request }) => {
        const url = new URL(request.url);
        if (
          url.searchParams.get("search_context") !== "example.com" ||
          url.searchParams.get("only") !== "dataset,map" ||
          url.searchParams.get("categories") !== "Environment"
        )
          throw new Error(`Unexpected query params: ${url.search}`);
        return HttpResponse.json(search);
      })
    );

    terria = new Terria();
    socrataGroup = new SocrataCatalogGroup("test", terria);

    runInAction(() => {
      socrataGroup.setTrait("definition", "url", "http://example.com");
    });
  });

  it("has a type", function () {
    expect(socrataGroup.type).toBe("socrata-group");
  });

  it("loads members", async function () {
    await socrataGroup.loadMembers();
    const facets = socrataGroup.memberModels;
    expect(facets.length).toEqual(2);
    const categories = facets[0] as CatalogGroup;
    expect(categories.memberModels.length).toEqual(7);

    const environment = categories.memberModels[0] as SocrataCatalogGroup;

    await environment.loadMembers();

    expect(environment.memberModels.length).toEqual(48);

    const dataset = environment.memberModels[0] as SocrataMapViewCatalogItem;
    expect(dataset.resourceId).toBe("y79a-us3f");
  });
});
