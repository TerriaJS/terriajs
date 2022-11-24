import { configure, runInAction } from "mobx";
import _loadWithXhr from "../../../../lib/Core/loadWithXhr";
import Terria from "../../../../lib/Models/Terria";
import ArcGisPortalCatalogGroup, {
  ArcGisPortalStratum
} from "../../../../lib/Models/Catalog/Esri/ArcGisPortalCatalogGroup";
import CommonStrata from "../../../../lib/Models/Definition/CommonStrata";
import i18next from "i18next";
import ArcGisPortalItemReference from "../../../../lib/Models/Catalog/Esri/ArcGisPortalItemReference";
import CatalogGroup from "../../../../lib/Models/Catalog/CatalogGroup";
import { BaseModel } from "../../../../lib/Models/Definition/Model";

configure({
  enforceActions: "observed",
  computedRequiresReaction: true
});

interface ExtendedLoadWithXhr {
  (): any;
  load: { (...args: any[]): any; calls: any };
}

const loadWithXhr: ExtendedLoadWithXhr = <any>_loadWithXhr;

describe("ArcGisPortalCatalogGroup", function () {
  let terria: Terria;
  let portalCatalogGroup: ArcGisPortalCatalogGroup;
  let portalServerStratum: ArcGisPortalStratum;

  beforeEach(async function () {
    terria = new Terria({
      baseUrl: "./"
    });
    portalCatalogGroup = new ArcGisPortalCatalogGroup("test", terria);
    portalCatalogGroup.setTrait(
      "definition",
      "url",
      "https://portal.spatial.nsw.gov.au/portal"
    );
    const realLoadWithXhr = loadWithXhr.load;
    // We replace calls to real servers with pre-captured JSON files so our testing is isolated, but reflects real data.
    spyOn(loadWithXhr, "load").and.callFake(function (...args: any[]) {
      if (
        args[0].indexOf(
          "rest/content/groups/2dfa6cfea7774d9585700059e1fc8219"
        ) > -1
      )
        args[0] =
          "test/ArcGisPortal/group-2dfa6cfea7774d9585700059e1fc8219-items-search.json";
      else if (
        args[0].indexOf(
          "rest/content/groups/c86af18fa4a74336b1feee2a0ee4883d"
        ) > -1
      )
        args[0] =
          "test/ArcGisPortal/group-c86af18fa4a74336b1feee2a0ee4883d-items-search.json";
      else if (args[0].indexOf("rest/community/groups?") > -1)
        args[0] = "test/ArcGisPortal/group-search-results.json";
      else args[0] = "test/ArcGisPortal/search-result.json";

      return realLoadWithXhr(...args);
    });
  });

  it("has a type and typeName", function () {
    expect(portalCatalogGroup.type).toBe("arcgis-portal-group");
    expect(portalCatalogGroup.typeName).toBe(
      i18next.t("models.arcgisPortal.nameGroup")
    );
  });

  describe("default settings - ", function () {
    beforeEach(async function () {
      await portalCatalogGroup.loadMembers();
      portalServerStratum = <ArcGisPortalStratum>(
        portalCatalogGroup.strata.get(ArcGisPortalStratum.stratumName)
      );
    });

    it("properly creates members when no grouping", function () {
      expect(portalCatalogGroup.members).toBeDefined();
      expect(portalCatalogGroup.members.length).toBe(4);
      let member0 = <CatalogGroup>portalCatalogGroup.memberModels[0];
      let member1 = <CatalogGroup>portalCatalogGroup.memberModels[1];
      expect(member0.name).toBe("NSW Transport Theme - Road Segment");
      expect(member1.name).toBe("TopoShp");
    });
  });

  describe("groupBy portal groups - ", function () {
    beforeEach(async function () {
      runInAction(() => {
        portalCatalogGroup.setTrait(
          "definition",
          "groupBy",
          "organisationsGroups"
        );
        portalCatalogGroup.setTrait("definition", "hideEmptyGroups", false);
        portalCatalogGroup.setTrait("definition", "excludeMembers", [
          "Spatial Services Gallery"
        ]);
      });
      await portalCatalogGroup.loadMembers();
      portalServerStratum = <ArcGisPortalStratum>(
        portalCatalogGroup.strata.get(ArcGisPortalStratum.stratumName)
      );
    });

    it("Ungrouped group created", function () {
      let member3 = <CatalogGroup>portalCatalogGroup.memberModels[2];
      expect(member3.name).toBe("Ungrouped");
    });

    it("Creates members from portal groups", function () {
      expect(portalCatalogGroup.members).toBeDefined();
      expect(portalCatalogGroup.members.length).toBe(3);
      let member1 = <CatalogGroup>portalCatalogGroup.memberModels[0];
      expect(member1.name).toBe("NSW Digital Twin");

      let member2 = <CatalogGroup>portalCatalogGroup.memberModels[1];
      expect(member2.name).toBe("Spatial Services Basemaps");
    });

    it("Blacklist trait filters Spatial Services Gallery group", function () {
      if (portalServerStratum.groups && portalServerStratum.filteredGroups) {
        expect(portalServerStratum.groups.length).toBe(4);
        expect(portalServerStratum.filteredGroups.length).toBe(3);
      }
    });

    it("properly creates members within groups", function () {
      if (portalServerStratum !== undefined) {
        if (portalServerStratum.groups) {
          let group0 = <CatalogGroup>portalServerStratum.groups[0];
          expect(group0.name).toBe("NSW Digital Twin");
          // Data read from group-c86af18fa4a74336b1feee2a0ee4883d-items-search.json
          expect(group0.members.length).toBe(2);

          let group1 = <CatalogGroup>portalServerStratum.groups[1];
          expect(group1.name).toBe("Spatial Services Basemaps");
          // Data read from group-2dfa6cfea7774d9585700059e1fc8219-items-search.json
          expect(group1.members.length).toBe(3);
        }
      }
    });

    it("a single item can be placed in two groups", function () {
      if (portalServerStratum !== undefined) {
        if (portalServerStratum.groups) {
          let group0 = <CatalogGroup>portalServerStratum.groups[0];
          let group1 = <CatalogGroup>portalServerStratum.groups[1];
          expect(group0.members[0]).toBe(group1.members[0]);
        }
      }
    });
  });

  describe("groupBy portal categories - ", function () {
    beforeEach(async function () {
      runInAction(() => {
        portalCatalogGroup.setTrait(
          "definition",
          "groupBy",
          "portalCategories"
        );

        portalCatalogGroup.setTrait(
          "definition",
          "ungroupedTitle",
          "Ungrouped Content"
        );
      });
      await portalCatalogGroup.loadMembers();
      portalServerStratum = <ArcGisPortalStratum>(
        portalCatalogGroup.strata.get(ArcGisPortalStratum.stratumName)
      );
    });

    it("ungroupedTitle trait works", function () {
      let member2 = <CatalogGroup>portalCatalogGroup.memberModels[1];
      expect(member2.name).toBe("Ungrouped Content");
    });

    it("properly creates groups from categories", function () {
      expect(portalCatalogGroup.members).toBeDefined();
      expect(portalCatalogGroup.members.length).toBe(2);
      let member1 = <CatalogGroup>portalCatalogGroup.memberModels[0];
      expect(member1.name).toBe("Transport");
    });

    it("properly creates members within groups", function () {
      if (portalServerStratum !== undefined) {
        if (portalServerStratum.groups) {
          let group0 = <CatalogGroup>portalServerStratum.groups[0];
          expect(group0.name).toBe("Transport");
          expect(group0.members.length).toBe(1);

          let group1 = <CatalogGroup>portalServerStratum.groups[1];
          expect(group1.members.length).toBe(3);
        }
      }
    });
  });
});
