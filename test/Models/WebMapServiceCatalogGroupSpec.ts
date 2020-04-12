import WebMapServiceCatalogGroup from "../../lib/Models/WebMapServiceCatalogGroup";
import { autorun, runInAction } from "mobx";
import Terria from "../../lib/Models/Terria";
import i18next from "i18next";
import WebMapServiceCatalogItem from "./../../dist/Models/WebMapServiceCatalogItem";

describe("WebMapServiceCatalogGroup", function() {
  let terria: Terria;
  let wms: WebMapServiceCatalogGroup;
  let wmsItem: WebMapServiceCatalogItem;

  beforeEach(function() {
    terria = new Terria();
    wms = new WebMapServiceCatalogGroup("test", terria);
  });

  it("has a type", function() {
    expect(wms.type).toBe("wms-group");
  });

  it("derives getCapabilitiesUrl from url if getCapabilitiesUrl is not specified", function() {
    wms.setTrait("definition", "url", "http://www.example.com");
    expect(wms.getCapabilitiesUrl).toBeDefined();
    expect(wms.url).toBeDefined();
    expect(
      wms.getCapabilitiesUrl &&
        wms.getCapabilitiesUrl.indexOf(wms.url || "undefined") === 0
    ).toBe(true);
  });

  describe("after loading capabilities", function() {
    beforeEach(async function() {
      runInAction(() => {
        wms.setTrait("definition", "url", "test/WMS/single_metadata_url.xml");
      });
    });

    it("defines name", async function() {
      await wms.loadMetadata();
      expect(wms.name).toBe("wms Server");
    });

    it("doesn't override user set name", async function() {
      const userDefinedName = "user defined name";
      runInAction(() => {
        wms.setTrait("definition", "name", userDefinedName);
      });
      await wms.loadMetadata();
      expect(wms.name).toBe(userDefinedName);
    });

    it("defines info", async function() {
      await wms.loadMetadata();
      const abstract = i18next.t("models.webMapServiceCatalogGroup.abstract");
      const accessConstraints = i18next.t(
        "models.webMapServiceCatalogGroup.accessConstraints"
      );
      const fees = i18next.t("models.webMapServiceCatalogGroup.fees");
      console.log(wms.info);
      expect(wms.info.map(({ name }) => name)).toEqual([
        abstract,
        accessConstraints,
        fees
      ]);

      expect(wms.info.map(({ content }) => content)).toEqual([
        "web map service foo bar test",
        "test",
        "test"
      ]);
    });
  });

  describe("loadMembers", function() {
    beforeEach(async function() {
      runInAction(() => {
        wms.setTrait("definition", "url", "test/WMS/single_metadata_url.xml");
      });
      await wms.loadMembers();
    });

    it("loads", async function() {
      expect(wms.members.length).toEqual(1);
      expect(wms.memberModels.length).toEqual(1);
      console.log(wms.members);
    });
  });
});
