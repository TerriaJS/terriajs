import { configure, runInAction } from "mobx";
import _loadWithXhr from "../../lib/Core/loadWithXhr";
import Terria from "../../lib/Models/Terria";
import CkanCatalogGroup, {
  CkanServerStratum
} from "../../lib/Models/CkanCatalogGroup";
import CommonStrata from "../../lib/Models/CommonStrata";
import i18next from "i18next";
import CkanItemReference from "../../lib/Models/CkanItemReference";
import CatalogGroup from "../../lib/Models/CatalogGroupNew";
import WebMapServiceCatalogItem from "../../lib/Models/WebMapServiceCatalogItem";
import { BaseModel } from "../../lib/Models/Model";

configure({
  enforceActions: "observed",
  computedRequiresReaction: true
});

interface ExtendedLoadWithXhr {
  (): any;
  load: { (...args: any[]): any; calls: any };
}

const loadWithXhr: ExtendedLoadWithXhr = <any>_loadWithXhr;

describe("CkanCatalogGroup", function() {
  const ckanServerUrl = "http://data.gov.au";
  let terria: Terria;
  let ckanCatalogGroup: CkanCatalogGroup;
  let ckanServerStratum: CkanServerStratum;

  beforeEach(async function() {
    terria = new Terria({
      baseUrl: "./"
    });
    ckanCatalogGroup = new CkanCatalogGroup("test", terria);

    const realLoadWithXhr = loadWithXhr.load;
    // We replace calls to real servers with pre-captured JSON files so our testing is isolated, but reflects real data.
    spyOn(loadWithXhr, "load").and.callFake(function(...args: any[]) {
      args[0] = "test/CKAN/search-result.json";

      return realLoadWithXhr(...args);
    });
  });

  it("has a type and typeName", function() {
    expect(ckanCatalogGroup.type).toBe("ckan");
    expect(ckanCatalogGroup.typeName).toBe("CKAN Server");
  });

  describe("after loading metadata - default settings - ", function() {
    beforeEach(async function() {
      runInAction(() => {
        ckanCatalogGroup.setTrait(
          "definition",
          "url",
          "test/CKAN/search-result.json"
        );
      });
      await ckanCatalogGroup.loadMembers();
      ckanServerStratum = <CkanServerStratum>(
        ckanCatalogGroup.strata.get(CkanServerStratum.stratumName)
      );
    });

    it("properly creates members", function() {
      expect(ckanCatalogGroup.members).toBeDefined();
      expect(ckanCatalogGroup.members.length).toBe(2);
      let member0 = <CatalogGroup>ckanCatalogGroup.memberModels[0];
      let member1 = <CatalogGroup>ckanCatalogGroup.memberModels[1];
      expect(member0.name).toBe("Department of the Environment and Energy");
      expect(member1.name).toBe("Murray-Darling Basin Authority");
    });

    it("properly creates groups", function() {
      if (ckanServerStratum !== undefined) {
        if (ckanServerStratum.groups) {
          // 3 groups because we add an Ungrouped Group
          expect(ckanServerStratum.groups.length).toBe(3);

          // 3 groups are sorted by name
          let group0 = <CatalogGroup>ckanServerStratum.groups[0];
          expect(group0.name).toBe("Department of the Environment and Energy");
          // There is only 1 resource on the 1 dataset
          expect(group0.members.length).toBe(1);

          let group1 = <CatalogGroup>ckanServerStratum.groups[1];
          expect(group1.name).toBe("Murray-Darling Basin Authority");
          // There are 2 resources on the 2 datasets
          expect(group1.members.length).toBe(6);

          let group2 = <CatalogGroup>ckanServerStratum.groups[2];
          expect(group2.name).toBe(ckanCatalogGroup.ungroupedTitle);
          expect(group2.name).toBe("No group");
          expect(group2.members.length).toBe(0);
        }
      }
    });
  });

  describe("after loading metadata - change some settings - ", function() {
    beforeEach(async function() {
      runInAction(() => {
        ckanCatalogGroup.setTrait(
          "definition",
          "url",
          "test/CKAN/search-result.json"
        );
        ckanCatalogGroup.setTrait("definition", "groupBy", "group");
        ckanCatalogGroup.setTrait("definition", "ungroupedTitle", "Blah");
        ckanCatalogGroup.setTrait("definition", "blacklist", ["Geography"]);
        ckanCatalogGroup.setTrait("definition", "itemProperties", {
          layers: "abc"
        });
      });
      await ckanCatalogGroup.loadMembers();
      ckanServerStratum = <CkanServerStratum>(
        ckanCatalogGroup.strata.get(CkanServerStratum.stratumName)
      );
    });

    it("properly creates members", function() {
      expect(ckanCatalogGroup.members).toBeDefined();
      expect(ckanCatalogGroup.members.length).toBe(3);
      let member0 = <CatalogGroup>ckanCatalogGroup.memberModels[0];
      expect(member0.name).toBe("Blah");
      let member1 = <CatalogGroup>ckanCatalogGroup.memberModels[1];
      expect(member1.name).toBe("Environment");
      let member2 = <CatalogGroup>ckanCatalogGroup.memberModels[2];
      expect(member2.name).toBe("Science");
    });

    it("Geography group has been filtered from the groups", function() {
      if (ckanServerStratum.groups && ckanServerStratum.filteredGroups) {
        expect(ckanServerStratum.groups.length).toBe(4);
        expect(ckanServerStratum.filteredGroups.length).toBe(3);
      }
    });

    // it("itemProperties get added", async function(done) {
    //   const m = terria.getModelById(CkanItemReference, ckanCatalogGroup.uniqueId + '/66e3efa7-fb5c-4bd7-9478-74adb6277955/1dae2cfe-345b-4320-bf0c-4da0de061dc5')
    //   if (m) {
    //     await m.loadReference()
    //     const target = m.target as WebMapServiceCatalogItem
    //     if (target) {
    //       expect(target.layers).toBe('abc')
    //     }
    //   }
    //   done()
    // });
  });
});
