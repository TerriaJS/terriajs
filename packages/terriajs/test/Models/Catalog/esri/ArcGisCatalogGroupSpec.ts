import i18next from "i18next";
import { configure, runInAction } from "mobx";
import { http, HttpResponse } from "msw";
import ArcGisCatalogGroup from "../../../../lib/Models/Catalog/Esri/ArcGisCatalogGroup";
import ArcGisFeatureServerCatalogGroup, {
  FeatureServerStratum
} from "../../../../lib/Models/Catalog/Esri/ArcGisFeatureServerCatalogGroup";
import ArcGisMapServerCatalogGroup, {
  MapServerStratum
} from "../../../../lib/Models/Catalog/Esri/ArcGisMapServerCatalogGroup";
import ArcGisMapServerCatalogItem from "../../../../lib/Models/Catalog/Esri/ArcGisMapServerCatalogItem";
import CommonStrata from "../../../../lib/Models/Definition/CommonStrata";
import Terria from "../../../../lib/Models/Terria";
import { worker } from "../../../mocks/browser";

import servicesJson from "../../../../wwwroot/test/ArcGisServer/sampleserver6/services.json";
import agpJson from "../../../../wwwroot/test/ArcGisServer/sampleserver6/AGP.json";
import elevationJson from "../../../../wwwroot/test/ArcGisServer/sampleserver6/Elevation.json";
import hotspotMSJson from "../../../../wwwroot/test/ArcGisServer/sampleserver6/911CallsHotspotMS.json";
import censusMSJson from "../../../../wwwroot/test/ArcGisServer/sampleserver6/CensusMS.json";
import commercialDamageAssessmentFSJson from "../../../../wwwroot/test/ArcGisServer/sampleserver6/CommercialDamageAssessmentFS.json";
import commercialDamageAssessmentMSJson from "../../../../wwwroot/test/ArcGisServer/sampleserver6/CommercialDamageAssessmentMS.json";
import communityAddressingFSJson from "../../../../wwwroot/test/ArcGisServer/sampleserver6/CommunityAddressingFS.json";
import communityAddressingMSJson from "../../../../wwwroot/test/ArcGisServer/sampleserver6/CommunityAddressingMS.json";

import redlandsMapServerJson from "../../../../wwwroot/test/ArcGisMapServer/Redlands_Emergency_Vehicles/mapServer.json";
import redlandsFeatureServerJson from "../../../../wwwroot/test/ArcGisFeatureServer/Redlands_Emergency_Vehicles/featureServer.json";

import singleFusedMapCacheMapServerJson from "../../../../wwwroot/test/ArcGisMapServer/SingleFusedMapCache/mapserver.json";
import singleFusedMapCacheLegendJson from "../../../../wwwroot/test/ArcGisMapServer/SingleFusedMapCache/legend.json";
import singleFusedMapCacheLayersJson from "../../../../wwwroot/test/ArcGisMapServer/SingleFusedMapCache/layers.json";

configure({
  enforceActions: "observed",
  computedRequiresReaction: true
});

describe("ArcGisCatalogGroup", function () {
  const arcgisServerUrl = "http://example.com/arcgis/rest/services/";
  const arcgisMapServerUrl =
    "http://example.com/arcgis/rest/services/Redlands_Emergency_Vehicles/MapServer";
  const arcgisFeatureServerUrl =
    "http://example.com/arcgis/rest/services/Redlands_Emergency_Vehicles/FeatureServer";
  let terria: Terria;
  let group: ArcGisCatalogGroup;

  beforeEach(function () {
    terria = new Terria({
      baseUrl: "./"
    });
    group = new ArcGisCatalogGroup("test", terria);

    worker.use(
      // Sub-folder services: AGP, Elevation (with and without trailing slash)
      http.get("http://example.com/arcgis/rest/services/AGP", () =>
        HttpResponse.json(agpJson)
      ),
      http.get("http://example.com/arcgis/rest/services/AGP/", () =>
        HttpResponse.json(agpJson)
      ),
      http.get("http://example.com/arcgis/rest/services/Elevation", () =>
        HttpResponse.json(elevationJson)
      ),
      http.get("http://example.com/arcgis/rest/services/Elevation/", () =>
        HttpResponse.json(elevationJson)
      ),

      // Individual MapServer/FeatureServer services (from the services listing)
      http.get(
        "http://example.com/arcgis/rest/services/911CallsHotspotMS/MapServer",
        () => HttpResponse.json(hotspotMSJson)
      ),
      http.get(
        "http://example.com/arcgis/rest/services/CensusMS/MapServer",
        () => HttpResponse.json(censusMSJson)
      ),
      http.get(
        "http://example.com/arcgis/rest/services/CommercialDamageAssessmentFS/FeatureServer",
        () => HttpResponse.json(commercialDamageAssessmentFSJson)
      ),
      http.get(
        "http://example.com/arcgis/rest/services/CommercialDamageAssessmentMS/MapServer",
        () => HttpResponse.json(commercialDamageAssessmentMSJson)
      ),
      http.get(
        "http://example.com/arcgis/rest/services/CommunityAddressingFS/FeatureServer",
        () => HttpResponse.json(communityAddressingFSJson)
      ),
      http.get(
        "http://example.com/arcgis/rest/services/CommunityAddressingMS/MapServer",
        () => HttpResponse.json(communityAddressingMSJson)
      ),

      // ArcGIS Server services root
      http.get("http://example.com/arcgis/rest/services/", () =>
        HttpResponse.json(servicesJson)
      ),

      // Redlands MapServer
      http.get(
        "http://example.com/arcgis/rest/services/Redlands_Emergency_Vehicles/MapServer",
        () => HttpResponse.json(redlandsMapServerJson)
      ),

      // Redlands FeatureServer
      http.get(
        "http://example.com/arcgis/rest/services/Redlands_Emergency_Vehicles/FeatureServer",
        () => HttpResponse.json(redlandsFeatureServerJson)
      ),

      // SingleFusedMapCache MapServer (different host)
      http.get(
        "http://www.example.com/SingleFusedMapCache/MapServer/Layers",
        () => HttpResponse.json(singleFusedMapCacheLayersJson)
      ),
      http.get(
        "http://www.example.com/SingleFusedMapCache/MapServer/Legend",
        () => HttpResponse.json(singleFusedMapCacheLegendJson)
      ),
      http.get("http://www.example.com/SingleFusedMapCache/MapServer", () =>
        HttpResponse.json(singleFusedMapCacheMapServerJson)
      )
    );
  });

  it("has a type and typeName", function () {
    expect(group.type).toBe("esri-group");
    expect(group.typeName).toBe(i18next.t("models.arcGisService.name"));
  });

  describe("loadMembers", function () {
    it("properly creates members", async function () {
      runInAction(() => {
        group.setTrait(CommonStrata.definition, "url", arcgisServerUrl);
      });
      await group.loadMembers();

      expect(group.members).toBeDefined();
      expect(group.members.length).toBe(8);
      expect(group.memberModels).toBeDefined();
      expect(group.memberModels.length).toBe(8);

      const member0 = group.memberModels[0] as ArcGisCatalogGroup;
      const member1 = group.memberModels[1] as ArcGisCatalogGroup;
      const member2 = group.memberModels[2] as ArcGisMapServerCatalogGroup;
      const member3 = group.memberModels[3] as ArcGisMapServerCatalogGroup;
      const member4 = group.memberModels[4] as ArcGisFeatureServerCatalogGroup;
      const member5 = group.memberModels[5] as ArcGisMapServerCatalogGroup;
      const member6 = group.memberModels[6] as ArcGisFeatureServerCatalogGroup;
      const member7 = group.memberModels[7] as ArcGisMapServerCatalogGroup;

      expect(member0 instanceof ArcGisCatalogGroup).toBeTruthy();
      expect(member0.name).toBe("AGP");
      expect(member0.uniqueId).toBe("test/AGP");
      await member0.loadMembers();
      expect(member0.members).toBeDefined();
      expect(member0.members.length).toBe(4);
      expect(member0.memberModels).toBeDefined();
      expect(member0.memberModels.length).toBe(4);

      expect(member1 instanceof ArcGisCatalogGroup).toBeTruthy();
      expect(member1.name).toBe("Elevation");
      expect(member1.uniqueId).toBe("test/Elevation");
      await member1.loadMembers();
      expect(member1.members).toBeDefined();
      expect(member1.members.length).toBe(3);
      expect(member1.memberModels).toBeDefined();
      expect(member1.memberModels.length).toBe(3);

      expect(member2 instanceof ArcGisMapServerCatalogGroup).toBeTruthy();
      expect(member2.name).toBe("911CallsHotspotMS");
      expect(member2.uniqueId).toBe("test/911CallsHotspotMS/MapServer");
      await member2.loadMembers();
      expect(member2.members).toBeDefined();
      expect(member2.members.length).toBe(1);
      expect(member2.memberModels).toBeDefined();
      expect(member2.memberModels.length).toBe(1);

      expect(member3 instanceof ArcGisMapServerCatalogGroup).toBeTruthy();
      expect(member3.name).toBe("CensusMS");
      expect(member3.uniqueId).toBe("test/CensusMS/MapServer");
      await member3.loadMembers();
      expect(member3.members).toBeDefined();
      expect(member3.members.length).toBe(4);
      expect(member3.memberModels).toBeDefined();
      expect(member3.memberModels.length).toBe(4);

      expect(member4 instanceof ArcGisFeatureServerCatalogGroup).toBeTruthy();
      expect(member4.name).toBe("CommercialDamageAssessmentFS");
      expect(member4.uniqueId).toBe(
        "test/CommercialDamageAssessmentFS/FeatureServer"
      );
      await member4.loadMembers();
      expect(member4.members).toBeDefined();
      expect(member4.members.length).toBe(1);
      expect(member4.memberModels).toBeDefined();
      expect(member4.memberModels.length).toBe(1);

      expect(member5 instanceof ArcGisMapServerCatalogGroup).toBeTruthy();
      expect(member5.name).toBe("CommercialDamageAssessmentMS");
      expect(member5.uniqueId).toBe(
        "test/CommercialDamageAssessmentMS/MapServer"
      );
      await member5.loadMembers();
      expect(member5.members).toBeDefined();
      expect(member5.members.length).toBe(1);
      expect(member5.memberModels).toBeDefined();
      expect(member5.memberModels.length).toBe(1);

      expect(member6 instanceof ArcGisFeatureServerCatalogGroup).toBeTruthy();
      expect(member6.name).toBe("CommunityAddressingFS");
      expect(member6.uniqueId).toBe("test/CommunityAddressingFS/FeatureServer");
      await member6.loadMembers();
      expect(member6.members).toBeDefined();
      expect(member6.members.length).toBe(1);
      expect(member6.memberModels).toBeDefined();
      expect(member6.memberModels.length).toBe(1);

      expect(member7 instanceof ArcGisMapServerCatalogGroup).toBeTruthy();
      expect(member7.name).toBe("CommunityAddressingMS");
      expect(member7.uniqueId).toBe("test/CommunityAddressingMS/MapServer");
      await member7.loadMembers();
      expect(member7.members).toBeDefined();
      expect(member7.members.length).toBe(1);
      expect(member7.memberModels).toBeDefined();
      expect(member7.memberModels.length).toBe(1);
    });
  });

  describe("loading mapserver", function () {
    beforeEach(async function () {
      runInAction(() => {
        group.setTrait("definition", "url", arcgisMapServerUrl);
      });
      await group.loadMetadata();
    });
    it("proper init", function () {
      const arcgisServerStratum = group.strata.get(
        MapServerStratum.stratumName
      ) as MapServerStratum | undefined;
      expect(arcgisServerStratum).toBeDefined();
      expect(arcgisServerStratum instanceof MapServerStratum).toBeTruthy();
    });
  });

  describe("loading featureServer of mapServer", function () {
    beforeEach(async function () {
      runInAction(() => {
        group.setTrait("definition", "url", arcgisFeatureServerUrl);
      });
      await group.loadMetadata();
    });
    it("proper init", function () {
      const arcgisServerStratum = group.strata.get(
        FeatureServerStratum.stratumName
      ) as FeatureServerStratum | undefined;
      expect(arcgisServerStratum).toBeDefined();
      expect(arcgisServerStratum instanceof FeatureServerStratum).toBeTruthy();
    });
  });

  describe("Supports MapServer with TilesOnly single fused map cache", function () {
    beforeEach(async () => {
      runInAction(() => {
        group.setTrait(
          CommonStrata.definition,
          "url",
          "http://www.example.com/SingleFusedMapCache/MapServer"
        );
      });
      (await group.loadMembers()).throwIfError();
    });

    it('Creates a single item called "models.arcGisMapServerCatalogGroup.singleFusedMapCacheLayerName"', function () {
      expect(group.memberModels.length).toBe(1);
      expect(
        group.memberModels[0] instanceof ArcGisMapServerCatalogItem
      ).toBeTruthy();
      const item = group.memberModels[0] as ArcGisMapServerCatalogItem;
      expect(item.name).toBe(
        "models.arcGisMapServerCatalogGroup.singleFusedMapCacheLayerName"
      );
      expect(item.layers).toBeUndefined();
      expect(item.layersArray.length).toBe(0);
    });
  });

  describe("loading ArcGIS group with token", function () {
    beforeEach(async function () {
      runInAction(() => {
        group.setTrait(CommonStrata.definition, "url", arcgisServerUrl);
        group.setTrait(CommonStrata.definition, "token", "test-token");
      });
    });

    it("Uses token in url", async function () {
      worker.use(
        http.get("http://example.com/arcgis/rest/services/", ({ request }) => {
          if (new URL(request.url).searchParams.get("token") !== "test-token")
            return HttpResponse.error();
          return HttpResponse.json(servicesJson);
        })
      );
      await group.loadMembers();
      expect(group.members.length).toBe(8);
    });

    it("Correctly passes token to members", async function () {
      await group.loadMembers();

      expect(group.members).toBeDefined();
      expect(group.members.length).toBe(8);
      expect(group.memberModels).toBeDefined();
      expect(group.memberModels.length).toBe(8);

      const member0 = group.memberModels[0] as ArcGisCatalogGroup;
      const member1 = group.memberModels[1] as ArcGisCatalogGroup;
      const member2 = group.memberModels[2] as ArcGisMapServerCatalogGroup;
      const member3 = group.memberModels[3] as ArcGisMapServerCatalogGroup;
      const member4 = group.memberModels[4] as ArcGisFeatureServerCatalogGroup;
      const member5 = group.memberModels[5] as ArcGisMapServerCatalogGroup;
      const member6 = group.memberModels[6] as ArcGisFeatureServerCatalogGroup;
      const member7 = group.memberModels[7] as ArcGisMapServerCatalogGroup;

      expect(member0.token).toBe("test-token");
      expect(member1.token).toBe("test-token");
      expect(member2.token).toBe("test-token");
      expect(member3.token).toBe("test-token");
      expect(member4.token).toBe("test-token");
      expect(member5.token).toBe("test-token");
      expect(member6.token).toBe("test-token");
      expect(member7.token).toBe("test-token");
    });
  });
});
