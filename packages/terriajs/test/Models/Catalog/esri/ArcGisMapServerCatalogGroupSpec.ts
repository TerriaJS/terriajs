import { configure, runInAction } from "mobx";
import { http, HttpResponse } from "msw";
import Terria from "../../../../lib/Models/Terria";
import ArcGisMapServerCatalogGroup from "../../../../lib/Models/Catalog/Esri/ArcGisMapServerCatalogGroup";
import CommonStrata from "../../../../lib/Models/Definition/CommonStrata";
import i18next from "i18next";
import ArcGisMapServerCatalogItem from "../../../../lib/Models/Catalog/Esri/ArcGisMapServerCatalogItem";
import { worker } from "../../../mocks/browser";

import redlandsMapServerJson from "../../../../wwwroot/test/ArcGisMapServer/Redlands_Emergency_Vehicles/mapServer.json";
import redlands17Json from "../../../../wwwroot/test/ArcGisMapServer/Redlands_Emergency_Vehicles/17.json";
import singleFusedMapCacheMapServerJson from "../../../../wwwroot/test/ArcGisMapServer/SingleFusedMapCache/mapserver.json";
import singleFusedMapCacheLegendJson from "../../../../wwwroot/test/ArcGisMapServer/SingleFusedMapCache/legend.json";
import singleFusedMapCacheLayersJson from "../../../../wwwroot/test/ArcGisMapServer/SingleFusedMapCache/layers.json";
import residentialMapServerJson from "../../../../wwwroot/test/ArcGisMapServer/Residential_Dwelling_Density/mapServer.json";

configure({
  enforceActions: "observed",
  computedRequiresReaction: true
});

describe("ArcGisMapServerCatalogGroup", function () {
  const mapServerUrl =
    "http://example.com/arcgis/rest/services/Redlands_Emergency_Vehicles/MapServer";
  const mapServerErrorUrl =
    "http://example.com/arcgis/rest/services/unknown/MapServer";
  let terria: Terria;
  let group: ArcGisMapServerCatalogGroup;

  beforeEach(function () {
    terria = new Terria({
      baseUrl: "./"
    });
    group = new ArcGisMapServerCatalogGroup("test", terria);

    worker.use(
      // Redlands MapServer - sub-layer 17
      http.get(
        "http://example.com/arcgis/rest/services/Redlands_Emergency_Vehicles/MapServer/17",
        () => HttpResponse.json(redlands17Json)
      ),
      // Redlands MapServer root
      http.get(
        "http://example.com/arcgis/rest/services/Redlands_Emergency_Vehicles/MapServer",
        () => HttpResponse.json(redlandsMapServerJson)
      ),

      // SingleFusedMapCache MapServer
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
      ),

      // Error tests: unknown MapServer returns network error
      http.get(
        "http://example.com/arcgis/rest/services/unknown/MapServer",
        () => HttpResponse.error()
      )
    );
  });

  it("has a type and typeName", function () {
    expect(group.type).toBe("esri-mapServer-group");
    expect(group.typeName).toBe(
      i18next.t("models.arcGisMapServerCatalogGroup.name")
    );
  });

  describe("after loading metadata", function () {
    beforeEach(async function () {
      runInAction(() => {
        group.setTrait("definition", "url", mapServerUrl);
      });
      await group.loadMetadata();
    });

    it("defines info", function () {
      const serviceDescription = i18next.t(
        "models.arcGisMapServerCatalogGroup.serviceDescription"
      );
      const dataDescription = i18next.t(
        "models.arcGisMapServerCatalogGroup.dataDescription"
      );
      const copyrightText = i18next.t(
        "models.arcGisMapServerCatalogGroup.copyrightText"
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
        group.setTrait(CommonStrata.definition, "url", mapServerUrl);
      });

      await group.loadMembers();

      expect(group.members).toBeDefined();
      expect(group.members.length).toBe(4);
      expect(group.memberModels).toBeDefined();
      expect(group.memberModels.length).toBe(4);

      const member0 = group.memberModels[0] as ArcGisMapServerCatalogItem;
      const member1 = group.memberModels[1] as ArcGisMapServerCatalogItem;
      const member2 = group.memberModels[2] as ArcGisMapServerCatalogItem;
      const member3 = group.memberModels[3] as ArcGisMapServerCatalogGroup;

      expect(member0.name).toBe("Ambulances");
      expect(member0.url).toBe(mapServerUrl + "/0");

      expect(member1.name).toBe("Police");
      expect(member1.url).toBe(mapServerUrl + "/1");

      expect(member2.name).toBe("Fire");
      expect(member2.url).toBe(mapServerUrl + "/25");

      expect(member3.name).toBe("911 Calls Hotspot");
      expect(member3.url).toBe(mapServerUrl + "/17");

      expect(member3.members.length).toBe(0);
      expect(member3.memberModels.length).toBe(0);

      await member3.loadMembers();

      expect(member3.members.length).toBe(2);
      expect(member3.memberModels.length).toBe(2);

      const member4 = member3.memberModels[0] as ArcGisMapServerCatalogGroup;
      const member5 = member3.memberModels[1] as ArcGisMapServerCatalogGroup;
      expect(member4.name).toBe("Output Features");
      expect(member4.url).toBe(mapServerUrl + "/23");

      expect(member5.name).toBe("Hotspot Raster");
      expect(member5.url).toBe(mapServerUrl + "/27");
    });

    it("throws error on unavailable url", async function () {
      runInAction(() => {
        group.setTrait(CommonStrata.definition, "url", mapServerErrorUrl);
      });

      const error = (await group.loadMembers()).error;

      expect(error).toBeDefined("Load member should error");
    });

    it("throws error if it's not mapserver ", async function () {
      runInAction(() => {
        group.setTrait(CommonStrata.definition, "url", mapServerErrorUrl);
      });

      const error = (await group.loadMembers()).error;

      expect(error).toBeDefined("Load member should error");
    });
  });

  describe("Supports MapServer with token", function () {
    beforeEach(async function () {
      runInAction(() => {
        group.setTrait(CommonStrata.definition, "url", mapServerUrl);
        group.setTrait(CommonStrata.definition, "token", "test-token");
      });
    });

    it("Uses token in url", async function () {
      worker.use(
        http.get(
          "http://example.com/arcgis/rest/services/Redlands_Emergency_Vehicles/MapServer",
          ({ request }) => {
            if (new URL(request.url).searchParams.get("token") !== "test-token")
              return HttpResponse.error();
            return HttpResponse.json(redlandsMapServerJson);
          }
        )
      );
      await group.loadMembers();
      expect(group.members.length).toBe(4);
    });

    it("Correctly passes token to members", async function () {
      await group.loadMembers();

      expect(group.members).toBeDefined();
      expect(group.members.length).toBe(4);
      expect(group.memberModels).toBeDefined();
      expect(group.memberModels.length).toBe(4);

      const member0 = group.memberModels[0] as ArcGisMapServerCatalogItem;
      const member1 = group.memberModels[1] as ArcGisMapServerCatalogItem;
      const member2 = group.memberModels[2] as ArcGisMapServerCatalogItem;
      const member3 = group.memberModels[3] as ArcGisMapServerCatalogGroup;

      expect(member0.token).toBe("test-token");
      expect(member1.token).toBe("test-token");
      expect(member2.token).toBe("test-token");
      expect(member3.token).toBe("test-token");

      await member3.loadMembers();

      const member4 = member3.memberModels[0] as ArcGisMapServerCatalogGroup;
      const member5 = member3.memberModels[1] as ArcGisMapServerCatalogGroup;

      expect(member4.token).toBe("test-token");
      expect(member5.token).toBe("test-token");
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

    it("Correctly passes token to members", async function () {
      runInAction(() => {
        group.setTrait(CommonStrata.definition, "token", "test-token");
      });
      await group.loadMembers();

      const member = group.memberModels[0] as ArcGisMapServerCatalogItem;
      expect(member.token).toBe("test-token");
    });
  });
});

describe("ArcGisMapServerCatalogGroup creates its layer members with given traits", function () {
  const mapServerUrl =
    "http://example.com/arcgis/rest/services/Residential_Dwelling_Density/MapServer";
  const rectangle = { east: 158, north: -8, south: -45, west: 109 };
  const initialMessage = {
    title: "Hint",
    content: "If map items can not be seen, zoom in further to reveal them.",
    confirmation: false
  };
  const featureInfoTemplate = {
    template: "{{Pixel Value}} people in the given radius."
  };
  const numberOfGroupMembers = 4;

  let terria: Terria;
  let group: ArcGisMapServerCatalogGroup;

  beforeEach(function () {
    terria = new Terria({
      baseUrl: "./"
    });
    group = new ArcGisMapServerCatalogGroup("test", terria);

    worker.use(
      http.get(
        "http://example.com/arcgis/rest/services/Residential_Dwelling_Density/MapServer",
        () => HttpResponse.json(residentialMapServerJson)
      )
    );
  });

  describe("loadMembers", function () {
    it("properly creates members with parent's traits", async function () {
      runInAction(() => {
        group.setTrait(CommonStrata.definition, "url", mapServerUrl);
        group.setTrait(CommonStrata.definition, "itemProperties", {
          rectangle: rectangle,
          initialMessage: initialMessage,
          featureInfoTemplate: featureInfoTemplate
        });
      });

      await group.loadMembers();

      for (let i = 0; i < numberOfGroupMembers; i++) {
        const member = group.memberModels[i] as ArcGisMapServerCatalogItem;

        expect(member.rectangle?.east).toEqual(rectangle.east);
        expect(member.rectangle?.north).toEqual(rectangle.north);
        expect(member.rectangle?.west).toEqual(rectangle.west);
        expect(member.rectangle?.south).toEqual(rectangle.south);

        expect(member.initialMessage?.title).toEqual(initialMessage.title);
        expect(member.initialMessage?.content).toEqual(initialMessage.content);
        expect(member.initialMessage?.confirmation).toEqual(
          initialMessage.confirmation
        );

        expect(member.featureInfoTemplate?.template).toEqual(
          featureInfoTemplate.template
        );
      }
    });
  });
});
