import Terria from "../../lib/Models/Terria";
import CatalogGroup from "../../lib/Models/CatalogGroupNew";
import CatalogMemberFactory from "../../lib/Models/CatalogMemberFactory";
import upsertModelFromJson from "../../lib/Models/upsertModelFromJson";

describe("GroupMixin", function() {
  describe(" - can sort members", function() {
    let terria: Terria;
    let group: CatalogGroup;
    let json: any;

    beforeEach(async function() {
      terria = new Terria();
      CatalogMemberFactory.register(CatalogGroup.type, CatalogGroup);

      json = {
        type: "group",
        id: "mama",
        name: "Test Group",
        members: [
          {
            type: "wms",
            id: "child1",
            name: "foo"
          },
          {
            type: "wms",
            id: "child2",
            name: "baa"
          }
        ]
      };

      group = <CatalogGroup>(
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

    it(" - items are not sorted by default", function() {
      const memberModels: any = group.memberModels;
      console.log(group, memberModels);
      expect(memberModels.length).toBe(2);
      expect(memberModels[0].name).toBe("foo");
      expect(memberModels[1].name).toBe("baa");
    });

    it(" - items can be sorted", function() {
      group.sortMembers("definition", sortByNameInCatalog);
      const memberModels: any = group.memberModels;
      expect(memberModels.length).toBe(2);
      expect(memberModels[0].name).toBe("baa");
      expect(memberModels[1].name).toBe("foo");
    });
  });
});

function sortByNameInCatalog(a: any, b: any) {
  if (a.nameInCatalog === undefined || b.nameInCatalog === undefined) {
    return 0;
  } else if (a.nameInCatalog < b.nameInCatalog) {
    return -1;
  } else if (a.nameInCatalog > b.nameInCatalog) {
    return 1;
  }
  return 0;
}
