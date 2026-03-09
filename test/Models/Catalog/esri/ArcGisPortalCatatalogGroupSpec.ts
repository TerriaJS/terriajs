import { configure, runInAction } from "mobx";
import { http, HttpResponse } from "msw";
import Terria from "../../../../lib/Models/Terria";
import ArcGisPortalCatalogGroup, {
  ArcGisPortalStratum
} from "../../../../lib/Models/Catalog/Esri/ArcGisPortalCatalogGroup";
import i18next from "i18next";
import CatalogGroup from "../../../../lib/Models/Catalog/CatalogGroup";
import { worker } from "../../../mocks/browser";

import searchResultJson from "../../../../wwwroot/test/ArcGisPortal/search-result.json";
import groupSearchResultsJson from "../../../../wwwroot/test/ArcGisPortal/group-search-results.json";
import group2dfaItemsSearchJson from "../../../../wwwroot/test/ArcGisPortal/group-2dfa6cfea7774d9585700059e1fc8219-items-search.json";
import groupC86aItemsSearchJson from "../../../../wwwroot/test/ArcGisPortal/group-c86af18fa4a74336b1feee2a0ee4883d-items-search.json";

configure({
  enforceActions: "observed",
  computedRequiresReaction: true
});

describe("ArcGisPortalCatalogGroup", function () {
  let terria: Terria;
  let portalCatalogGroup: ArcGisPortalCatalogGroup;
  let portalServerStratum: ArcGisPortalStratum;

  beforeEach(function () {
    terria = new Terria({
      baseUrl: "./"
    });
    portalCatalogGroup = new ArcGisPortalCatalogGroup("test", terria);
    portalCatalogGroup.setTrait(
      "definition",
      "url",
      "https://portal.spatial.nsw.gov.au/portal"
    );

    worker.use(
      // Group-specific items searches
      http.get(
        "https://portal.spatial.nsw.gov.au/portal/sharing/rest/content/groups/2dfa6cfea7774d9585700059e1fc8219/search",
        () => HttpResponse.json(group2dfaItemsSearchJson)
      ),
      http.get(
        "https://portal.spatial.nsw.gov.au/portal/sharing/rest/content/groups/c86af18fa4a74336b1feee2a0ee4883d/search",
        () => HttpResponse.json(groupC86aItemsSearchJson)
      ),
      // "Spatial Services Gallery" group — excluded via excludeMembers, but still fetched by the API
      http.get(
        "https://portal.spatial.nsw.gov.au/portal/sharing/rest/content/groups/c6bf5249df1448629db37636aa0c5880/search",
        () =>
          HttpResponse.json({
            total: 0,
            start: 1,
            num: 0,
            nextStart: -1,
            results: []
          })
      ),
      // Community groups search
      http.get(
        "https://portal.spatial.nsw.gov.au/portal/sharing/rest/community/groups",
        () => HttpResponse.json(groupSearchResultsJson)
      ),
      // Default: search result
      http.get(
        "https://portal.spatial.nsw.gov.au/portal/sharing/rest/search",
        () => HttpResponse.json(searchResultJson)
      )
    );
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
      portalServerStratum = portalCatalogGroup.strata.get(
        ArcGisPortalStratum.stratumName
      ) as ArcGisPortalStratum;
    });

    it("properly creates members when no grouping", function () {
      expect(portalCatalogGroup.members).toBeDefined();
      expect(portalCatalogGroup.members.length).toBe(4);
      const member0 = portalCatalogGroup.memberModels[0] as CatalogGroup;
      const member1 = portalCatalogGroup.memberModels[1] as CatalogGroup;
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
      portalServerStratum = portalCatalogGroup.strata.get(
        ArcGisPortalStratum.stratumName
      ) as ArcGisPortalStratum;
    });

    it("Ungrouped group created", function () {
      const member3 = portalCatalogGroup.memberModels[2] as CatalogGroup;
      expect(member3.name).toBe("Ungrouped");
    });

    it("Creates members from portal groups", function () {
      expect(portalCatalogGroup.members).toBeDefined();
      expect(portalCatalogGroup.members.length).toBe(3);
      const member1 = portalCatalogGroup.memberModels[0] as CatalogGroup;
      expect(member1.name).toBe("NSW Digital Twin");

      const member2 = portalCatalogGroup.memberModels[1] as CatalogGroup;
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
          const group0 = portalServerStratum.groups[0] as CatalogGroup;
          expect(group0.name).toBe("NSW Digital Twin");
          // Data read from group-c86af18fa4a74336b1feee2a0ee4883d-items-search.json
          expect(group0.members.length).toBe(2);

          const group1 = portalServerStratum.groups[1] as CatalogGroup;
          expect(group1.name).toBe("Spatial Services Basemaps");
          // Data read from group-2dfa6cfea7774d9585700059e1fc8219-items-search.json
          expect(group1.members.length).toBe(3);
        }
      }
    });

    it("a single item can be placed in two groups", function () {
      if (portalServerStratum !== undefined) {
        if (portalServerStratum.groups) {
          const group0 = portalServerStratum.groups[0] as CatalogGroup;
          const group1 = portalServerStratum.groups[1] as CatalogGroup;
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
      portalServerStratum = portalCatalogGroup.strata.get(
        ArcGisPortalStratum.stratumName
      ) as ArcGisPortalStratum;
    });

    it("ungroupedTitle trait works", function () {
      const member2 = portalCatalogGroup.memberModels[1] as CatalogGroup;
      expect(member2.name).toBe("Ungrouped Content");
    });

    it("properly creates groups from categories", function () {
      expect(portalCatalogGroup.members).toBeDefined();
      expect(portalCatalogGroup.members.length).toBe(2);
      const member1 = portalCatalogGroup.memberModels[0] as CatalogGroup;
      expect(member1.name).toBe("Transport");
    });

    it("properly creates members within groups", function () {
      if (portalServerStratum !== undefined) {
        if (portalServerStratum.groups) {
          const group0 = portalServerStratum.groups[0] as CatalogGroup;
          expect(group0.name).toBe("Transport");
          expect(group0.members.length).toBe(1);

          const group1 = portalServerStratum.groups[1] as CatalogGroup;
          expect(group1.members.length).toBe(3);
        }
      }
    });
  });
});
