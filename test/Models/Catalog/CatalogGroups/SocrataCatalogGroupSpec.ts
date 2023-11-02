import { runInAction } from "mobx";
import Terria from "../../../../lib/Models/Terria";
import SocrataCatalogGroup from "../../../../lib/Models/Catalog/CatalogGroups/SocrataCatalogGroup";
import CatalogGroup from "../../../../lib/Models/Catalog/CatalogGroup";
import SocrataMapViewCatalogItem from "../../../../lib/Models/Catalog/CatalogItems/SocrataMapViewCatalogItem";

const facets = JSON.stringify(
  require("../../../../wwwroot/test/Socrata/facets.json")
);

const search = JSON.stringify(
  require("../../../../wwwroot/test/Socrata/search.json")
);

describe("SocrataCatalogGroup", function () {
  let terria: Terria;
  let socrataGroup: SocrataCatalogGroup;

  beforeEach(function () {
    jasmine.Ajax.install();
    jasmine.Ajax.stubRequest(
      "http://example.com/api/catalog/v1/domains/example.com/facets?only=dataset%2Cmap"
    ).andReturn({
      responseText: facets
    });

    jasmine.Ajax.stubRequest(
      "http://example.com/api/catalog/v1?search_context=example.com&only=dataset%2Cmap&categories=Environment"
    ).andReturn({ responseText: search });

    terria = new Terria();
    socrataGroup = new SocrataCatalogGroup("test", terria);

    runInAction(() => {
      socrataGroup.setTrait("definition", "url", "http://example.com");
    });
  });

  afterEach(function () {
    jasmine.Ajax.uninstall();
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
