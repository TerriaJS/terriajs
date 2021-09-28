import { JsonObject } from "../../../lib/Core/Json";
import CatalogIndexReference from "../../../lib/Models/Catalog/CatalogReferences/CatalogIndexReference";
import CatalogIndex from "../../../lib/Models/SearchProviders/CatalogIndex";
import Terria from "../../../lib/Models/Terria";

const testIndex = {
  "test-group": {
    name: "Test group",
    description: "Test group description (some random words)",
    memberKnownContainerUniqueIds: ["/"],
    isGroup: true
  },
  "test-item": {
    name: "Test item",
    description: "This item is cool",
    memberKnownContainerUniqueIds: ["/"],
    isMappable: true
  },
  "test-item-nested": {
    name: "Test item nested",
    description: "This item is inside the test group",
    memberKnownContainerUniqueIds: ["test-group"],
    isMappable: true
  }
};

const testInit = {
  catalog: [
    {
      id: "test-group",
      name: "Test group",
      description: "Test group description (some random words)",
      type: "group",
      members: [
        {
          id: "test-item-nested",
          name: "Test item nested",
          description: "This item is inside the test group",
          type: "csv"
        }
      ]
    },
    {
      id: "test-item",
      name: "Test item",
      description: "This item is cool",
      type: "csv"
    }
  ]
};

describe("CatalogIndex", function() {
  let terria: Terria;
  let catalogIndex: CatalogIndex;

  beforeEach(async function() {
    terria = new Terria({
      baseUrl: "./"
    });

    jasmine.Ajax.install();
    jasmine.Ajax.stubRequest("catalog-index.json").andReturn({
      responseText: JSON.stringify(testIndex)
    });

    await terria.applyInitData({ initData: testInit as JsonObject });

    catalogIndex = new CatalogIndex(terria, "catalog-index.json");
    await catalogIndex.loadPromise;
  });

  afterEach(function() {
    jasmine.Ajax.uninstall();
  });

  it("search for items", async function() {
    const results = catalogIndex.search("group");

    console.log(results);

    expect(results.length).toBe(2);

    expect((results[0].catalogItem as CatalogIndexReference).name).toBe(
      "Test group"
    );

    expect((results[1].catalogItem as CatalogIndexReference).name).toBe(
      "Test item nested"
    );
  });

  it("search for group", async function() {
    const results = catalogIndex.search("cool");

    expect((results[0].catalogItem as CatalogIndexReference).name).toBe(
      "Test item"
    );
  });

  it("load group reference", async function() {
    const results = catalogIndex.search("some random words");

    const group = results[0].catalogItem as CatalogIndexReference;

    await group.loadReference();

    expect(group.target?.type).toBe("group");
  });

  it("load nested reference", async function() {
    const results = catalogIndex.search("nested");

    const item = results[0].catalogItem as CatalogIndexReference;

    await item.loadReference();

    expect(item.target?.type).toBe("csv");
  });
});
