import CatalogMemberMixin from "../../../lib/ModelMixins/CatalogMemberMixin";
import CatalogGroup from "../../../lib/Models/Catalog/CatalogGroup";
import GeoJsonCatalogItem from "../../../lib/Models/Catalog/CatalogItems/GeoJsonCatalogItem";
import StubCatalogItem from "../../../lib/Models/Catalog/CatalogItems/StubCatalogItem";
import CatalogMemberFactory from "../../../lib/Models/Catalog/CatalogMemberFactory";
import { getUniqueStubName } from "../../../lib/Models/Catalog/createStubCatalogItem";
import WebMapServiceCatalogItem from "../../../lib/Models/Catalog/Ows/WebMapServiceCatalogItem";
import CommonStrata from "../../../lib/Models/Definition/CommonStrata";
import upsertModelFromJson from "../../../lib/Models/Definition/upsertModelFromJson";
import Terria from "../../../lib/Models/Terria";
import SplitItemReference from "../../../lib/Models/Catalog/CatalogReferences/SplitItemReference";
import createGuid from "terriajs-cesium/Source/Core/createGuid";
import { runInAction } from "mobx";

describe("CatalogGroup", function () {
  let terria: Terria, json: any, catalogGroup: CatalogGroup;

  beforeEach(function () {
    terria = new Terria();
    json = {
      type: "group",
      id: "mama",
      name: "Test Group",
      members: [
        {
          type: "group",
          id: "child1"
        },
        {
          type: "group",
          id: "child2"
        },
        {
          type: "group",
          id: "child3"
        }
      ]
    };
    catalogGroup = <CatalogGroup>(
      upsertModelFromJson(
        CatalogMemberFactory,
        terria,
        "",
        "definition",
        json,
        {}
      ).throwIfUndefined()
    );
  });

  it("re-orders members correctly", function () {
    expect(catalogGroup instanceof CatalogGroup).toBe(true);

    const item = <CatalogGroup>terria.getModelById(CatalogGroup, "mama");
    const child1 = <CatalogGroup>terria.getModelById(CatalogGroup, "child1");
    const child2 = <CatalogGroup>terria.getModelById(CatalogGroup, "child2");
    expect(item).toBeDefined();
    expect(item.type).toBe("group");
    expect(item.members).toEqual(["child1", "child2", "child3"]);

    item.moveMemberToIndex(CommonStrata.definition, child1, 1);
    expect(item.members).toEqual(["child2", "child1", "child3"]);

    item.moveMemberToIndex(CommonStrata.definition, child1, 2);
    expect(item.members).toEqual(["child2", "child3", "child1"]);

    item.moveMemberToIndex(CommonStrata.definition, child2, 2);
    expect(item.members).toEqual(["child3", "child1", "child2"]);

    item.moveMemberToIndex(CommonStrata.definition, child1, 0);
    expect(item.members).toEqual(["child1", "child3", "child2"]);
  });

  it("throws when moving to non existent indices", function () {
    expect(catalogGroup instanceof CatalogGroup).toBe(true);

    const item = <CatalogGroup>terria.getModelById(CatalogGroup, "mama");
    const child1 = <CatalogGroup>terria.getModelById(CatalogGroup, "child1");
    const child2 = <CatalogGroup>terria.getModelById(CatalogGroup, "child2");
    expect(item).toBeDefined();
    expect(item.type).toBe("group");
    expect(item.members).toEqual(["child1", "child2", "child3"]);

    expect(() => {
      item.moveMemberToIndex(CommonStrata.definition, child1, -2);
    }).toThrowError("Invalid 'newIndex' target: -2");
    expect(() => {
      item.moveMemberToIndex(CommonStrata.definition, child1, 3);
    }).toThrowError("Invalid 'newIndex' target: 3");
  });

  it("loads valid items and ignores broken items", function () {
    const groupWithBrokenItem = [
      {
        type: "geojson",
        name: "Invalid GeoJSON item",
        url: null
      },
      {
        type: "geojson",
        name: "Valid GeoJSON item",
        url: "test/bike_racks.geojson"
      },
      {
        type: "unknown",
        name: "Invalid type"
      },
      {
        name: "Just a name with no type"
      },
      // Empty nothingness
      {}
    ];
    const group = new CatalogGroup("brokenGroup", terria);
    group.addMembersFromJson("definition", groupWithBrokenItem);
    expect(group.members.length).toBe(5);
    const member0 = terria.getModelById(
      GeoJsonCatalogItem,
      group.members[0] as string
    );
    const member1 = terria.getModelById(
      GeoJsonCatalogItem,
      group.members[1] as string
    );
    const invalidType = terria.getModelById(
      StubCatalogItem,
      group.members[2] as string
    );
    const noType = terria.getModelById(
      StubCatalogItem,
      group.members[3] as string
    );
    const nothingness = terria.getModelById(
      StubCatalogItem,
      group.members[4] as string
    );

    expect(member0).toBeDefined();
    expect(member1).toBeDefined();
    expect(invalidType).toBeDefined();
    expect(noType).toBeDefined();
    expect(nothingness).toBeDefined();
    const stubName = getUniqueStubName(terria);
    if (
      member0 !== undefined &&
      member1 !== undefined &&
      invalidType !== undefined &&
      noType !== undefined &&
      nothingness !== undefined
    ) {
      expect(member0.uniqueId).toBe("brokenGroup/Invalid GeoJSON item");
      expect(member0.isExperiencingIssues).toBe(true);

      expect(member1.uniqueId).toBe("brokenGroup/Valid GeoJSON item");
      expect(member1.isExperiencingIssues).toBe(false);

      expect(invalidType.type).toBe(StubCatalogItem.type);
      expect(invalidType.name).toBe("brokenGroup/Invalid type (Stub)");
      expect(invalidType.isExperiencingIssues).toBe(true);

      expect(noType.type).toBe(StubCatalogItem.type);
      expect(noType.name).toBe("brokenGroup/Just a name with no type (Stub)");
      expect(noType.isExperiencingIssues).toBe(true);

      expect(nothingness.type).toBe(StubCatalogItem.type);
      expect(nothingness.name).toBe("[StubCatalogItem]");
      expect(nothingness.isExperiencingIssues).toBe(true);
    } else {
      throw "bad";
    }
  });

  it("removes excluded items/groups from memberModels", function () {
    json = {
      type: "group",
      id: "grandmama",
      name: "Test Group",
      excludeMembers: ["grandchild1", "parent3"]
    };
    upsertModelFromJson(
      CatalogMemberFactory,
      terria,
      "",
      "definition",
      json,
      {}
    ).throwIfUndefined();

    const item = <CatalogGroup>terria.getModelById(CatalogGroup, "grandmama");

    item.addMembersFromJson(CommonStrata.definition, [
      {
        type: "group",
        id: "parent1",
        excludeMembers: ["grandchild4"],
        members: [
          {
            type: "group",
            id: "grandchild1"
          },
          {
            type: "group",
            id: "grandchild2"
          },
          {
            type: "group",
            id: "grandchild3"
          },
          {
            type: "group",
            id: "grandchild4"
          }
        ]
      },
      {
        type: "group",
        id: "parent2"
      },
      {
        type: "group",
        id: "parent3"
      }
    ]);

    expect(item.excludeMembers).toEqual(["grandchild1", "parent3"]);
    expect(item.mergedExcludeMembers).toEqual(["grandchild1", "parent3"]);

    const parent1 = <CatalogGroup>terria.getModelById(CatalogGroup, "parent1");
    expect(item).toBeDefined();
    expect(item.type).toBe("group");
    expect(item.memberModels.map((member) => member.uniqueId)).toEqual([
      "parent1",
      "parent2"
    ]);

    expect(parent1).toBeDefined();
    expect(parent1.type).toBe("group");
    expect(parent1.memberModels.map((member) => member.uniqueId)).toEqual([
      "grandchild2",
      "grandchild3"
    ]);

    expect(parent1.excludeMembers).toEqual(["grandchild4"]);
    expect(parent1.mergedExcludeMembers).toEqual([
      "grandchild4",
      "grandchild1",
      "parent3"
    ]);
  });

  it("sortMembersBy", function () {
    const item = new CatalogGroup("what", terria);

    item.addMembersFromJson(CommonStrata.definition, [
      {
        type: "group",
        name: "1",
        description: "f"
      },
      {
        type: "group",
        name: "aCC"
      },
      {
        type: "group",
        name: "10",
        description: "d"
      },
      {
        type: "group",
        name: "2",
        description: "c"
      },
      {
        type: "group",
        name: "AC",
        description: "a"
      },

      {
        type: "group",
        name: "ab",
        description: "b"
      },
      { type: "terria-reference", name: "A reference" }
    ]);

    expect(item.memberModels.map((member) => (member as any).name)).toEqual([
      "1",
      "aCC",
      "10",
      "2",
      "AC",
      "ab",
      "A reference"
    ]);

    item.setTrait(CommonStrata.user, "sortMembersBy", "name");

    expect(item.memberModels.map((member) => (member as any).name)).toEqual([
      "1",
      "2",
      "10",
      "A reference",
      "ab",
      "AC",
      "aCC"
    ]);

    item.setTrait(CommonStrata.user, "sortMembersBy", "description");

    expect(item.memberModels.map((member) => (member as any).name)).toEqual([
      "AC",
      "ab",
      "2",
      "10",
      "1",
      "aCC",
      "A reference"
    ]);
  });

  describe("itemProperties, itemPropertiesByType and itemPropertiesByIds", () => {
    beforeEach(() => {
      json = {
        type: "group",
        id: "grandmama",
        name: "Test Group",
        itemProperties: { name: "some other name" },
        itemPropertiesByType: [
          { type: "wms", itemProperties: { name: "some WMS name" } },
          {
            type: "geojson",
            itemProperties: { url: "some geojson url (by type)" }
          }
        ],
        itemPropertiesByIds: [
          { ids: ["wms-1"], itemProperties: { url: "some WMS url" } },
          {
            ids: ["geojson-1"],
            itemProperties: { url: "some geojson url (by ID)" }
          }
        ],
        members: [
          {
            type: "group",
            id: "parent1",
            name: "Parent 1",
            members: [
              { type: "wms", id: "wms-1", name: "wms definition name" },
              {
                type: "geojson",
                id: "geojson-1",
                name: "geojson definition name"
              }
            ]
          }
        ]
      };
      upsertModelFromJson(
        CatalogMemberFactory,
        terria,
        "",
        "definition",
        json,
        {}
      ).throwIfUndefined();
    });

    it("correctly applies traits", async function () {
      const item = <CatalogGroup>terria.getModelById(CatalogGroup, "grandmama");

      await item.loadMembers();

      const parent1 = <CatalogGroup>(
        terria.getModelById(CatalogGroup, "parent1")
      );

      expect(parent1).toBeDefined();
      expect(parent1.itemProperties).toEqual({ name: "some other name" });
      expect(parent1.name).toBe("Parent 1");

      await parent1.loadMembers();

      const geojsonItem = <GeoJsonCatalogItem>(
        terria.getModelById(GeoJsonCatalogItem, "geojson-1")
      );

      expect(geojsonItem.name).toBe("some other name");
      expect(geojsonItem.url).toBe("some geojson url (by ID)");

      const wmsItem = <WebMapServiceCatalogItem>(
        terria.getModelById(WebMapServiceCatalogItem, "wms-1")
      );

      expect(wmsItem.name).toBe("some WMS name");
      expect(wmsItem.url).toBe("some WMS url");
    });

    it("supports splitting items with itemProperties", async function () {
      const item = <CatalogGroup>terria.getModelById(CatalogGroup, "grandmama");

      await item.loadMembers();

      const parent1 = <CatalogGroup>(
        terria.getModelById(CatalogGroup, "parent1")
      );

      await parent1.loadMembers();

      const geojsonItem = <GeoJsonCatalogItem>(
        terria.getModelById(GeoJsonCatalogItem, "geojson-1")
      );

      const splitRef = new SplitItemReference(createGuid(), terria);
      terria.addModel(splitRef);
      runInAction(() => {
        splitRef.setTrait(
          CommonStrata.user,
          "splitSourceItemId",
          geojsonItem.uniqueId
        );
      });
      await splitRef.loadReference();
      expect(splitRef.target instanceof GeoJsonCatalogItem).toBe(true);
    });
  });

  describe("mergeGroupsByName", () => {
    beforeEach(() => {
      json = {
        type: "group",
        id: "root",
        name: "Test Group",
        members: [
          {
            type: "group",
            id: "group-1",
            name: "Group with the same name",
            members: [
              // Note these two items **won't** be merged when `mergeGroupsByName = true` - as it only applies to top level
              { type: "wms", id: "wms-1", name: "wms with the same name" },
              { type: "wms", id: "wms-2", name: "wms with the same name" },
              {
                type: "geojson",
                id: "geojson-1",
                name: "geojson 1"
              }
            ]
          },
          {
            type: "group",
            id: "group-2",
            name: "Group with the same name",
            members: [
              { type: "wms", id: "wms-3", name: "wms 3" },
              {
                type: "geojson",
                id: "geojson-2",
                name: "geojson 2"
              }
            ]
          }
        ]
      };
      upsertModelFromJson(
        CatalogMemberFactory,
        terria,
        "",
        "definition",
        json,
        { replaceStratum: true }
      ).throwIfUndefined();
    });

    it("set to false", async function () {
      const item = <CatalogGroup>terria.getModelById(CatalogGroup, "root");
      item.setTrait(CommonStrata.definition, "mergeGroupsByName", false);
      (await item.loadMembers()).throwIfError();
      expect(item.memberModels.length).toBe(2);

      const parent1 = item.memberModels[0] as CatalogGroup;
      (await parent1.loadMembers()).throwIfError();
      expect(parent1.memberModels.length).toBe(3);

      const parent1Copy = item.memberModels[1] as CatalogGroup;
      (await parent1Copy.loadMembers()).throwIfError();
      expect(parent1Copy.memberModels.length).toBe(2);

      expect(parent1.name).toBe(parent1Copy.name);
    });

    it("set to true", async function () {
      const item = <CatalogGroup>terria.getModelById(CatalogGroup, "root");
      item.setTrait(CommonStrata.definition, "mergeGroupsByName", true);
      (await item.loadMembers()).throwIfError();
      expect(item.memberModels.length).toBe(1);

      const mergedGroup = item.memberModels[0] as CatalogGroup;
      (await mergedGroup.loadMembers()).throwIfError();
      expect(mergedGroup.memberModels.length).toBe(5);
    });
  });
});
