import CatalogGroup from "../../lib/Models/CatalogGroupNew";
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
});
