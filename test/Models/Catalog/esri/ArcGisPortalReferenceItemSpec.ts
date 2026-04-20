import { configure, runInAction } from "mobx";
import { http, HttpResponse } from "msw";
import Terria from "../../../../lib/Models/Terria";
import registerCatalogMembers from "../../../../lib/Models/Catalog/registerCatalogMembers";

import i18next from "i18next";
import ArcGisPortalItemReference from "../../../../lib/Models/Catalog/Esri/ArcGisPortalItemReference";
import ArcGisFeatureServerCatalogItem from "../../../../lib/Models/Catalog/Esri/ArcGisFeatureServerCatalogItem";
import { worker } from "../../../mocks/browser";

import itemJson from "../../../../wwwroot/test/ArcGisPortal/item.json";
import itemDataJson from "../../../../wwwroot/test/ArcGisPortal/item-data.json";

configure({
  enforceActions: "observed",
  computedRequiresReaction: true
});

describe("ArcGisPortalItemReference", function () {
  let terria: Terria;
  let arcGisPortalItemReference: ArcGisPortalItemReference;
  let portalItemTarget: any;

  beforeEach(function () {
    terria = new Terria({
      baseUrl: "./"
    });
    registerCatalogMembers();
    arcGisPortalItemReference = new ArcGisPortalItemReference(
      "portaltest",
      terria
    );

    worker.use(
      // Item data endpoint (must be before item endpoint since it's more specific)
      http.get(
        "https://portal.spatial.nsw.gov.au/portal/sharing/rest/content/items/:itemId/data",
        () => HttpResponse.json(itemDataJson)
      ),
      // Item metadata endpoint
      http.get(
        "https://portal.spatial.nsw.gov.au/portal/sharing/rest/content/items/:itemId",
        () => HttpResponse.json(itemJson)
      )
    );
  });

  it("has a type and typeName", function () {
    expect(arcGisPortalItemReference.type).toBe("arcgis-portal-item");
    expect(arcGisPortalItemReference.typeName).toBe(
      i18next.t("models.arcgisPortal.name")
    );
  });

  describe("Can load an item by datasetId - ", function () {
    beforeEach(async function () {
      runInAction(() => {
        arcGisPortalItemReference.setTrait(
          "definition",
          "url",
          "https://portal.spatial.nsw.gov.au/portal"
        );
        arcGisPortalItemReference.setTrait(
          "definition",
          "name",
          "Road Segments"
        );
        arcGisPortalItemReference.setTrait(
          "definition",
          "itemId",
          "66fabd8c23074ecc85883e0086419adc"
        );
      });
      await arcGisPortalItemReference.loadReference();

      portalItemTarget = arcGisPortalItemReference.target;
    });

    it("properly creates item", function () {
      // when creating a single item directly name is retained from the definition stratum
      expect(arcGisPortalItemReference.name).toBe("Road Segments");

      expect(arcGisPortalItemReference._arcgisItem).toBeDefined();
      expect(arcGisPortalItemReference._arcgisPortalCatalogGroup).toBe(
        undefined
      );

      expect(arcGisPortalItemReference).toBeDefined();
      expect(portalItemTarget instanceof ArcGisFeatureServerCatalogItem).toBe(
        true
      );
      expect(portalItemTarget.url).toBe(
        "https://portal.spatial.nsw.gov.au/server/rest/services/NSW_Transport_Theme/FeatureServer/5"
      );

      const licenceInfo = portalItemTarget.info.filter(
        (i: any) => i.name === i18next.t("models.arcgisPortal.licence")
      )[0];
      expect(licenceInfo.content).toBeDefined();

      expect(portalItemTarget.description).toBeDefined();
    });
  });
});
