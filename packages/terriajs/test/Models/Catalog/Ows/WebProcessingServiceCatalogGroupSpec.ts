import i18next from "i18next";
import { http, HttpResponse } from "msw";
import WebProcessingServiceCatalogFunction from "../../../../lib/Models/Catalog/Ows/WebProcessingServiceCatalogFunction";
import WebProcessingServiceCatalogGroup from "../../../../lib/Models/Catalog/Ows/WebProcessingServiceCatalogGroup";
import CommonStrata from "../../../../lib/Models/Definition/CommonStrata";
import Terria from "../../../../lib/Models/Terria";
import { worker } from "../../../mocks/browser";

import GetCapabilitiesXml from "../../../../wwwroot/test/WPS/GetCapabilities.xml";

describe("WebProcessingServiceCatalogGroup", function () {
  let terria: Terria;
  let wpsGroup: WebProcessingServiceCatalogGroup;

  beforeEach(function () {
    terria = new Terria();
    wpsGroup = new WebProcessingServiceCatalogGroup("test", terria);
  });

  it("should have a type and typeName", function () {
    expect(wpsGroup.type).toBe("wps-getCapabilities");
    expect(wpsGroup.typeName).toBe(
      i18next.t("models.webProcessingServiceCatalogGroup.typeName")
    );
  });

  describe("loadMembers", function () {
    it("fetches the getCapabilities XML", async function () {
      wpsGroup.setTrait(CommonStrata.user, "url", "http://example.com/wps");
      worker.use(
        http.get("http://example.com/wps", ({ request }) => {
          const url = new URL(request.url);
          if (
            url.searchParams.get("service") !== "WPS" ||
            url.searchParams.get("request") !== "GetCapabilities" ||
            url.searchParams.get("version") !== "1.0.0"
          ) {
            return HttpResponse.error();
          }
          return new HttpResponse(GetCapabilitiesXml, {
            headers: { "Content-Type": "text/xml" }
          });
        })
      );
      const result = await wpsGroup.loadMembers();
      expect(result.error).toBeUndefined();
    });

    it("proxies the request when proxy is enabled", async function () {
      wpsGroup.setTrait(CommonStrata.user, "url", "http://example.com/wps");
      wpsGroup.setTrait(CommonStrata.user, "forceProxy", true);
      worker.use(
        http.get(/\/proxy\/_1d\/http:\/\/example\.com\/wps/, ({ request }) => {
          const url = new URL(request.url);
          if (
            url.searchParams.get("service") !== "WPS" ||
            url.searchParams.get("request") !== "GetCapabilities" ||
            url.searchParams.get("version") !== "1.0.0"
          ) {
            return HttpResponse.error();
          }
          return new HttpResponse(GetCapabilitiesXml, {
            headers: { "Content-Type": "text/xml" }
          });
        })
      );
      const result = await wpsGroup.loadMembers();
      expect(result.error).toBeUndefined();
    });

    it("throws a TerriaError if no URL is defined", async function () {
      wpsGroup.setTrait(CommonStrata.user, "url", undefined);
      const error = (await wpsGroup.loadMembers()).error;

      expect(error).toBeDefined();
    });
  });

  describe("after loading metadata", function () {
    beforeEach(async function () {
      worker.use(
        http.get(
          "http://example.com/wps",
          () =>
            new HttpResponse(GetCapabilitiesXml, {
              headers: { "Content-Type": "text/xml" }
            })
        )
      );
      wpsGroup.setTrait(CommonStrata.user, "url", "http://example.com/wps");
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
      worker.use(
        http.get(
          "http://example.com/wps",
          () =>
            new HttpResponse(GetCapabilitiesXml, {
              headers: { "Content-Type": "text/xml" }
            })
        )
      );
      wpsGroup.setTrait(CommonStrata.user, "url", "http://example.com/wps");
      await wpsGroup.loadMembers();
    });

    it("creates a member for every process", function () {
      expect(wpsGroup.members.length).toEqual(12);
    });

    describe("member", function () {
      let member: WebProcessingServiceCatalogFunction;

      beforeEach(function () {
        member = wpsGroup
          .memberModels[0] as WebProcessingServiceCatalogFunction;
      });

      it("has a url", function () {
        expect(member.url).toBe("http://example.com/wps");
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
