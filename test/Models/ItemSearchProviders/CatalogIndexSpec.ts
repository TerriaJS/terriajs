import CatalogIndexReference from "../../../lib/Models/Catalog/CatalogReferences/CatalogIndexReference";
import CatalogIndex from "../../../lib/Models/SearchProviders/CatalogIndex";
import Terria from "../../../lib/Models/Terria";

describe("CatalogIndex", function () {
  let terria: Terria;
  let catalogIndex: CatalogIndex;

  beforeEach(async function () {
    terria = new Terria({
      baseUrl: "./"
    });

    jasmine.Ajax.install();
    jasmine.Ajax.stubRequest("catalog-index.json").andReturn({
      responseText: JSON.stringify({
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
      })
    });

    await terria.applyInitData({
      initData: {
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
      }
    });

    catalogIndex = new CatalogIndex(terria, "catalog-index.json");
    await catalogIndex.load();
  });

  afterEach(function () {
    jasmine.Ajax.uninstall();
  });

  it("search for items", async function () {
    const results = await catalogIndex.search("group");

    expect(results.length).toBe(2);

    expect((results[0].catalogItem as CatalogIndexReference).name).toBe(
      "Test group"
    );

    expect((results[1].catalogItem as CatalogIndexReference).name).toBe(
      "Test item nested"
    );
  });

  it("search for group", async function () {
    const results = await catalogIndex.search("cool");

    expect((results[0].catalogItem as CatalogIndexReference).name).toBe(
      "Test item"
    );
  });

  it("load group reference", async function () {
    const results = await catalogIndex.search("some random words");

    const group = results[0].catalogItem as CatalogIndexReference;

    await group.loadReference();

    expect(group.target?.type).toBe("group");
  });

  it("load nested reference", async function () {
    const results = await catalogIndex.search("nested");

    const item = results[0].catalogItem as CatalogIndexReference;

    await item.loadReference();

    expect(item.target?.type).toBe("csv");
  });
});

describe("CatalogIndex - with shareKeys", function () {
  let terria: Terria;

  beforeEach(async function () {
    terria = new Terria({
      baseUrl: "./"
    });

    jasmine.Ajax.install();
    jasmine.Ajax.stubRequest("catalog-index.json").andReturn({
      responseText: JSON.stringify({
        "test-dynamic-group": {
          name: "Test dynamic",
          memberKnownContainerUniqueIds: ["/"],
          isGroup: true
        },
        "test-item": {
          name: "Test item",
          description: "This item is cool",
          memberKnownContainerUniqueIds: ["/"],
          isMappable: true
        },
        "test-nested-dynamic-group": {
          name: "Test nested dynamic",
          memberKnownContainerUniqueIds: ["test-dynamic-group"],
          isGroup: true,
          shareKeys: ["test-nested-dynamic-group-sharekey"]
        },
        "test-item-2": {
          name: "Test item 2",
          description: "This item is more cool",
          memberKnownContainerUniqueIds: ["test-dynamic-group"],
          isMappable: true
        },
        "test-item-3": {
          name: "Test item 3",
          description: "This item is too cool",
          memberKnownContainerUniqueIds: ["test-nested-dynamic-group"],
          isMappable: true,
          shareKeys: ["test-item-3-sharekey"]
        },
        "test-nested-dynamic-group/Test item without ID": {
          name: "Test item without ID",
          description: "This item is not cool",
          memberKnownContainerUniqueIds: ["test-nested-dynamic-group"],
          isMappable: true,
          shareKeys: [
            "Test item without ID-sharekey",
            "test-nested-dynamic-group-sharekey/Test item without ID"
          ]
        }
      })
    });

    jasmine.Ajax.stubRequest("some-group.json").andReturn({
      responseText: JSON.stringify({
        catalog: [
          {
            id: "test-nested-dynamic-group",
            name: "Test nested dynamic",
            type: "terria-reference",
            url: "some-nested-group.json",
            shareKeys: ["test-nested-dynamic-group-sharekey"]
          },
          {
            id: "test-item-2",
            name: "Test item 2",
            description: "This item is more cool",
            type: "csv"
          }
        ]
      })
    });

    jasmine.Ajax.stubRequest("some-nested-group.json").andReturn({
      responseText: JSON.stringify({
        catalog: [
          {
            id: "test-item-3",
            name: "Test item 3",
            description: "This item is too cool",
            type: "csv",
            shareKeys: ["test-item-3-sharekey"]
          },
          {
            name: "Test item without ID",
            description: "This item is not cool",
            type: "csv",
            shareKeys: ["Test item without ID-sharekey"]
          }
        ]
      })
    });

    await terria.applyInitData({
      initData: {
        catalog: [
          {
            id: "test-dynamic-group",
            name: "Test dynamic",
            type: "terria-reference",
            url: "some-group.json"
          },
          {
            id: "test-item",
            name: "Test item",
            description: "This item is cool",
            type: "csv"
          }
        ]
      }
    });

    terria.catalogIndex = new CatalogIndex(terria, "catalog-index.json");
    await terria.catalogIndex.load();
  });

  afterEach(function () {
    jasmine.Ajax.uninstall();
  });

  it("loads shareKeys", async function () {
    expect(terria.catalogIndex!.shareKeysMap.toJSON()).toEqual({
      "test-nested-dynamic-group-sharekey": "test-nested-dynamic-group",
      "test-item-3-sharekey": "test-item-3",
      "Test item without ID-sharekey":
        "test-nested-dynamic-group/Test item without ID",
      "test-nested-dynamic-group-sharekey/Test item without ID":
        "test-nested-dynamic-group/Test item without ID"
    });
  });

  it('can use "deep" shareKeys', async function () {
    expect(
      terria.catalogIndex!.getModelByIdOrShareKey("test-item-3")?.uniqueId
    ).toBe("test-item-3");
    expect(
      terria.catalogIndex!.getModelByIdOrShareKey("test-item-3-sharekey")
        ?.uniqueId
    ).toBe("test-item-3");

    (
      await terria
        .catalogIndex!.getModelByIdOrShareKey("test-item-3")
        ?.loadReference()
    )?.logError();

    expect(terria.shareKeysMap.toJSON()).toEqual({
      "test-nested-dynamic-group-sharekey": "test-nested-dynamic-group",
      "test-item-3-sharekey": "test-item-3",
      "Test item without ID-sharekey":
        "test-nested-dynamic-group/Test item without ID",
      "test-nested-dynamic-group-sharekey/Test item without ID":
        "test-nested-dynamic-group/Test item without ID"
    });
  });

  it("another one", async function () {
    const model = terria.catalogIndex!.getModelByIdOrShareKey(
      "test-nested-dynamic-group-sharekey/Test item without ID"
    );
    expect(model?.uniqueId).toBe(
      "test-nested-dynamic-group/Test item without ID"
    );

    if (!model) {
      throw "Model is undefined";
    }

    const result = await model.loadReference();

    expect(result.error).toBeUndefined(
      "Error occurred while loading reference"
    );
  });
});
