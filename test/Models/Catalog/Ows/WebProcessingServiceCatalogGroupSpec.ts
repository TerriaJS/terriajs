import i18next from "i18next";
import WebProcessingServiceCatalogFunction from "../../../../lib/Models/Catalog/Ows/WebProcessingServiceCatalogFunction";
import WebProcessingServiceCatalogGroup from "../../../../lib/Models/Catalog/Ows/WebProcessingServiceCatalogGroup";
import CommonStrata from "../../../../lib/Models/Definition/CommonStrata";
import Terria from "../../../../lib/Models/Terria";
import "../../../SpecMain";

const GetCapabilitiesXml = require("raw-loader!../../../../wwwroot/test/WPS/GetCapabilities.xml");

describe("WebProcessingServiceCatalogGroup", function () {
  let terria: Terria;
  let wpsGroup: WebProcessingServiceCatalogGroup;

  beforeEach(function () {
    terria = new Terria();
    wpsGroup = new WebProcessingServiceCatalogGroup("test", terria);
  });

  beforeEach(function setupAjax() {
    jasmine.Ajax.install();
  });

  afterEach(function () {
    jasmine.Ajax.uninstall();
  });

  it("should have a type and typeName", function () {
    expect(wpsGroup.type).toBe("wps-getCapabilities");
    expect(wpsGroup.typeName).toBe(
      i18next.t("models.webProcessingServiceCatalogGroup.typeName")
    );
  });

  describe("loadMembers", async function () {
    it("fetches the getCapabilities XML", async function () {
      wpsGroup.setTrait(CommonStrata.user, "url", "http://test/wps");
      jasmine.Ajax.stubRequest(
        "http://test/wps?service=WPS&request=GetCapabilities&version=1.0.0"
      ).andReturn({
        responseText: GetCapabilitiesXml
      });
      await wpsGroup.loadMembers();
      const request = jasmine.Ajax.requests.mostRecent();
      expect(request).toBeDefined(
        "No GetCapabilities request was made when loading members"
      );
      expect(request.url).toEqual(
        "http://test/wps?service=WPS&request=GetCapabilities&version=1.0.0"
      );
      expect(request.method).toEqual("GET");
    });

    it("proxies the request when proxy is enabled", async function () {
      wpsGroup.setTrait(CommonStrata.user, "url", "http://test/wps");
      wpsGroup.setTrait(CommonStrata.user, "forceProxy", true);
      jasmine.Ajax.stubRequest(
        "proxy/_1d/http://test/wps?service=WPS&request=GetCapabilities&version=1.0.0"
      ).andReturn({
        responseText: GetCapabilitiesXml
      });
      await wpsGroup.loadMembers();
      const request = jasmine.Ajax.requests.mostRecent();
      expect(request.url).toEqual(
        "proxy/_1d/http://test/wps?service=WPS&request=GetCapabilities&version=1.0.0"
      );
    });

    it("throws a TerriaError if no URL is defined", async function () {
      wpsGroup.setTrait(CommonStrata.user, "url", undefined);
      let error = (await wpsGroup.loadMembers()).error;

      expect(error).toBeDefined();
    });
  });

  describe("after loading metadata", function () {
    beforeEach(async function () {
      jasmine.Ajax.stubRequest(
        "http://test/wps?service=WPS&request=GetCapabilities&version=1.0.0"
      ).andReturn({
        responseText: GetCapabilitiesXml
      });
      wpsGroup.setTrait(CommonStrata.user, "url", "http://test/wps");
      await wpsGroup.loadMetadata();
    });

    it("has a name", function () {
      expect(wpsGroup.name).toEqual("AWAVEA WPS service");
    });

    it("populates info", function () {
      expect(
        wpsGroup.info.map(({ name, content }) => ({
          name,
          content
        }))
      ).toEqual([
        {
          name: i18next.t(
            "models.webProcessingServiceCatalogGroup.providerName"
          ),
          content: "CSIRO Ocean & Atmosphere"
        }
      ]);
    });
  });

  describe("after loading members", function () {
    beforeEach(async function () {
      jasmine.Ajax.stubRequest(
        "http://test/wps?service=WPS&request=GetCapabilities&version=1.0.0"
      ).andReturn({
        responseText: GetCapabilitiesXml
      });
      wpsGroup.setTrait(CommonStrata.user, "url", "http://test/wps");
      await wpsGroup.loadMembers();
    });

    it("creates a member for every process", async function () {
      expect(wpsGroup.members.length).toEqual(12);
    });

    describe("member", function () {
      let member: WebProcessingServiceCatalogFunction;

      beforeEach(function () {
        member = wpsGroup
          .memberModels[0] as WebProcessingServiceCatalogFunction;
      });

      it("has a url", function () {
        expect(member.url).toBe("http://test/wps");
      });

      it("has an identifier", function () {
        expect(member.identifier).toBe("monthly-variations");
      });

      it("has a name", function () {
        expect(member.name).toBe("Wave: Monthly Mean [hs,t0m1]");
      });

      it("has a description", function () {
        expect(member.description).toMatch(
          /This process operates on the variables Mean Wave Direction/
        );
      });

      it("inherits itemProperties from parent", async function () {
        wpsGroup.setTrait(CommonStrata.user, "itemProperties", {
          parameters: { test: "123" }
        });
        await wpsGroup.loadMembers();
        expect(member.parameters).toEqual({ test: "123" });
      });
    });
  });
});
