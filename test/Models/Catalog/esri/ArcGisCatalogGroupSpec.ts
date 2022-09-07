import { configure, runInAction } from "mobx";
import _loadWithXhr from "../../../../lib/Core/loadWithXhr";
import Terria from "../../../../lib/Models/Terria";
import ArcGisCatalogGroup from "../../../../lib/Models/Catalog/Esri/ArcGisCatalogGroup";
import CommonStrata from "../../../../lib/Models/Definition/CommonStrata";
import i18next from "i18next";
import ArcGisMapServerCatalogItem from "../../../../lib/Models/Catalog/Esri/ArcGisMapServerCatalogItem";
import TerriaError from "../../../../lib/Core/TerriaError";
import ArcGisMapServerCatalogGroup, {
  MapServerStratum
} from "../../../../lib/Models/Catalog/Esri/ArcGisMapServerCatalogGroup";
import ArcGisFeatureServerCatalogGroup, {
  FeatureServerStratum
} from "../../../../lib/Models/Catalog/Esri/ArcGisFeatureServerCatalogGroup";

configure({
  enforceActions: "observed",
  computedRequiresReaction: true
});

interface ExtendedLoadWithXhr {
  (): any;
  load: { (...args: any[]): any; calls: any };
}

const loadWithXhr: ExtendedLoadWithXhr = <any>_loadWithXhr;

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

    const realLoadWithXhr = loadWithXhr.load;
    // We replace calls to real servers with pre-captured JSON files so our testing is isolated, but reflects real data.
    spyOn(loadWithXhr, "load").and.callFake(function (...args: any[]) {
      let url = args[0];
      if (url.match("Redlands_Emergency_Vehicles/MapServer")) {
        url = url.replace(/^.*\/MapServer/, "MapServer");
        url = url.replace(/MapServer\/?\?f=json$/i, "mapServer.json");
        args[0] = "test/ArcGisMapServer/Redlands_Emergency_Vehicles/" + url;
      } else if (url.match("Redlands_Emergency_Vehicles/FeatureServer")) {
        url = url.replace(/^.*\/FeatureServer/, "FeatureServer");
        url = url.replace(/FeatureServer\/?\?f=json$/i, "featureServer.json");
        args[0] = "test/ArcGisFeatureServer/Redlands_Emergency_Vehicles/" + url;
      } else if (url.match("arcgis/rest/services/")) {
        url = url.replace(/^.*\/services/, "services");
        url = url.replace(/services\/?\?f=json$/i, "services.json");
        url = url.replace(/services\/AGP\/?\?.*/i, "AGP.json");
        url = url.replace(/services\/Elevation\/?\?.*/i, "Elevation.json");
        url = url.replace(
          /services\/911CallsHotspotMS\/MapServer\/?\?.*/i,
          "911CallsHotspotMS.json"
        );
        url = url.replace(
          /services\/CensusMS\/MapServer\/?\?.*/i,
          "CensusMS.json"
        );
        url = url.replace(
          /services\/CommercialDamageAssessmentFS\/FeatureServer\/?\?.*/i,
          "CommercialDamageAssessmentFS.json"
        );
        url = url.replace(
          /services\/CommercialDamageAssessmentMS\/MapServer\/?\?.*/i,
          "CommercialDamageAssessmentMS.json"
        );
        url = url.replace(
          /services\/CommunityAddressingFS\/FeatureServer\/?\?.*/i,
          "CommunityAddressingFS.json"
        );
        url = url.replace(
          /services\/CommunityAddressingMS\/MapServer\/?\?.*/i,
          "CommunityAddressingMS.json"
        );
        args[0] = "test/ArcGisServer/sampleserver6/" + url;
      }

      return realLoadWithXhr(...args);
    });
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

      let member0 = <ArcGisCatalogGroup>group.memberModels[0];
      let member1 = <ArcGisCatalogGroup>group.memberModels[1];
      let member2 = <ArcGisMapServerCatalogGroup>group.memberModels[2];
      let member3 = <ArcGisMapServerCatalogGroup>group.memberModels[3];
      let member4 = <ArcGisFeatureServerCatalogGroup>group.memberModels[4];
      let member5 = <ArcGisMapServerCatalogGroup>group.memberModels[5];
      let member6 = <ArcGisFeatureServerCatalogGroup>group.memberModels[6];
      let member7 = <ArcGisMapServerCatalogGroup>group.memberModels[7];

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
      const arcgisServerStratum = <MapServerStratum | undefined>(
        group.strata.get(MapServerStratum.stratumName)
      );
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
      const arcgisServerStratum = <FeatureServerStratum | undefined>(
        group.strata.get(FeatureServerStratum.stratumName)
      );
      expect(arcgisServerStratum).toBeDefined();
      expect(arcgisServerStratum instanceof FeatureServerStratum).toBeTruthy();
    });
  });
});
