import CatalogGroup from "../../../lib/Models/Catalog/CatalogGroup";
import GeoJsonCatalogItem from "../../../lib/Models/Catalog/CatalogItems/GeoJsonCatalogItem";
import BaseModel from "../../../lib/Models/Catalog/CatalogItems/GeoJsonCatalogItem";
import Terria from "../../../lib/Models/Terria";
import upsertModelFromJson from "../../../lib/Models/Definition/upsertModelFromJson";
import CatalogMemberFactory from "../../../lib/Models/Catalog/CatalogMemberFactory";
import CommonStrata from "../../../lib/Models/Definition/CommonStrata";
import StubCatalogItem from "../../../lib/Models/Catalog/CatalogItems/StubCatalogItem";
import { getUniqueStubName } from "../../../lib/Models/Catalog/createStubCatalogItem";

describe("CatalogGroup", function() {
  let terria: Terria, json: any, catalogGroup: CatalogGroup;

  beforeEach(function() {
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

  it("re-orders members correctly", function() {
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

  it("throws when moving to non existent indices", function() {
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

  it("loads valid items and ignores broken items", function() {
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
});
