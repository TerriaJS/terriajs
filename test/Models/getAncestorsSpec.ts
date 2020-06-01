import getAncestors from "../../lib/Models/getAncestors";
import Terria from "../../lib/Models/Terria";
import WebMapServiceCatalogItem from "../../lib/Models/WebMapServiceCatalogItem";
import CatalogGroup from "../../lib/Models/CatalogGroupNew";

describe("getAncestors", function() {
  let terria: Terria,
    wms: WebMapServiceCatalogItem,
    groupLevelOne: CatalogGroup,
    groupLevelTwo: CatalogGroup,
    groupLevelThree: CatalogGroup;

  beforeEach(function() {
    terria = new Terria({ baseUrl: "./" });
    wms = new WebMapServiceCatalogItem("id", terria);
    groupLevelOne = new CatalogGroup("groupLevelOneId", terria);
    groupLevelTwo = new CatalogGroup("groupLevelTwoId", terria);
    groupLevelThree = new CatalogGroup("groupLevelThreeId", terria);
    terria.catalog.group.add("definition", groupLevelOne);
    groupLevelOne.add("definition", groupLevelTwo);
    groupLevelTwo.add("definition", groupLevelThree);
    terria.addModel(wms);
    terria.addModel(groupLevelOne);
    terria.addModel(groupLevelTwo);
    terria.addModel(groupLevelThree);
  });
  describe("getCatalogMembersToSave", () => {
    it("returns ancestors from top down with groups and wms", function() {
      groupLevelThree.add("definition", wms);
      const ancestors = getAncestors(wms);
      expect(ancestors.length).toEqual(3);
      expect(ancestors[0]).toEqual(groupLevelOne);
      expect(ancestors[1]).toEqual(groupLevelTwo);
      expect(ancestors[2]).toEqual(groupLevelThree);
    });
    it("returns ancestors from top down with groups", function() {
      const ancestors = getAncestors(groupLevelThree);
      expect(ancestors.length).toEqual(2);
      expect(ancestors[0]).toEqual(groupLevelOne);
      expect(ancestors[1]).toEqual(groupLevelTwo);
    });
    it("returns no root group", function() {
      const ancestors = getAncestors(groupLevelOne);
      expect(ancestors.length).toEqual(0);
    });
  });
});
