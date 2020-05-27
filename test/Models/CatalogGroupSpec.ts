import CatalogGroup from "../../lib/Models/CatalogGroupNew";
import GeoJsonCatalogItem from "../../lib/Models/GeoJsonCatalogItem";
import BaseModel from "../../lib/Models/GeoJsonCatalogItem";
import Terria from "../../lib/Models/Terria";
import upsertModelFromJson from "../../lib/Models/upsertModelFromJson";
import CatalogMemberFactory from "../../lib/Models/CatalogMemberFactory";
import CommonStrata from "../../lib/Models/CommonStrata";

describe("CatalogGroup", function() {
  let terria: Terria, json: any, catalogGroup: CatalogGroup;

  beforeEach(function() {
    CatalogMemberFactory.register(CatalogGroup.type, CatalogGroup);
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
        undefined,
        "definition",
        json
      )
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
    CatalogMemberFactory.register(GeoJsonCatalogItem.type, GeoJsonCatalogItem);
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
      }
    ];
    const group = new CatalogGroup("brokenGroup", terria);
    group.addMembersFromJson("definition", groupWithBrokenItem);
    expect(group.members.length).toBe(2);
    let member0 = terria.getModelById(
      GeoJsonCatalogItem,
      group.members[0] as string
    );
    let member1 = terria.getModelById(
      GeoJsonCatalogItem,
      group.members[1] as string
    );
    expect(member0).toBeDefined();
    expect(member1).toBeDefined();
    if (member0 !== undefined && member1 !== undefined) {
      expect(member0.uniqueId).toBe("brokenGroup/Invalid GeoJSON item");
      expect(member0.isExperiencingIssues).toBe(true);
      expect(member1.uniqueId).toBe("brokenGroup/Valid GeoJSON item");
      expect(member1.isExperiencingIssues).toBe(false);
    }
  });
});
