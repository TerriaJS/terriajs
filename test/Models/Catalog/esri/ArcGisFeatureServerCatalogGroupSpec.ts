import { configure, runInAction } from "mobx";
import { http, HttpResponse } from "msw";
import Terria from "../../../../lib/Models/Terria";
import ArcGisFeatureServerCatalogGroup from "../../../../lib/Models/Catalog/Esri/ArcGisFeatureServerCatalogGroup";
import CommonStrata from "../../../../lib/Models/Definition/CommonStrata";
import i18next from "i18next";
import ArcGisFeatureServerCatalogItem from "../../../../lib/Models/Catalog/Esri/ArcGisFeatureServerCatalogItem";
import { worker } from "../../../mocks/browser";

import featureServerJson from "../../../../wwwroot/test/ArcGisFeatureServer/Redlands_Emergency_Vehicles/featureServer.json";

configure({
  enforceActions: "observed",
  computedRequiresReaction: true
});

describe("ArcGisFeatureServerCatalogGroup", function () {
  const featureServerUrl =
    "http://example.com/arcgis/rest/services/Redlands_Emergency_Vehicles/FeatureServer";
  let terria: Terria;
  let group: ArcGisFeatureServerCatalogGroup;

  beforeEach(function () {
    terria = new Terria({
      baseUrl: "./"
    });
    group = new ArcGisFeatureServerCatalogGroup("test", terria);

    worker.use(
      http.get(
        "http://example.com/arcgis/rest/services/Redlands_Emergency_Vehicles/FeatureServer",
        () => HttpResponse.json(featureServerJson)
      )
    );
  });

  it("has a type and typeName", function () {
    expect(group.type).toBe("esri-featureServer-group");
    expect(group.typeName).toBe(
      i18next.t("models.arcGisFeatureServerCatalogGroup.name")
    );
  });

  describe("after loading metadata", function () {
    beforeEach(async function () {
      runInAction(() => {
        group.setTrait("definition", "url", featureServerUrl);
      });
      await group.loadMetadata();
    });

    it("defines info", function () {
      const serviceDescription = i18next.t(
        "models.arcGisFeatureServerCatalogGroup.serviceDescription"
      );
      const dataDescription = i18next.t(
        "models.arcGisFeatureServerCatalogGroup.dataDescription"
      );
      const copyrightText = i18next.t(
        "models.arcGisFeatureServerCatalogGroup.copyrightText"
      );

      expect(group.info.map(({ name }) => name)).toEqual([
        serviceDescription,
        dataDescription,
        copyrightText
      ]);
      expect(group.info.map(({ content }) => content)).toEqual([
        "Vehicle Service Description",
        "Vehicle Description",
        "Vehicle Copyright"
      ]);
    });
  });

  describe("loadMembers", function () {
    it("properly creates members", async function () {
      runInAction(() => {
        group.setTrait(CommonStrata.definition, "url", featureServerUrl);
      });

      await group.loadMembers();

      expect(group.members).toBeDefined();
      expect(group.members.length).toBe(3);

      const member0 = group.memberModels[0] as ArcGisFeatureServerCatalogItem;
      const member1 = group.memberModels[1] as ArcGisFeatureServerCatalogItem;
      const member2 = group.memberModels[2] as ArcGisFeatureServerCatalogItem;

      expect(member0.name).toBe("Ambulances");
      expect(member0.url).toBe(featureServerUrl + "/0");

      expect(member1.name).toBe("Police");
      expect(member1.url).toBe(featureServerUrl + "/1");

      expect(member2.name).toBe("Fire");
      expect(member2.url).toBe(featureServerUrl + "/123");
    });
  });

  describe("Supports FeatureServer with token", function () {
    beforeEach(async function () {
      runInAction(() => {
        group.setTrait(CommonStrata.definition, "url", featureServerUrl);
        group.setTrait(CommonStrata.definition, "token", "test-token");
      });
    });

    it("Uses token in url", async function () {
      worker.use(
        http.get(
          "http://example.com/arcgis/rest/services/Redlands_Emergency_Vehicles/FeatureServer",
          ({ request }) => {
            if (new URL(request.url).searchParams.get("token") !== "test-token")
              return HttpResponse.error();
            return HttpResponse.json(featureServerJson);
          }
        )
      );
      await group.loadMembers();
      expect(group.members.length).toBe(3);
    });

    it("Correctly passes token to members", async function () {
      await group.loadMembers();

      expect(group.members).toBeDefined();
      expect(group.members.length).toBe(3);
      expect(group.memberModels).toBeDefined();
      expect(group.memberModels.length).toBe(3);

      const member0 = group.memberModels[0] as ArcGisFeatureServerCatalogItem;
      const member1 = group.memberModels[1] as ArcGisFeatureServerCatalogItem;
      const member2 = group.memberModels[2] as ArcGisFeatureServerCatalogItem;

      expect(member0.token).toBe("test-token");
      expect(member1.token).toBe("test-token");
      expect(member2.token).toBe("test-token");
    });
  });
});
